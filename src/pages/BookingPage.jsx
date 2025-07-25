import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Breadcrumb from "../components/Breadcrumb";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Users,
  Award,
  Search,
  Lock,
} from "lucide-react";
import GoogleMeetInfo from "../components/GoogleMeetInfo";
import ApiService from "../services/apiService";
import { alertSuccess, alertFail } from "../hooks/useNotification";

const BookingPage = () => {
  const { consultantId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // State for all steps
  const [currentStep, setCurrentStep] = useState(consultantId ? 2 : 1);
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);
  const [loadingMemberInfo, setLoadingMemberInfo] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    notes: "",
  });

  // Fetch member information from API
  const fetchMemberInfo = async () => {
    if (!user?.id) return;

    try {
      setLoadingMemberInfo(true);
      const memberData = await ApiService.getAccountById(user.id);

      setMemberInfo(memberData);
      setFormData({
        name: memberData.name || "",
        email: memberData.email || "",
        phone: memberData.phone || "",
        address: memberData.address || "",
        date_of_birth: memberData.dateOfBirth || "",
        gender: memberData.gender || "",
        notes: "",
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin thành viên:", error);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        date_of_birth: "",
        gender: "",
        notes: "",
      });
    } finally {
      setLoadingMemberInfo(false);
    }
  };

  // Kiểm tra lịch đã được đặt dựa vào bookedStatus
  const isScheduleBooked = (schedule) => {
    if (schedule.hasOwnProperty("bookedStatus")) {
      return schedule.bookedStatus; // True nếu đã đặt, false nếu chưa
    }
    console.warn(`Lịch ID ${schedule.id} thiếu bookedStatus`);
    return false; // Mặc định chưa đặt nếu thiếu bookedStatus
  };

  // Fetch member info when user is available
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchMemberInfo();
    }
  }, [isAuthenticated, user?.id]);

  // Fetch consultants and selected consultant if consultantId is provided
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy danh sách chuyên gia
        const data = await ApiService.getConsultants();
        setConsultants(data);
        setFilteredConsultants(data);

        // Nếu có consultantId, chọn chuyên gia và lấy lịch
        if (consultantId) {
          const foundConsultant = data.find(
            (c) => c.id === Number.parseInt(consultantId)
          );
          if (!foundConsultant) {
            throw new Error("Không tìm thấy chuyên gia");
          }
          setSelectedConsultant(foundConsultant);

          // Lấy lịch trống của chuyên gia
          const schedules = await ApiService.getConsultantSchedules(
            foundConsultant.consultant_id
          );
          setAvailableSchedules(schedules);
        }

        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Lỗi khi lấy dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [consultantId]);

  // Filter consultants based on search query and specialty
  useEffect(() => {
    if (!consultants.length) return;

    let results = consultants;

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (consultant) =>
          consultant.name.toLowerCase().includes(query) ||
          consultant.field_of_study.toLowerCase().includes(query) ||
          consultant.specialties?.some((specialty) =>
            specialty.toLowerCase().includes(query)
          )
      );
    }

    // Lọc theo chuyên môn
    if (selectedSpecialty !== "all") {
      results = results.filter(
        (consultant) =>
          consultant.field_of_study.toLowerCase() ===
            selectedSpecialty.toLowerCase() ||
          consultant.specialties?.some(
            (specialty) =>
              specialty.toLowerCase() === selectedSpecialty.toLowerCase()
          )
      );
    }

    setFilteredConsultants(results);
  }, [searchQuery, selectedSpecialty, consultants]);

  // Lấy danh sách các chuyên môn duy nhất
  const getAllSpecialties = () => {
    const specialties = new Set();
    specialties.add("all");

    consultants.forEach((consultant) => {
      specialties.add(consultant.field_of_study.toLowerCase());
      consultant.specialties?.forEach((specialty) => {
        specialties.add(specialty.toLowerCase());
      });
    });

    return Array.from(specialties);
  };

  const handleConsultantSelect = async (consultant) => {
    setSelectedConsultant(consultant);
    setLoading(true);

    try {
      // Lấy lịch của chuyên gia
      const schedules = await ApiService.getConsultantSchedules(
        consultant.consultant_id
      );
      setAvailableSchedules(schedules);
    } catch (error) {
      console.error("Lỗi khi tải lịch:", error);
      setAvailableSchedules([]);
    } finally {
      setLoading(false);
    }

    // Cập nhật URL mà không tải lại trang
    navigate(`/booking/${consultant.id}`, { replace: true });

    // Chuyển sang bước tiếp theo
    setCurrentStep(2);
  };

  // Hàm định dạng thời gian
  const formatTime = (timeString) => {
    try {
      // Giả định timeString là dạng "HH:mm:ss" hoặc "HH:mm"
      const parts = timeString.split(":");
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`; // Trả về "HH:mm"
      }
      console.warn("Định dạng thời gian không hợp lệ:", timeString);
      return timeString; // Trả về chuỗi gốc nếu không đúng định dạng
    } catch (error) {
      console.error("Lỗi định dạng thời gian:", error);
      return timeString; // Trả về chuỗi gốc nếu có lỗi
    }
  };

  // Add this function after the formatTime function
  const filterFutureSchedules = (schedules) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    return schedules.filter((schedule) => {
      const scheduleDate = schedule.date;

      // If schedule is in the future (different date), include it
      if (scheduleDate > currentDate) {
        return true;
      }

      // If schedule is today, check if the time slot is in the future
      if (scheduleDate === currentDate) {
        const slotStart = schedule.slot?.slotStart;
        if (slotStart) {
          const [hours, minutes] = slotStart.split(":").map(Number);
          const slotStartMinutes = hours * 60 + minutes;
          return slotStartMinutes > currentTime;
        }
      }

      // If schedule is in the past, exclude it
      return false;
    });
  };

  const handleScheduleSelect = (schedule) => {
    // Check if schedule is in the past
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (
      schedule.date < currentDate ||
      (schedule.date === currentDate && schedule.slot?.slotStart)
    ) {
      const [hours, minutes] = schedule.slot.slotStart.split(":").map(Number);
      const slotStartMinutes = hours * 60 + minutes;
      if (schedule.date === currentDate && slotStartMinutes <= currentTime) {
        alertFail(
          "Không thể đặt lịch trong quá khứ. Vui lòng chọn khung giờ khác."
        );
        return;
      }
    }

    // Không cho phép chọn lịch đã đặt
    if (isScheduleBooked(schedule)) {
      alertFail(
        `Khung giờ ${formatTime(schedule.slot.slotStart)} - ${formatTime(
          schedule.slot.slotEnd
        )} ngày ${new Date(schedule.date).toLocaleDateString(
          "vi-VN"
        )} đã được đặt. Vui lòng chọn khung giờ khác.`
      );
      return;
    }
    setSelectedSchedule(schedule);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedConsultant) {
      alertFail("Vui lòng chọn chuyên gia tư vấn");
      return;
    }

    if (currentStep === 2 && !selectedSchedule) {
      alertFail("Vui lòng chọn khung giờ tư vấn");
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep === 2 && !consultantId) {
      setCurrentStep(1);
      navigate("/booking", { replace: true });
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const validateForm = () => {
    const requiredFields = ["name", "email", "phone"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (missingFields.length > 0) {
      alertFail(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(", ")}`);
      return false;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alertFail("Vui lòng nhập email hợp lệ");
      return false;
    }

    return true;
  };

  const handleBookingSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Tìm slotId và scheduleId từ selectedSchedule
      const slotId = selectedSchedule.slotId;
      const scheduleId = selectedSchedule.id;
      if (!slotId || !scheduleId) {
        throw new Error("Không tìm thấy slot ID hoặc schedule ID");
      }

      const appointmentData = {
        slotId: slotId,
        scheduleId: scheduleId,
        consultantId: selectedConsultant.consultant_id,
        description: formData.notes || "",
        appointmentDate: selectedSchedule.date,
      };

      await ApiService.createAppointment(appointmentData);

      alertSuccess(
        "Đặt lịch thành công! Chúng tôi sẽ gửi thông tin chi tiết qua email."
      );
      setBookingSuccess(true);
      setCurrentStep(5);
    } catch (err) {
      alertFail(err.message || "Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.");
      console.error("Lỗi khi đặt lịch:", err);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra xác thực
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Vui lòng đăng nhập
          </h1>
          <p className="text-gray-600 mb-6">
            Bạn cần đăng nhập để đặt lịch tư vấn
          </p>
          <Link
            to="/login"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Trạng thái đang tải
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái lỗi
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <Link
            to="/consultation"
            className="text-emerald-600 hover:text-emerald-700"
          >
            ← Quay lại trang tư vấn
          </Link>
        </div>
      </div>
    );
  }

  // Trạng thái thành công
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-emerald-600 mb-6">
              <CheckCircle className="w-20 h-20 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Đặt lịch thành công!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Lịch tư vấn của bạn đã được xác nhận. Chúng tôi sẽ gửi thông tin
              chi tiết qua email.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-800 mb-4">
                Thông tin lịch hẹn:
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Chuyên gia:</span>{" "}
                  {selectedConsultant.name}
                </p>
                <p>
                  <span className="font-medium">Ngày:</span>{" "}
                  {new Date(selectedSchedule.date).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <span className="font-medium">Giờ:</span>{" "}
                  {formatTime(selectedSchedule.slot.slotStart)} -{" "}
                  {formatTime(selectedSchedule.slot.slotEnd)}
                </p>
                <p>
                  <span className="font-medium">Hình thức:</span> Tư vấn trực
                  tuyến qua Google Meet
                </p>
                <p>
                  <span className="font-medium">Link Google Meet:</span> Sẽ được
                  gửi qua email trước buổi tư vấn 15 phút
                </p>
                {formData.notes && (
                  <p>
                    <span className="font-medium">Ghi chú:</span>{" "}
                    {formData.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/my-appointments")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Xem lịch hẹn của tôi
              </button>
              <Link
                to="/consultation"
                className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold transition-colors text-center"
              >
                Đặt lịch khác
              </Link>
              <Link
                to="/"
                className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors text-center"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nhóm lịch theo ngày
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

  const groupedSchedules = selectedConsultant
    ? groupSchedulesByDate(filterFutureSchedules(availableSchedules))
    : {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Tư vấn", href: "/consultation" },
          ...(selectedConsultant
            ? [
                {
                  label: selectedConsultant.name,
                  href: `/consultants/${selectedConsultant.id}`,
                },
              ]
            : []),
          { label: "Đặt lịch hẹn" },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Thanh tiến trình */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center">
            {[
              { step: 1, label: "Chọn chuyên gia" },
              { step: 2, label: "Chọn thời gian" },
              { step: 3, label: "Xác nhận thông tin" },
              { step: 4, label: "Hoàn tất" },
            ].map((item, index, array) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= item.step
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.step}
                </div>
                <div
                  className={`text-sm font-medium ml-2 ${
                    currentStep >= item.step
                      ? "text-emerald-600"
                      : "text-gray-600"
                  }`}
                >
                  {item.label}
                </div>
                {index < array.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-4 ${
                      currentStep > item.step ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bước 1: Chọn chuyên gia */}
        {currentStep === 1 && (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Chọn chuyên gia tư vấn
              </h1>
              <p className="text-lg text-gray-600">
                Chọn chuyên gia phù hợp với nhu cầu của bạn để đặt lịch tư vấn
                trực tuyến qua Google Meet
              </p>
            </div>

            {/* Thông tin Google Meet */}
            <div className="mb-8">
              <GoogleMeetInfo />
            </div>

            {/* Tìm kiếm và lọc */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Tìm kiếm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm chuyên gia
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên, chuyên môn..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Lọc theo chuyên môn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lọc theo chuyên môn
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {getAllSpecialties().map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty === "all"
                          ? "Tất cả chuyên môn"
                          : specialty.charAt(0).toUpperCase() +
                            specialty.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Danh sách chuyên gia */}
            {filteredConsultants.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <AlertCircle className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Không tìm thấy chuyên gia phù hợp
                </h3>
                <p className="text-gray-600 mb-4">
                  Vui lòng thử lại với tiêu chí tìm kiếm khác
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpecialty("all");
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConsultants.map((consultant) => (
                  <div
                    key={consultant.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full"
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                          {consultant.avatar ||
                            consultant.name?.charAt(0) ||
                            "C"}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {consultant.name}
                        </h3>
                        <p className="text-emerald-600 font-medium mb-2">
                          {consultant.field_of_study}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {consultant.experience}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Award className="w-4 h-4 mr-2 text-emerald-600" />
                          <span>{consultant.degree_level}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-emerald-600" />
                          <span>
                            {consultant.consultations || 0} buổi tư vấn
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="flex items-center mr-2">
                            <span className="text-yellow-500">★</span>
                          </div>
                          <span>{consultant.rating || 5.0}/5.0</span>
                        </div>
                      </div>

                      <div className="mb-4 flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          Chuyên môn:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {consultant.specialties
                            ?.slice(0, 2)
                            .map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            )) || (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                              {consultant.field_of_study}
                            </span>
                          )}
                          {consultant.specialties?.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{consultant.specialties.length - 2}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link
                          to={`/consultants/${consultant.id}`}
                          className="flex-1 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-2 px-4 rounded-lg font-medium transition-colors text-center"
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          onClick={() => handleConsultantSelect(consultant)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          Chọn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bước 2: Chọn thời gian tư vấn */}
        {currentStep === 2 && selectedConsultant && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Chọn thời gian tư vấn
              </h1>
              <p className="text-lg text-gray-600">
                Chọn khung giờ phù hợp với lịch trình của bạn
              </p>
            </div>

            {/* Thông tin chuyên gia được chọn */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                  {selectedConsultant.avatar ||
                    selectedConsultant.name?.charAt(0) ||
                    "C"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedConsultant.name}
                  </h3>
                  <p className="text-emerald-600 font-medium">
                    {selectedConsultant.field_of_study}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {selectedConsultant.experience}
                  </p>
                </div>
              </div>
            </div>

            {/* Khung giờ có sẵn */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Khung giờ có sẵn
              </h3>

              {Object.keys(groupedSchedules).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <Calendar className="w-16 h-16 mx-auto" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Chưa có lịch trống
                  </h4>
                  <p className="text-gray-600">
                    Chuyên gia này hiện chưa có khung giờ trống. Vui lòng chọn
                    chuyên gia khác hoặc quay lại sau.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSchedules)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, schedules]) => (
                      <div key={date}>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">
                          {new Date(date).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {schedules.map((schedule) => {
                            const isBooked = isScheduleBooked(schedule);
                            const isSelected =
                              selectedSchedule?.id === schedule.id;
                            return (
                              <button
                                key={schedule.id}
                                onClick={() => handleScheduleSelect(schedule)}
                                disabled={isBooked}
                                className={`p-3 border rounded-lg text-center transition-colors ${
                                  isBooked
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                                    : isSelected
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
                                }`}
                              >
                                <div className="flex items-center justify-center">
                                  {isBooked ? (
                                    <Lock className="w-4 h-4 mr-1" />
                                  ) : (
                                    <Clock className="w-4 h-4 mr-1" />
                                  )}
                                  <span className="font-medium">
                                    {formatTime(schedule.slot.slotStart)} -{" "}
                                    {formatTime(schedule.slot.slotEnd)}
                                    {isBooked && (
                                      <span className="text-xs text-gray-600 ml-1">
                                        (Đã đặt)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Nút điều hướng */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedSchedule}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedSchedule
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Tiếp tục →
              </button>
            </div>
          </div>
        )}

        {/* Bước 3: Xác nhận thông tin */}
        {currentStep === 3 && selectedConsultant && selectedSchedule && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Xác nhận thông tin
              </h1>
              <p className="text-lg text-gray-600">
                Kiểm tra lại thông tin trước khi hoàn tất đặt lịch
              </p>
            </div>

            <div className="space-y-6">
              {/* Thông tin lịch hẹn */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Thông tin lịch hẹn
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-3">
                        {selectedConsultant.avatar ||
                          selectedConsultant.name?.charAt(0) ||
                          "C"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {selectedConsultant.name}
                        </h4>
                        <p className="text-emerald-600 text-sm">
                          {selectedConsultant.field_of_study}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>
                        {new Date(selectedSchedule.date).toLocaleDateString(
                          "vi-VN",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>
                        {formatTime(selectedSchedule.slot.slotStart)} -{" "}
                        {formatTime(selectedSchedule.slot.slotEnd)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>Tư vấn trực tuyến qua Google Meet</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin cá nhân */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Thông tin cá nhân
                  {loadingMemberInfo && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Đang tải...)
                    </span>
                  )}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="Nhập họ và tên"
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="Nhập email"
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="Nhập số điện thoại"
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      disabled
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="Nhập địa chỉ"
                      disabled
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú về vấn đề cần tư vấn{" "}
                      <span className="text-gray-500">(tùy chọn)</span>
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Mô tả ngắn gọn về vấn đề bạn muốn tư vấn để chuyên gia có thể chuẩn bị tốt hơn..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin Google Meet */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">
                      Thông tin quan trọng
                    </h4>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>
                        • Link Google Meet sẽ được gửi qua email trước buổi tư
                        vấn 15 phút
                      </li>
                      <li>
                        • Vui lòng kiểm tra email và chuẩn bị thiết bị có
                        camera, micro
                      </li>
                      <li>
                        • Nếu cần hủy hoặc đổi lịch, vui lòng liên hệ trước 2
                        giờ
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút điều hướng */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Xác nhận đặt lịch →
              </button>
            </div>
          </div>
        )}

        {/* Bước 4: Hoàn tất đặt lịch */}
        {currentStep === 4 && selectedConsultant && selectedSchedule && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Hoàn tất đặt lịch
              </h1>
              <p className="text-lg text-gray-600">
                Xác nhận cuối cùng để hoàn tất việc đặt lịch tư vấn
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Sẵn sàng hoàn tất?
                </h3>
                <p className="text-gray-600">
                  Bạn có chắc chắn muốn đặt lịch tư vấn với thông tin trên
                  không?
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Chuyên gia:</span>{" "}
                    {selectedConsultant.name}
                  </p>
                  <p>
                    <span className="font-medium">Ngày:</span>{" "}
                    {new Date(selectedSchedule.date).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Giờ:</span>{" "}
                    {formatTime(selectedSchedule.slot.slotStart)} -{" "}
                    {formatTime(selectedSchedule.slot.slotEnd)}
                  </p>
                  <p>
                    <span className="font-medium">Hình thức:</span> Tư vấn trực
                    tuyến qua Google Meet
                  </p>
                  <p>
                    <span className="font-medium">Người đặt:</span>{" "}
                    {formData.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {formData.email}
                  </p>
                  <p>
                    <span className="font-medium">Số điện thoại:</span>{" "}
                    {formData.phone}
                  </p>
                  {formData.notes && (
                    <p>
                      <span className="font-medium">Ghi chú:</span>{" "}
                      {formData.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    loading
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {loading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
