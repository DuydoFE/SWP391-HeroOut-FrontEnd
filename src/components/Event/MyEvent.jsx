import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/axios";
import { CalendarCheck, AlertCircle, Loader } from "lucide-react";

const MyEventsPage = () => {
  const [participations, setParticipations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // check user
    if (user && user.id) {
      const fetchMyEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await api.get(`/participations/account/${user.id}`);
          setParticipations(response.data);
        } catch (err) {
          console.error("Failed to fetch event participations:", err);
          setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchMyEvents();
    } else {
      setIsLoading(false);
    }
  }, [user]); // Load lại effect khi user đổi

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-12 h-12 animate-spin text-emerald-600" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      );
    }

    if (participations.length === 0) {
      return (
        <div className="text-center py-20 bg-gray-50 text-gray-600 rounded-lg">
          <CalendarCheck className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">
            Bạn chưa đăng ký tham gia sự kiện nào.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Trạng thái
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Thời gian Check-in
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Thời gian Check-out
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tổng điểm
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID Tham gia
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participations.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      p.status === "REGISTERED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDateTime(p.checkInTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDateTime(p.checkOutTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {p.totalScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sự kiện của tôi</h1>
      {renderContent()}
    </div>
  );
};

export default MyEventsPage;
