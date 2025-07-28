import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
} from "lucide-react";
import { toast } from "react-toastify";
import ApiService from "../services/apiService";
import axios from "axios"; // Cần import axios để gọi API Cloudinary

// ===== THAY THÔNG TIN CỦA BẠN VÀO ĐÂY =====
const CLOUDINARY_CLOUD_NAME = "dluj1wjzd"; // <-- Điền Cloud Name của bạn
const CLOUDINARY_UPLOAD_PRESET = "HeroOut"; // <-- Điền Upload Preset của bạn

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false); // Loading cho việc lưu thông tin chung
  const [avatarUploading, setAvatarUploading] = useState(false); // Loading riêng cho avatar
  const [fetchLoading, setFetchLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    avatar: "",
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      try {
        setFetchLoading(true);
        const userData = await ApiService.getAccountById(user.id);
        const formattedData = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          date_of_birth: userData.dateOfBirth || "",
          gender: userData.gender || "",
          avatar: userData.avatar || "",
        };
        setFormData(formattedData);
        setOriginalData(formattedData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Không thể tải thông tin người dùng");
        // Fallback to context data
        if (user) {
          const fallbackData = {
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            address: user.address || "",
            date_of_birth: user.dateOfBirth || "",
            gender: user.gender || "",
            avatar: user.avatar || "",
          };
          setFormData(fallbackData);
          setOriginalData(fallbackData);
        }
      } finally {
        setFetchLoading(false);
      }
    };
    fetchUserData();
  }, [user]); // Phụ thuộc vào user.id để fetch lại nếu user thay đổi

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Không tìm thấy thông tin người dùng");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return;
    }
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        dateOfBirth: formData.date_of_birth || null,
        gender: formData.gender || null,
        avatar: formData.avatar, // <-- THÊM DÒNG NÀY
      };
      const updatedUser = await ApiService.updateAccount(user.id, updateData);
      const contextUserData = {
        ...user,
        ...updatedUser,
        avatar: formData.avatar,
      }; // Giữ lại avatar mới nhất
      updateUser(contextUserData);
      setOriginalData(formData);
      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  // ===== HÀM XỬ LÝ UPLOAD AVATAR ĐÃ SỬA LỖI =====
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một file hình ảnh");
      return;
    }

    setAvatarUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      // 1. Tải ảnh lên Cloudinary
      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        uploadFormData
      );
      const newAvatarUrl = cloudinaryResponse.data.secure_url;

      // 2. Gửi URL về backend để lưu
      // ================= SỬA LẠI DÒNG NÀY =================
      // CŨ: await ApiService.updateAvatar(user.id, { avatarUrl: newAvatarUrl });
      // MỚI (VÀ ĐÚNG VỚI API CỦA BẠN): Truyền trực tiếp chuỗi URL
      await ApiService.updateAvatar(user.id, newAvatarUrl);
      // =====================================================

      // 3. Cập nhật state ở frontend
      setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
      setOriginalData((prev) => ({ ...prev, avatar: newAvatarUrl }));
      updateUser({ ...user, avatar: newAvatarUrl });

      // Force re-render header by updating localStorage
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...user, avatar: newAvatarUrl })
      );

      // Trigger a custom event to notify header about avatar change
      window.dispatchEvent(
        new CustomEvent("avatarUpdated", {
          detail: { avatar: newAvatarUrl },
        })
      );

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      ADMIN: "Quản trị viên",
      CONSULTANT: "Tư vấn viên",
      MEMBER: "Thành viên",
      STAFF: "Nhân viên",
    };
    return roleMap[role] || role;
  };

  if (!user || fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              {/* Vùng hiển thị avatar */}
              {formData.avatar ? (
                <img
                  src={formData.avatar || "/placeholder.svg"}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                  {getInitials(formData.name)}
                </div>
              )}

              {/* Nút camera và input file */}
              {isEditing && (
                <label
                  className={`absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full transition-colors ${
                    avatarUploading
                      ? "cursor-not-allowed bg-gray-400"
                      : "cursor-pointer hover:bg-emerald-700"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={avatarUploading}
                  />
                </label>
              )}

              {/* Lớp phủ loading khi đang tải avatar */}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* ... (Phần còn lại của JSX giữ nguyên không đổi) ... */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {formData.name || "Người dùng"}
              </h1>
              <p className="text-gray-600 mb-1">{formData.email}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>ID: {user.id}</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading || avatarUploading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || avatarUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Đang lưu..." : "Lưu"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ... (Toàn bộ phần "Thông tin cá nhân" giữ nguyên không đổi) ... */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Thông tin cá nhân
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{formData.name || "Chưa cập nhật"}</span>
                </div>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{formData.email || "Chưa cập nhật"}</span>
                </div>
              )}
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{formData.phone || "Chưa cập nhật"}</span>
                </div>
              )}
            </div>
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới tính
              </label>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    {formData.gender === "MALE"
                      ? "Nam"
                      : formData.gender === "FEMALE"
                      ? "Nữ"
                      : "Chưa cập nhật"}
                  </span>
                </div>
              )}
            </div>
            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sinh
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  max={new Date().toISOString().split("T")[0]}
                />
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {formData.date_of_birth
                      ? new Date(formData.date_of_birth).toLocaleDateString(
                          "vi-VN"
                        )
                      : "Chưa cập nhật"}
                  </span>
                </div>
              )}
            </div>
            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ
              </label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <div className="flex items-start gap-2 p-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <span>{formData.address || "Chưa cập nhật"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
