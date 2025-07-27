import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Edit,
  Eye,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { alertSuccess, alertFail } from "../../hooks/useNotification";
import ApiService from "../../services/apiService";

const StaffMeeting = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form data for adding new appointment
  const [newAppointment, setNewAppointment] = useState({
    consultantId: "",
    memberId: "",
    scheduleId: "",
    slotId: "",
    appointmentDate: "",
    description: "",
  });

  // Available schedules for selected consultant
  const [availableSchedules, setAvailableSchedules] = useState([]);

  // Auto-cancel expired appointments
  const checkAndCancelExpiredAppointments = async (appointments) => {
    const now = new Date();
    const expiredAppointments = [];

    appointments.forEach((appointment) => {
      if (appointment.status === "BOOKED") {
        // Find the schedule for this appointment
        const schedule = schedules.find((s) => s.id === appointment.scheduleId);
        if (schedule && schedule.slot) {
          const appointmentDate = new Date(appointment.appointmentDate);
          const slotEnd = schedule.slot.slotEnd;

          if (slotEnd) {
            const [hours, minutes] = slotEnd.split(":").map(Number);
            const appointmentEndTime = new Date(appointmentDate);
            appointmentEndTime.setHours(hours, minutes, 0, 0);

            // Add 15 minutes buffer after slot end time
            const expiryTime = new Date(
              appointmentEndTime.getTime() + 15 * 60 * 1000
            );

            if (now > expiryTime) {
              expiredAppointments.push(appointment.id);
            }
          }
        }
      }
    });

    // Auto-cancel expired appointments
    if (expiredAppointments.length > 0) {
      try {
        await Promise.all(
          expiredAppointments.map((appointmentId) =>
            ApiService.updateAppointmentStatus(appointmentId, "CANCELLED")
          )
        );

        // Update local state
        setAppointments((prev) =>
          prev.map((apt) =>
            expiredAppointments.includes(apt.id)
              ? { ...apt, status: "CANCELLED" }
              : apt
          )
        );

        console.log(
          `Auto-cancelled ${expiredAppointments.length} expired appointments`
        );
      } catch (error) {
        console.error("Error auto-cancelling expired appointments:", error);
      }
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appointments, schedules, consultants, accounts] =
        await Promise.all([
          ApiService.getAppointments(),
          ApiService.getSchedules(),
          ApiService.getConsultants(),
          ApiService.getAllAccounts(),
        ]);

      setAppointments(appointments || []);
      setSchedules(schedules || []);
      setConsultants(consultants || []);
      // Lọc chỉ lấy members (role = MEMBER)
      const membersOnly = (accounts || []).filter(
        (account) => account.role === "MEMBER"
      );
      setMembers(membersOnly);

      // Check and auto-cancel expired appointments
      await checkAndCancelExpiredAppointments(appointments || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      if (err.message !== "Unauthorized") {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        alertFail("Không thể tải dữ liệu. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check for expired appointments every 5 minutes
  useEffect(() => {
    if (appointments.length > 0 && schedules.length > 0) {
      const interval = setInterval(() => {
        checkAndCancelExpiredAppointments(appointments);
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [appointments, schedules]);

  // Fetch available schedules when consultant is selected
  useEffect(() => {
    if (newAppointment.consultantId) {
      fetchConsultantSchedules(newAppointment.consultantId);
    } else {
      setAvailableSchedules([]);
    }
  }, [newAppointment.consultantId]);

  const fetchConsultantSchedules = async (consultantId) => {
    try {
      const schedules = await ApiService.getConsultantSchedules(consultantId);
      setAvailableSchedules(schedules);
    } catch (error) {
      console.error("Lỗi khi tải lịch tư vấn viên:", error);
      setAvailableSchedules([]);
    }
  };

  // Helper functions
  const getConsultantName = (consultantId, appointment = null) => {
    const consultant = consultants.find((c) => c.id === consultantId);
    if (!consultant) {
      console.warn(`Không tìm thấy tư vấn viên với ID: ${consultantId}`);
      console.log("Danh sách tư vấn viên:", consultants);
      return appointment?.consultantName || `Tư vấn viên ${consultantId}`;
    }
    return (
      consultant.name ||
      appointment?.consultantName ||
      `Tư vấn viên ${consultantId}`
    );
  };

  const getMemberName = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    return member?.name || `Thành viên ${memberId}`;
  };

  // Format time helper
  const formatTime = (timeString) => {
    try {
      const parts = timeString.split(":");
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`; // Trả về "HH:mm"
      }
      console.warn("Định dạng thời gian không hợp lệ:", timeString);
      return timeString || "N/A"; // Trả về chuỗi gốc hoặc "N/A"
    } catch (error) {
      console.error("Lỗi định dạng thời gian:", error);
      return timeString || "N/A"; // Trả về chuỗi gốc hoặc "N/A"
    }
  };

  const getScheduleInfo = (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) {
      console.warn(`Không tìm thấy lịch với ID: ${scheduleId}`);
      return { date: "N/A", time: "N/A" };
    }

    const slot = schedule.slot;
    if (!slot || !slot.slotStart || !slot.slotEnd) {
      console.warn(`Lịch ID ${scheduleId} thiếu thông tin slot:`, slot);
      return { date: schedule.date || "N/A", time: "N/A" };
    }

    const startTime = formatTime(slot.slotStart);
    const endTime = formatTime(slot.slotEnd);

    return {
      date: schedule.date || "N/A",
      time: `${startTime} - ${endTime}`,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "BOOKED":
        return "bg-yellow-100 text-yellow-800";
      case "CONSULTED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "BOOKED":
        return "Đã Đặt";
      case "CONSULTED":
        return "Đã Tư Vấn";
      case "CANCELLED":
        return "Đã Hủy";
      default:
        return status;
    }
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        String(appointment.id).includes(searchTerm) ||
        (appointment.accountName || getMemberName(appointment.accountId))
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (
          appointment.consultantName ||
          getConsultantName(appointment.consultantId, appointment)
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        appointment.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "all" || appointment.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [appointments, searchTerm, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const totalToday = appointments.filter(
      (appt) => appt.appointmentDate === today
    ).length;
    const bookedCount = appointments.filter(
      (appt) => appt.status === "BOOKED"
    ).length;
    const cancelledCount = appointments.filter(
      (appt) => appt.status === "CANCELLED"
    ).length;
    const consultedCount = appointments.filter(
      (appt) => appt.status === "CONSULTED"
    ).length;

    return { totalToday, bookedCount, cancelledCount, consultedCount };
  }, [appointments]);

  // Group schedules by date
  const groupSchedulesByDate = (schedules) => {
    const grouped = {};
    schedules.forEach((schedule) => {
      if (!grouped[schedule.date]) {
        grouped[schedule.date] = [];
      }
      grouped[schedule.date].push(schedule);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDate(availableSchedules);

  // Handle add appointment
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!newAppointment.memberId) {
        alertFail("Vui lòng chọn thành viên để tư vấn");
        return;
      }

      const payload = {
        consultantId: Number.parseInt(newAppointment.consultantId),
        accountId: Number.parseInt(newAppointment.memberId),
        appointmentDate: newAppointment.appointmentDate,
        slotId: Number.parseInt(newAppointment.slotId),
        scheduleId: Number.parseInt(newAppointment.scheduleId),
        description: newAppointment.description,
      };

      console.log("Tạo lịch hẹn cho thành viên:", {
        selectedMember: members.find(
          (m) => m.id === Number.parseInt(newAppointment.memberId)
        ),
        payload,
      });

      await ApiService.createAppointment(payload);

      // Làm mới dữ liệu
      await fetchAllData();

      // Đặt lại form và đóng modal
      setNewAppointment({
        consultantId: "",
        memberId: "",
        scheduleId: "",
        slotId: "",
        appointmentDate: "",
        description: "",
      });
      setShowAddModal(false);

      alertSuccess("Thêm lịch hẹn thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm lịch hẹn:", error);
      alertFail(`Có lỗi xảy ra khi thêm lịch hẹn: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    // Thêm xác nhận khi hủy
    if (newStatus === "CANCELLED") {
      if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) {
        return;
      }
    }

    try {
      setIsUpdating(true); // Bật trạng thái đang xử lý
      await ApiService.updateAppointmentStatus(appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      setShowEditModal(false);
      alertSuccess("Cập nhật trạng thái thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      alertFail(`Có lỗi xảy ra khi cập nhật trạng thái: ${error.message}`);
    } finally {
      setIsUpdating(false); // Tắt trạng thái đang xử lý
    }
  };

  // Handle consultant selection
  const handleConsultantChange = (consultantId) => {
    setNewAppointment((prev) => ({
      ...prev,
      consultantId,
      appointmentDate: "",
      scheduleId: "",
      slotId: "",
    }));
  };

  // Handle schedule selection
  const handleScheduleSelect = (schedule) => {
    setNewAppointment((prev) => ({
      ...prev,
      scheduleId: schedule.id,
      slotId: schedule.slotId,
      appointmentDate: schedule.date,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-red-600">Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý buổi tư vấn
        </h1>
        <p className="text-gray-600">Quản lý các buổi tư vấn đã lên lịch</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalToday}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã Đặt</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.bookedCount}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã Hủy</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.cancelledCount}
              </p>
            </div>
            <X className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã Tư Vấn</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.consultedCount}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="BOOKED">Đã Đặt</option>
                <option value="CONSULTED">Đã Tư Vấn</option>
                <option value="CANCELLED">Đã Hủy</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm buổi tư vấn</span>
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tư vấn viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link Meeting
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => {
                const scheduleInfo = getScheduleInfo(appointment.scheduleId);
                const isToday =
                  scheduleInfo.date === new Date().toISOString().split("T")[0];
                const hasMeetingLink = appointment.meetingLink;

                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.accountName ||
                              getMemberName(appointment.accountId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.consultantName ||
                          getConsultantName(
                            appointment.consultantId,
                            appointment
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {scheduleInfo.date}
                      </div>
                      <div className="text-sm text-gray-500">
                        {scheduleInfo.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasMeetingLink ? (
                        <a
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          <span className="text-sm">Tham gia</span>
                        </a>
                      ) : isToday && appointment.status === "BOOKED" ? (
                        <span className="text-sm text-orange-600">
                          Chờ check-in
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Chưa có link
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Cập nhật trạng thái"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không tìm thấy buổi tư vấn nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Thêm buổi tư vấn mới
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tư vấn viên *
                    </label>
                    <select
                      value={newAppointment.consultantId}
                      onChange={(e) => handleConsultantChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn tư vấn viên</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.id}>
                          {consultant.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành viên *
                    </label>
                    <select
                      value={newAppointment.memberId}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          memberId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn thành viên</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} - {member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hiển thị thông tin đã chọn */}
                {(newAppointment.consultantId || newAppointment.memberId) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Thông tin đã chọn:
                    </h4>
                    {newAppointment.consultantId && (
                      <p className="text-sm text-blue-700">
                        <strong>Tư vấn viên:</strong>{" "}
                        {
                          consultants.find(
                            (c) =>
                              c.id ===
                              Number.parseInt(newAppointment.consultantId)
                          )?.name
                        }
                      </p>
                    )}
                    {newAppointment.memberId && (
                      <p className="text-sm text-blue-700">
                        <strong>Khách hàng:</strong>{" "}
                        {
                          members.find(
                            (m) =>
                              m.id === Number.parseInt(newAppointment.memberId)
                          )?.name
                        }{" "}
                        -{" "}
                        {
                          members.find(
                            (m) =>
                              m.id === Number.parseInt(newAppointment.memberId)
                          )?.email
                        }
                      </p>
                    )}
                  </div>
                )}

                {newAppointment.consultantId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn khung giờ *
                    </label>
                    {Object.keys(groupedSchedules).length === 0 ? (
                      <div className="text-center py-8 border border-gray-200 rounded-lg">
                        <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          Chưa có lịch cho tư vấn viên này
                        </p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="space-y-4">
                          {Object.entries(groupedSchedules)
                            .sort(([a], [b]) => new Date(a) - new Date(b))
                            .map(([date, schedules]) => (
                              <div key={date}>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                  {new Date(date).toLocaleDateString("vi-VN", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {schedules.map((schedule) => {
                                    const isSelected =
                                      newAppointment.scheduleId === schedule.id;
                                    const isBooked = schedule.bookedStatus;

                                    return (
                                      <button
                                        key={schedule.id}
                                        type="button"
                                        onClick={() =>
                                          !isBooked &&
                                          handleScheduleSelect(schedule)
                                        }
                                        disabled={isBooked}
                                        className={`p-2 border rounded-lg text-center transition-colors text-sm relative ${
                                          isBooked
                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                            : isSelected
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          <span>
                                            {formatTime(
                                              schedule.slot?.slotStart
                                            )}{" "}
                                            -{" "}
                                            {formatTime(schedule.slot?.slotEnd)}
                                          </span>
                                        </div>
                                        {isBooked && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
                                            <span className="text-xs font-medium text-red-600">
                                              Đã đặt
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {newAppointment.consultantId &&
                  Object.keys(groupedSchedules).length > 0 && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                        <span>Có thể đặt</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                        <span>Đã chọn</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                        <span>Đã đặt</span>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={newAppointment.description}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Nhập ghi chú..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !newAppointment.scheduleId ||
                      !newAppointment.memberId
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang xử lý..." : "Thêm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Chi tiết buổi tư vấn
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID
                  </label>
                  <p className="text-sm text-gray-900">
                    #{selectedAppointment.id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Khách hàng
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAppointment.accountName ||
                      getMemberName(selectedAppointment.accountId)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tư vấn viên
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAppointment.consultantName ||
                      getConsultantName(
                        selectedAppointment.consultantId,
                        selectedAppointment
                      )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Thời gian
                  </label>
                  <p className="text-sm text-gray-900">
                    {(() => {
                      const scheduleInfo = getScheduleInfo(
                        selectedAppointment.scheduleId
                      );
                      return `${scheduleInfo.date} - ${scheduleInfo.time}`;
                    })()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedAppointment.status
                    )}`}
                  >
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>

                {selectedAppointment.meetingLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Link Meeting
                    </label>
                    <a
                      href={selectedAppointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm break-all"
                    >
                      {selectedAppointment.meetingLink}
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ghi chú
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAppointment.description || "Không có ghi chú"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ngày tạo
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAppointment.createAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Cập nhật trạng thái
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buổi tư vấn #{selectedAppointment.id}
                  </label>
                  <p className="text-sm text-gray-600">
                    {selectedAppointment.accountName ||
                      getMemberName(selectedAppointment.accountId)}{" "}
                    -{" "}
                    {selectedAppointment.consultantName ||
                      getConsultantName(
                        selectedAppointment.consultantId,
                        selectedAppointment
                      )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái hiện tại
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedAppointment.status
                    )}`}
                  >
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cập nhật trạng thái
                  </label>
                  <div className="space-y-2">
                    {["BOOKED", "CONSULTED", "CANCELLED"].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          handleUpdateStatus(selectedAppointment.id, status)
                        }
                        disabled={
                          selectedAppointment.status === status || isUpdating
                        }
                        className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                          selectedAppointment.status === status || isUpdating
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${getStatusColor(
                            status
                          )}`}
                        >
                          {getStatusText(status)}
                        </span>
                        {status === "BOOKED" && "Đặt lịch"}
                        {status === "CONSULTED" && "Hoàn thành tư vấn"}
                        {status === "CANCELLED" && "Hủy lịch hẹn"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isUpdating}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffMeeting;