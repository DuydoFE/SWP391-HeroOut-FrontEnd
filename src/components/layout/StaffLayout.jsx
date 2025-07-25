import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  GraduationCap,
  FileText,
  FileBarChart2,
  CalendarDays,
  Calendar, // Keep Calendar for the new item and existing ones
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import HeroOutLogo from "../../assets/heroout.jpg";
import { useAuth } from "../../contexts/AuthContext";

const StaffLayout = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef();

  const getAllMenuItems = () => [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Quản lý thành viên", path: "/managemembers" },
    { icon: GraduationCap, label: "Quản lý khóa học", path: "/managecourses" },
    { icon: FileBarChart2, label: "Quản lý blogs", path: "/manageblogs" },
    { icon: CalendarDays, label: "Quản lý sự kiện", path: "/manageevents" },
    { icon: FileText, label: "Quản lý khảo sát", path: "/managesurveys" },
    { icon: Calendar, label: "Quản lý lịch hẹn", path: "/managemeetings" },
    {
      icon: Calendar,
      label: "Xem Lịch Làm việc",
      path: "/viewconsultantmeeting",
    },
  ];

  const getConsultantMenuItems = () => [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: FileBarChart2, label: "Quản lý blogs", path: "/manageblogs" },
    { icon: Calendar, label: "Quản lý lịch hẹn", path: "/managemeetings" },

    {
      icon: Calendar,
      label: "Xem Lịch Làm việc",
      path: "/viewconsultantmeeting",
    },
  ];

  const getMenuItems = () => {
    const userRole = user?.role?.toLowerCase();

    if (userRole === "consultant") {
      return getConsultantMenuItems();
    } else if (userRole === "admin" || userRole === "staff") {
      return getAllMenuItems();
    }

    return [];
  };

  const menuItems = getMenuItems();

  // Kiểm tra quyền truy cập dashboard
  const hasAccessToDashboard = () => {
    // Also check if user is authenticated before checking role
    if (!isAuthenticated || !user || !user.role) return false;
    const allowedRoles = ["admin", "staff", "consultant"];
    return allowedRoles.includes(user.role.toLowerCase());
  };

  // Nếu không có quyền truy cập hoặc chưa authenticate, redirect về trang chủ
  if (!hasAccessToDashboard()) {
    // Redirect to login or home if not authenticated or not authorized role
    // Using location.pathname check prevents infinite loop if already on "/"
    if (location.pathname !== "/") {
      return <Navigate to="/" replace />;
    } else {
      // If already on home page, just render nothing or a loading state
      return null; // Or a simple loading indicator
    }
  }

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    // history.push("/"); // Using history is common with react-router v5,
    // With v6, redirecting after logout is often done by changing state
    // or relying on route protection. window.location.href works but
    // is generally not the React Router way. Let's stick to the Navigate approach
    // if logout changes isAuthenticated state. The AuthContext should handle
    // the redirect implicitly via the protected route setup.
  };

  // Redirect after logout if isAuthenticated becomes false
  if (!isAuthenticated && location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  // Đóng dropdown khi click ngoài vùng
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col fixed top-0 bottom-0">
        {/* Logo */}
        <div className="flex justify-center items-center h-32 border-b border-gray-200">
          <Link to="/dashboard">
            <img
              src={HeroOutLogo || "/placeholder.svg"}
              alt="HeroOut Logo"
              className="h-24 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-6">
          {menuItems.map((item, index) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info with Dropdown */}
        <div
          className="p-6 border-t border-gray-200 relative"
          ref={dropdownRef}
        >
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm uppercase">
                  {user?.name?.[0] || "U"}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <ChevronDown size={18} className="text-gray-500 ml-2" />
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-20 left-6 w-48 bg-white border rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <LogOut size={16} />
                LogOut
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 h-screen overflow-y-auto bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
};

export default StaffLayout;
