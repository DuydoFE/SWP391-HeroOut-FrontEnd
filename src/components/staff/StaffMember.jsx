import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
} from "lucide-react";
import api from "../../services/axios";
import ApiService from "../../services/apiService";
import { toast } from "react-toastify";

const StaffMember = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  // Hàm lấy consultantId từ accountId
  const fetchConsultantId = async (accountId) => {
    try {
      const response = await api.get("consultants");
      const consultant = response.data.find((c) => c.accountId === accountId);
      return consultant ? consultant.id : null;
    } catch (error) {
      console.error("Lỗi khi lấy consultant ID:", error);
      return null;
    }
  };

  // Hàm tạo mới consultant
  const createConsultant = async (accountId, consultantData) => {
    try {
      if (!accountId) {
        throw new Error("Không có accountId để tạo consultant");
      }

      const response = await api.post("/consultants", {
        accountId,
        ...consultantData,
      });

      // Kiểm tra cấu trúc phản hồi
      const consultantId = response?.data?.id || response?.id;
      if (!consultantId) {
        throw new Error("Phản hồi từ API consultants không chứa ID");
      }

      return consultantId;
    } catch (error) {
      console.error("Lỗi khi tạo consultant:", error.response || error);
      throw new Error(
        error.response?.data?.message || "Không thể tạo thông tin tư vấn viên"
      );
    }
  };

  // Fetch members from API
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/accounts");
      setMembers(response.data);
      setFilteredMembers(response.data);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Không thể tải danh sách thành viên");
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone?.includes(searchTerm)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (member) => member.status?.toLowerCase() === filterStatus
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter(
        (member) => member.role?.toLowerCase() === filterRole
      );
    }

    setFilteredMembers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterRole, members]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const handleAddMember = async (accountData, consultantData) => {
    try {
      // Kiểm tra dữ liệu đầu vào cho account
      if (!accountData.name || !accountData.email || !accountData.password) {
        throw new Error("Thiếu các trường bắt buộc: Tên, Email, Mật khẩu");
      }

      const response = await ApiService.register(accountData);
      console.log(
        "handleAddMember response:",
        JSON.stringify(response, null, 2)
      );
      if (!response?.id) {
        throw new Error("Phản hồi từ API register không chứa ID tài khoản");
      }
      toast.success("Thêm thành viên thành công!");

      setShowAddModal(false);
      fetchMembers();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Không thể thêm thành viên");
    }
  };

  const handleEditMember = async (accountData, consultantData) => {
    try {
      await ApiService.updateAccount(selectedMember.id, accountData);
      toast.success("Cập nhật thành viên thành công!");

      if (accountData.role === "CONSULTANT" && consultantData) {
        const consultantId = await fetchConsultantId(selectedMember.id);
        if (consultantId) {
          await ApiService.updateConsultantDetails(
            consultantId,
            consultantData
          );
          toast.success("Cập nhật thông tin tư vấn viên thành công!");
        } else {
          const newConsultantId = await createConsultant(
            selectedMember.id,
            consultantData
          );
          toast.success("Tạo thông tin tư vấn viên thành công!");
        }
      }

      setShowEditModal(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error(error.message || "Không thể cập nhật thành viên");
    }
  };

  const handleStatusToggle = async (memberId, currentStatus) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api.put(`/accounts/${memberId}/status?status=${newStatus}`);
      toast.success(
        `Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} tài khoản`
      );
      fetchMembers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      MEMBER: "Thành viên",
      CONSULTANT: "Tư vấn viên",
      STAFF: "Nhân viên",
      ADMIN: "Quản trị viên",
    };
    return roles[role] || role;
  };

  const getStatusColor = (status) => {
    return status === "ACTIVE"
      ? "text-green-600 bg-green-100"
      : "text-red-600 bg-red-100";
  };

  const getGenderLabel = (gender) => {
    return gender === "MALE" ? "Nam" : gender === "FEMALE" ? "Nữ" : "";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý thành viên
        </h1>
        <p className="text-gray-600">
          Quản lý thông tin và trạng thái của các thành viên trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      {/* Row 1: Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          {
            label: "Tổng số tài khoản",
            icon: <Users className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
            value: members.length,
          },
          {
            label: "Đang hoạt động",
            icon: <UserCheck className="w-6 h-6 text-green-600" />,
            bg: "bg-green-100",
            value: members.filter((m) => m.status === "ACTIVE").length,
          },
          {
            label: "Không hoạt động",
            icon: <UserX className="w-6 h-6 text-yellow-600" />,
            bg: "bg-yellow-100",
            value: members.filter((m) => m.status === "INACTIVE").length,
          },
        ].map(({ label, icon, bg, value }, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border flex items-center"
          >
            <div className={`p-2 ${bg} rounded-lg`}>{icon}</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Thống kê theo vai trò */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          {
            role: "MEMBER",
            label: "Thành viên",
            color: "purple",
          },
          {
            role: "STAFF",
            label: "Nhân viên",
            color: "indigo",
          },
          {
            role: "ADMIN",
            label: "Quản trị viên",
            color: "red",
          },
          {
            role: "CONSULTANT",
            label: "Tư vấn viên",
            color: "teal",
          },
        ].map(({ role, label, color }, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border flex items-center"
          >
            <div className={`p-2 bg-${color}-100 rounded-lg`}>
              <Users className={`w-6 h-6 text-${color}-600`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter((m) => m.role === role).length}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="member">Thành viên</option>
                <option value="consultant">Tư vấn viên</option>
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Thêm thành viên
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giới tính
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img
                            src={member.avatar || "/placeholder.svg"}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-medium text-sm">
                            {member.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {member.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.email}</div>
                    <div className="text-sm text-gray-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        member.status
                      )}`}
                    >
                      {member.status === "ACTIVE"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getGenderLabel(member.gender)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowEditModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusToggle(member.id, member.status)
                        }
                        className={
                          member.status === "ACTIVE"
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }
                        title={
                          member.status === "ACTIVE"
                            ? "Vô hiệu hóa"
                            : "Kích hoạt"
                        }
                      >
                        {member.status === "ACTIVE" ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{" "}
                  <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                  đến{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredMembers.length)}
                  </span>{" "}
                  trong{" "}
                  <span className="font-medium">{filteredMembers.length}</span>{" "}
                  kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <MemberModal
          title="Thêm thành viên mới"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddMember}
        />
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <MemberModal
          title="Chỉnh sửa thành viên"
          member={selectedMember}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
          }}
          onSubmit={handleEditMember}
        />
      )}

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
};

// MemberModal Component
const MemberModal = ({ title, member, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    email: member?.email || "",
    phone: member?.phone || "",
    address: member?.address || "",
    gender: member?.gender || "MALE",
    dateOfBirth: member?.dateOfBirth || "",
    avatar: member?.avatar || "",
    role: member?.role || "MEMBER",
    password: "",
  });

  const [consultantData, setConsultantData] = useState({
    fieldOfStudy: "",
    degreeLevel: "",
    issuedDate: "",
    expiryDate: "",
    organization: "",
    specialities: "",
    experience: "",
    rating: 5.0,
    consultations: 0,
    bio: "",
  });

  useEffect(() => {
    if (member && member.role === "CONSULTANT") {
      const fetchConsultantDetails = async () => {
        try {
          const details = await ApiService.getConsultant(member.id);
          setConsultantData({
            fieldOfStudy: details.fieldOfStudy || "",
            degreeLevel: details.degreeLevel || "",
            issuedDate: details.issuedDate || "",
            expiryDate: details.expiryDate || "",
            organization: details.organization || "",
            specialities: Array.isArray(details.specialties)
              ? details.specialties.join(", ")
              : details.specialties || "",
            experience: details.experience || "",
            rating: details.rating || 5.0,
            consultations: details.consultations || 0,
            bio: details.bio || "",
          });
        } catch (error) {
          console.error("Error fetching consultant details:", error);
          toast.warn(
            "Tư vấn viên chưa có thông tin chi tiết. Vui lòng nhập thông tin."
          );
          setConsultantData({
            fieldOfStudy: "",
            degreeLevel: "",
            issuedDate: "",
            expiryDate: "",
            organization: "",
            specialities: "",
            experience: "",
            rating: 5.0,
            consultations: 0,
            bio: "",
          });
        }
      };
      fetchConsultantDetails();
    }
  }, [member]);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleConsultantChange = (e) => {
    const { name, value } = e.target;
    setConsultantData({ ...consultantData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitAccountData = { ...formData };

    // Kiểm tra các trường bắt buộc cho account
    if (
      !submitAccountData.name ||
      !submitAccountData.email ||
      (!member && !submitAccountData.password)
    ) {
      toast.error(
        "Vui lòng nhập đầy đủ các trường bắt buộc: Tên, Email, Mật khẩu"
      );
      return;
    }

    // Xóa password nếu chỉnh sửa và không nhập password mới
    if (member && !submitAccountData.password) {
      delete submitAccountData.password;
    }

    // Chỉ gửi consultantData khi chỉnh sửa và vai trò là CONSULTANT
    onSubmit(
      submitAccountData,
      member && submitAccountData.role === "CONSULTANT" ? consultantData : null
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={handleAccountChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={handleAccountChange}
              />
            </div>

            {!member && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.password}
                  onChange={handleAccountChange}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.phone}
                onChange={handleAccountChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                name="address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.address}
                onChange={handleAccountChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.gender}
                onChange={handleAccountChange}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                name="dateOfBirth"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.dateOfBirth}
                onChange={handleAccountChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                type="url"
                name="avatar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.avatar}
                onChange={handleAccountChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                name="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.role}
                onChange={handleAccountChange}
              >
                <option value="MEMBER">Thành viên</option>
                <option value="CONSULTANT">Tư vấn viên</option>
                <option value="STAFF">Nhân viên</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>

            {/* Chỉ hiển thị thông tin tư vấn viên khi chỉnh sửa và vai trò là CONSULTANT */}
            {member && formData.role === "CONSULTANT" && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-2">
                  Thông tin Tư vấn viên
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lĩnh vực học
                  </label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.fieldOfStudy}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trình độ học vấn
                  </label>
                  <input
                    type="text"
                    name="degreeLevel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.degreeLevel}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày cấp chứng chỉ
                  </label>
                  <input
                    type="date"
                    name="issuedDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.issuedDate}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày hết hạn chứng chỉ
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.expiryDate}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổ chức
                  </label>
                  <input
                    type="text"
                    name="organization"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.organization}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chuyên môn (phân cách bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    name="specialities"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.specialities}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kinh nghiệm
                  </label>
                  <input
                    type="text"
                    name="experience"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.experience}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đánh giá (Rating)
                  </label>
                  <input
                    type="number"
                    name="rating"
                    step="0.1"
                    min="0"
                    max="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.rating}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số buổi tư vấn
                  </label>
                  <input
                    type="number"
                    name="consultations"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.consultations}
                    onChange={handleConsultantChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiểu sử (Bio)
                  </label>
                  <textarea
                    name="bio"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={consultantData.bio}
                    onChange={handleConsultantChange}
                  ></textarea>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {member ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Member Detail Modal Component
const MemberDetailModal = ({ member, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Chi tiết thành viên</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {member.avatar ? (
                <img
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-blue-600 font-bold text-xl">
                  {member.name?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-gray-600">
                {member.role === "MEMBER"
                  ? "Thành viên"
                  : member.role === "CONSULTANT"
                  ? "Tư vấn viên"
                  : member.role === "STAFF"
                  ? "Nhân viên"
                  : "Quản trị viên"}
              </p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  member.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {member.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Số điện thoại</p>
                <p className="font-medium">{member.phone || "Chưa cập nhật"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-medium">
                  {member.address || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Giới tính</p>
                <p className="font-medium">
                  {member.gender === "MALE"
                    ? "Nam"
                    : member.gender === "FEMALE"
                    ? "Nữ"
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Ngày sinh</p>
                <p className="font-medium">
                  {member.dateOfBirth
                    ? new Date(member.dateOfBirth).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffMember;
