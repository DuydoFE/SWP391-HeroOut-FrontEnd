import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  ChevronDown,
  User,
  LogOut,
  Calendar,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import HeroOutLogo from "../assets/heroout.jpg";

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    window.location.href = "/";
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

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getNavLinkClass = (path) => {
    const baseClass =
      "relative px-3 py-2 rounded-lg font-medium transition-all duration-200";

    if (isActiveRoute(path)) {
      return `${baseClass} text-emerald-600 bg-emerald-50 shadow-sm`;
    }

    return `${baseClass} text-gray-600 hover:text-emerald-600 hover:bg-emerald-50`;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <img
                src={HeroOutLogo || "/placeholder.svg"}
                alt="Herodout Logo"
                style={{ width: 100, height: 80, objectFit: "contain" }}
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            <Link to="/blogs" className={getNavLinkClass("/blogs")}>
              Blogs
              {isActiveRoute("/blogs") && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600 rounded-full animate-pulse"></div>
              )}
            </Link>

            <Link to="/courses" className={getNavLinkClass("/courses")}>
              Khóa học
              {isActiveRoute("/courses") && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600 rounded-full animate-pulse"></div>
              )}
            </Link>

            <Link to="/event" className={getNavLinkClass("/event")}>
              Sự kiện
              {isActiveRoute("/event") && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600 rounded-full animate-pulse"></div>
              )}
            </Link>

            <Link
              to="/consultation"
              className={getNavLinkClass("/consultation")}
            >
              Tư vấn
              {isActiveRoute("/consultation") && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600 rounded-full animate-pulse"></div>
              )}
            </Link>

            <Link to="/risksurvey" className={getNavLinkClass("/risksurvey")}>
              Khảo sát Eassist
              {isActiveRoute("/risksurvey") && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600 rounded-full animate-pulse"></div>
              )}
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              // User is logged in - show avatar and dropdown
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role || "Member"}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar || "/placeholder.svg"}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActiveRoute("/profile")
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Hồ sơ cá nhân
                      </Link>

                      <Link
                        to="/my-appointments"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActiveRoute("/my-appointments")
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Calendar className="w-4 h-4 mr-3" />
                        Lịch hẹn của tôi
                      </Link>
                      <Link
                        to="/myevent"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActiveRoute("/myevent")
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Calendar className="w-4 h-4 mr-3" />
                        Sự kiện của tôi
                      </Link>

                      <Link
                        to="/risklevel" // Sử dụng đường dẫn /risksurvey
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActiveRoute("/risklevel")
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-3" />
                        Đánh giá nguy cơ
                      </Link>

                      <Link
                        to="/myaccomplishments"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActiveRoute("/myaccomplishments")
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <GraduationCap className="w-4 h-4 mr-3" />
                        Thành tích
                      </Link>

                      <hr className="my-2" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // User is not logged in - show login/register buttons
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 border-2 border-emerald-500 rounded-md font-medium transition-colors ${
                    isActiveRoute("/login")
                      ? "bg-emerald-500 text-white"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isActiveRoute("/register")
                      ? "bg-emerald-800 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
