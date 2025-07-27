import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Calendar,
  Tag,
  AlertCircle,
  X,
  Clock,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import ApiService from "../../services/apiService";
import axios from "axios";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dluj1wjzd";
const CLOUDINARY_UPLOAD_PRESET = "HeroOut";

const StaffBlog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingBlog, setDeletingBlog] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const initialCreateState = {
    title: "",
    description: "",
    content: "",
    category: "",
    author: "",
    readTime: "5 phút đọc",
    views: "0 lượt xem",
    tags: [],
    image: "",
  };
  const [createBlogData, setCreateBlogData] = useState(initialCreateState);
  const blogsPerPage = 10;

  // Fetch blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getBlogs();
      setBlogs(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handle image upload to Cloudinary
  const handleImageUpload = async (e, modalType) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn một file hình ảnh.");
      return;
    }
    setImageUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      const imageUrl = response.data.secure_url;
      if (modalType === "create") {
        setCreateBlogData((prev) => ({ ...prev, image: imageUrl }));
      } else if (modalType === "edit") {
        setEditingBlog((prev) => ({ ...prev, image: imageUrl }));
      }
      alert("Tải ảnh lên thành công!");
    } catch (error) {
      alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
      console.error("Cloudinary Upload Error:", error);
    } finally {
      setImageUploading(false);
    }
  };

  // View blog detail
  const handleViewDetail = async (blogId) => {
    try {
      const blogDetail = await ApiService.getBlog(blogId);
      setSelectedBlog(blogDetail);
      setShowDetailModal(true);
    } catch (err) {
      alert("Có lỗi xảy ra khi tải chi tiết bài viết: " + err.message);
    }
  };

  // Edit blog
  const handleEditBlog = (blog) => {
    setEditingBlog({ ...blog });
    setShowEditModal(true);
  };

  // Save edited blog
  const handleSaveEdit = async () => {
    if (!editingBlog) return;
    try {
      // Validate required fields
      if (!editingBlog.title.trim()) {
        alert("Vui lòng nhập tiêu đề bài viết");
        return;
      }
      if (!editingBlog.description.trim()) {
        alert("Vui lòng nhập mô tả bài viết");
        return;
      }
      if (!editingBlog.content.trim()) {
        alert("Vui lòng nhập nội dung bài viết");
        return;
      }
      if (!editingBlog.category.trim()) {
        alert("Vui lòng nhập danh mục bài viết");
        return;
      }
      if (!editingBlog.author.name.trim()) {
        alert("Vui lòng nhập tên tác giả");
        return;
      }

      const blogData = {
        title: editingBlog.title,
        description: editingBlog.description,
        content: editingBlog.content,
        category: editingBlog.category,
        author: editingBlog.author.name,
        readTime: editingBlog.readTime || "5 phút đọc",
        views: editingBlog.views || "0 lượt xem",
        date: editingBlog.date || new Date().toISOString().split("T")[0],
        tags: Array.isArray(editingBlog.tags)
          ? editingBlog.tags.join(",")
          : editingBlog.tags,
        image: editingBlog.image,
      };

      const updatedBlogFromApi = await ApiService.updateBlog(
        editingBlog.id,
        blogData
      );

      const finalUpdatedBlog = {
        ...editingBlog,
        ...updatedBlogFromApi,
        author: { ...editingBlog.author, name: updatedBlogFromApi.author },
        tags: updatedBlogFromApi.tags
          ? updatedBlogFromApi.tags.split(",").map((t) => t.trim())
          : [],
      };

      setBlogs(
        blogs.map((blog) =>
          blog.id === editingBlog.id ? finalUpdatedBlog : blog
        )
      );
      setShowEditModal(false);
      setEditingBlog(null);
      alert("Cập nhật bài viết thành công!");
    } catch (err) {
      alert("Có lỗi xảy ra khi cập nhật bài viết: " + err.message);
    }
  };

  // Create new blog
  const handleCreateBlog = async () => {
    try {
      if (
        !createBlogData.title.trim() ||
        !createBlogData.description.trim() ||
        !createBlogData.content.trim() ||
        !createBlogData.category.trim() ||
        !createBlogData.author.trim()
      ) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc (*).");
        return;
      }
      const newBlogData = {
        ...createBlogData,
        tags: createBlogData.tags.join(","),
      };
      const newBlog = await ApiService.createBlog(newBlogData);

      // Transform the response to match the expected format
      const transformedBlog = {
        id: newBlog.id,
        title: newBlog.title,
        description: newBlog.description,
        content: newBlog.content,
        category: newBlog.category,
        author: {
          name: newBlog.author,
          role: "Chuyên gia",
          avatar: newBlog.author ? newBlog.author.charAt(0).toUpperCase() : "A",
        },
        readTime: newBlog.readTime || "5 phút đọc",
        views: newBlog.views || "0 lượt xem",
        date: newBlog.date || new Date().toLocaleDateString("vi-VN"),
        tags: newBlog.tags
          ? newBlog.tags.split(",").map((tag) => tag.trim())
          : [],
        image: newBlog.image || "",
      };

      setBlogs([transformedBlog, ...blogs]);
      setShowCreateModal(false);
      setCreateBlogData(initialCreateState);
      alert("Tạo bài viết mới thành công!");
    } catch (err) {
      alert("Có lỗi xảy ra khi tạo bài viết: " + err.message);
    }
  };

  // Delete blog
  const handleDeleteBlog = (blog) => {
    setDeletingBlog(blog);
    setShowDeleteModal(true);
  };

  const confirmDeleteBlog = async () => {
    if (!deletingBlog) return;
    try {
      await ApiService.deleteBlog(deletingBlog.id);
      setBlogs(blogs.filter((blog) => blog.id !== deletingBlog.id));
      setShowDeleteModal(false);
      setDeletingBlog(null);
      alert("Xóa bài viết thành công!");
    } catch (err) {
      alert("Có lỗi xảy ra khi xóa bài viết: " + err.message);
    }
  };

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu blogs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Lỗi tải dữ liệu
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Blogs</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các bài viết và nội dung blog
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo bài viết mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, tác giả hoặc danh mục..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng bài viết</p>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách bài viết ({filteredBlogs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ảnh bìa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài viết
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày xuất bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lượt xem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-24 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-gray-100 flex items-center justify-center rounded-md">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {blog.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {blog.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3">
                        {blog.author.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {blog.author.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {blog.author.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {blog.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{blog.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {blog.views}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(blog.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Chỉnh sửa"
                        onClick={() => handleEditBlog(blog)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Xóa"
                        onClick={() => handleDeleteBlog(blog)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              Không tìm thấy bài viết nào
            </div>
            <p className="text-sm text-gray-400">
              Thử thay đổi từ khóa tìm kiếm
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 border rounded ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } transition-colors`}
            >
              « Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 border rounded ${
                    pageNum === currentPage
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 border rounded ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } transition-colors`}
            >
              Sau »
            </button>
          </div>
        </div>
      )}

      {/* Create Blog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Tạo bài viết mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    value={createBlogData.title}
                    onChange={(e) =>
                      setCreateBlogData({
                        ...createBlogData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tiêu đề bài viết"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh bìa
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "create")}
                      className="hidden"
                      id="create-image-upload"
                      disabled={imageUploading}
                    />
                    <label
                      htmlFor="create-image-upload"
                      className={`px-4 py-2 border border-gray-300 rounded-md cursor-pointer ${
                        imageUploading
                          ? "bg-gray-200 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {imageUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin inline-block" />
                      ) : (
                        "Chọn ảnh"
                      )}
                    </label>
                    {createBlogData.image && (
                      <img
                        src={createBlogData.image}
                        alt="Xem trước"
                        className="h-20 w-auto rounded-md object-cover border"
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    value={createBlogData.description}
                    onChange={(e) =>
                      setCreateBlogData({
                        ...createBlogData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mô tả ngắn gọn về bài viết"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung *
                  </label>
                  <textarea
                    value={createBlogData.content}
                    onChange={(e) =>
                      setCreateBlogData({
                        ...createBlogData,
                        content: e.target.value,
                      })
                    }
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập nội dung chi tiết của bài viết"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục *
                  </label>
                  <input
                    type="text"
                    value={createBlogData.category}
                    onChange={(e) =>
                      setCreateBlogData({
                        ...createBlogData,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập danh mục bài viết"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tác giả *
                  </label>
                  <input
                    type="text"
                    value={createBlogData.author}
                    onChange={(e) =>
                      setCreateBlogData({
                        ...createBlogData,
                        author: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên tác giả"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={createBlogData.tags.join(", ")}
                    onChange={(e) =>
                      setCreateBlogData({
                        ...createBlogData,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: tâm lý, sức khỏe, giáo dục"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateBlog}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Tạo bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Blog Modal */}
      {showEditModal && editingBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Chỉnh sửa bài viết
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={editingBlog.title}
                    onChange={(e) =>
                      setEditingBlog({ ...editingBlog, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh bìa
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "edit")}
                      className="hidden"
                      id="edit-image-upload"
                      disabled={imageUploading}
                    />
                    <label
                      htmlFor="edit-image-upload"
                      className={`px-4 py-2 border border-gray-300 rounded-md cursor-pointer ${
                        imageUploading
                          ? "bg-gray-200 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {imageUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin inline-block" />
                      ) : (
                        "Đổi ảnh"
                      )}
                    </label>
                    {editingBlog.image && (
                      <img
                        src={editingBlog.image}
                        alt="Xem trước"
                        className="h-20 w-auto rounded-md object-cover border"
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={editingBlog.description}
                    onChange={(e) =>
                      setEditingBlog({
                        ...editingBlog,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung
                  </label>
                  <textarea
                    value={editingBlog.content}
                    onChange={(e) =>
                      setEditingBlog({
                        ...editingBlog,
                        content: e.target.value,
                      })
                    }
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={editingBlog.category}
                    onChange={(e) =>
                      setEditingBlog({
                        ...editingBlog,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên tác giả
                  </label>
                  <input
                    type="text"
                    value={editingBlog.author.name}
                    onChange={(e) =>
                      setEditingBlog({
                        ...editingBlog,
                        author: { ...editingBlog.author, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={editingBlog.tags.join(", ")}
                    onChange={(e) =>
                      setEditingBlog({
                        ...editingBlog,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Detail Modal */}
      {showDetailModal && selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Chi tiết bài viết
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Blog Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {selectedBlog.category}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedBlog.title}
                </h1>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                      {selectedBlog.author.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedBlog.author.name}
                      </div>
                      <div className="text-gray-500">
                        {selectedBlog.author.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedBlog.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedBlog.readTime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{selectedBlog.views}</span>
                  </div>
                </div>

                {selectedBlog.image && (
                  <img
                    src={selectedBlog.image}
                    alt={selectedBlog.title}
                    className="w-full h-64 object-cover rounded-md mb-4"
                  />
                )}

                <p className="text-gray-700 text-lg leading-relaxed">
                  {selectedBlog.description}
                </p>
              </div>

              {/* Blog Content */}
              <div className="prose max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>

              {/* Tags */}
              {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Tags:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Xác nhận xóa
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Xóa bài viết
                  </h3>
                  <p className="text-sm text-gray-500">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa bài viết "{deletingBlog.title}"?
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Cảnh báo:</strong> Bài viết sẽ bị xóa vĩnh viễn và
                  không thể khôi phục.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteBlog}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBlog;
