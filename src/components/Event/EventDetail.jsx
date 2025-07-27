import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  DollarSign,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../services/axios";
import { useAuth } from "../../contexts/AuthContext";

// Helper để định dạng ngày giờ
const formatDateTime = (isoString) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    const optionsDate = { year: "numeric", month: "numeric", day: "numeric" };
    const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: false };
    const formattedDate = date.toLocaleDateString("vi-VN", optionsDate);
    const formattedTime = date.toLocaleTimeString("vi-VN", optionsTime);
    return `${formattedDate}, ${formattedTime}`;
  } catch (e) {
    console.error("Error formatting date:", isoString, e);
    return "Invalid Date";
  }
};

// Helper để lấy icon
const getLucideIcon = (type) => {
  switch (type) {
    case "calendar":
      return <Calendar className="w-5 h-5 text-gray-600" />;
    case "clock":
      return <Clock className="w-5 h-5 text-gray-600" />;
    case "map-pin":
      return <MapPin className="w-5 h-5 text-gray-600" />;
    case "users":
      return <Users className="w-5 h-5 text-gray-600" />;
    case "dollar":
      return <DollarSign className="w-5 h-5 text-gray-600" />;
    case "award":
      return <Award className="w-5 h-5 text-gray-600" />;
    default:
      return null;
  }
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [userParticipation, setUserParticipation] = useState(null);
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(false);
  const [isEventOver, setIsEventOver] = useState(false);

  const getStatusMessage = (status) => {
    switch (status) {
      case "REGISTERED":
        return "Bạn đã đăng ký sự kiện này.";
      case "CHECKED_IN":
        return "Bạn đã check-in sự kiện này.";
      case "CHECKED_OUT":
        return "Bạn đã hoàn thành sự kiện này và khảo sát.";
      case "CANCELLED":
        return "Bạn đã hủy đăng ký sự kiện này.";
      default:
        return "";
    }
  };

  const checkUserParticipation = async (eventId, accountId) => {
    if (!accountId || !eventId) return;

    setIsCheckingParticipation(true);
    try {
      const response = await api.get(`/participations`);
      const parsedEventId = parseInt(eventId, 10);
      const participation = response.data.find(
        (p) => p.eventId === parsedEventId && p.accountId === accountId
      );

      if (participation) {
        setUserParticipation(participation);
        if (
          ["REGISTERED", "CHECKED_IN", "CHECKED_OUT"].includes(
            participation.status
          )
        ) {
          setRegistrationStatus("already_registered");
          setRegistrationMessage(getStatusMessage(participation.status));
        } else {
          setRegistrationStatus(null);
          setRegistrationMessage("");
        }
      } else {
        setUserParticipation(null);
        setRegistrationStatus(null);
        setRegistrationMessage("");
      }
    } catch (err) {
      console.error("Error checking user participation:", err);
      setUserParticipation(null);
    } finally {
      setIsCheckingParticipation(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError(new Error("Không có ID sự kiện."));
      return;
    }

    const fetchEventDetail = async () => {
      setIsLoading(true);
      setError(null);
      setUserParticipation(null);
      setRegistrationStatus(null);
      setIsEventOver(false);

      try {
        const response = await api.get(`/events/${id}`);
        const eventData = response.data;
        setEvent(eventData);

        if (eventData.startTime) {
          const startTime = new Date(eventData.startTime);
          const now = new Date();
          if (startTime < now) {
            setIsEventOver(true);
          }
        }

        if (user?.id && !authLoading) {
          await checkUserParticipation(id, user.id);
        }
      } catch (err) {
        console.error("Error fetching event detail:", err);
        setError(
          err.response?.status === 404
            ? new Error("Sự kiện không tồn tại.")
            : new Error("Lỗi khi tải chi tiết sự kiện.")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetail();
  }, [id, user?.id, authLoading]);

  const handleRegisterClick = async () => {
    if (!user?.id) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    setIsRegistering(true);
    try {
      const payload = {
        accountId: user.id,
        eventId: parseInt(id, 10),
        status: "REGISTERED",
      };
      await api.post("/participations", payload);
      setRegistrationStatus("success");
      setRegistrationMessage("Đăng ký sự kiện thành công!");
      await checkUserParticipation(id, user.id);
    } catch (err) {
      console.error("Error during event registration:", err);
      if (err.response?.status === 409) {
        setRegistrationMessage("Bạn đã đăng ký sự kiện này trước đó.");
        setRegistrationStatus("already_registered");
      } else {
        setRegistrationMessage("Lỗi khi đăng ký. Vui lòng thử lại.");
        setRegistrationStatus("error");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const overallLoading = isLoading || authLoading || isCheckingParticipation;
  const showRegisterButton =
    !isRegistering &&
    registrationStatus !== "success" &&
    registrationStatus !== "already_registered" &&
    (!userParticipation || userParticipation.status === "CANCELLED");

  if (overallLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-red-600 mb-4">{error.message}</div>
        <Link to="/event" className="text-green-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1 inline" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6 text-center">
        Không tìm thấy sự kiện.
      </div>
    );
  }

  const startTimeFormatted = formatDateTime(event.startTime);
  const endTimeFormatted = formatDateTime(event.endTime);
  const startDate = startTimeFormatted.split(",")[0];
  const startTime = startTimeFormatted.split(",")[1]?.trim();
  const endTime = event.endTime ? endTimeFormatted.split(",")[1]?.trim() : null;

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-100 min-h-screen">
      <Link
        to="/event"
        className="mb-6 flex items-center text-green-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách sự kiện
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          {event.title}
        </h1>
        <div className="mb-6 text-gray-700 leading-relaxed">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Mô tả</h3>
          <p>{event.description || "Không có mô tả."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Thời gian
            </h3>
            <div className="flex items-center mb-2 gap-2">
              {getLucideIcon("calendar")}{" "}
              <span>
                Ngày: <span className="font-medium">{startDate}</span>
              </span>
            </div>
            <div className="flex items-center mb-2 gap-2">
              {getLucideIcon("clock")}{" "}
              <span>
                Thời gian:{" "}
                <span className="font-medium">
                  {startTime} {endTime && `- ${endTime}`}
                </span>
              </span>
            </div>
          </div>
          {event.location && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Địa điểm
              </h3>
              <div className="flex items-center text-gray-700 gap-2">
                {getLucideIcon("map-pin")} <span>{event.location}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tham gia</h3>

          {registrationMessage && (
            <div
              className={`p-3 mb-4 text-sm rounded-lg ${
                registrationStatus === "success"
                  ? "bg-green-100 text-green-800"
                  : registrationStatus === "already_registered"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
              role="alert"
            >
              {registrationMessage}
            </div>
          )}

          {isEventOver ? (
            <button
              disabled
              className="w-full mt-4 px-4 py-2 bg-gray-400 text-white rounded-md text-lg font-semibold cursor-not-allowed"
            >
              Sự kiện đã kết thúc
            </button>
          ) : (
            <>
              {userParticipation?.status === "CHECKED_IN" && (
                <div className="mt-4">
                  <Link
                    to={`/survey-event/${event.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Làm khảo sát
                  </Link>
                </div>
              )}

              {userParticipation?.status === "CHECKED_OUT" && (
                <div className="mt-4">
                  <button
                    disabled
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-400 text-white rounded-md text-lg font-semibold cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Bạn đã hoàn thành sự kiện
                  </button>
                </div>
              )}

              {showRegisterButton && (
                <button
                  onClick={handleRegisterClick}
                  disabled={isRegistering}
                  className={`w-full mt-4 px-4 py-2 text-white rounded-md text-lg font-semibold ${
                    isRegistering
                      ? "bg-green-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />{" "}
                      Đang xử lý...
                    </>
                  ) : (
                    "Đăng ký ngay"
                  )}
                </button>
              )}

              {userParticipation?.status === "CANCELLED" && !isRegistering && (
                <button
                  onClick={handleRegisterClick}
                  className="w-full mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-lg font-semibold"
                >
                  Đăng ký lại
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
