import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  Settings,
  Grid,
  List,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Monitor,
  Award,
  CalendarCheck,
} from "lucide-react";

import api from "../services/axios";

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

const getLucideIcon = (type) => {
  switch (type) {
    case "calendar":
      return <Calendar className="w-4 h-4 text-gray-400" />;
    case "clock":
      return <Clock className="w-4 h-4 text-gray-400" />;
    case "map-pin":
      return <MapPin className="w-4 h-4 text-gray-400" />;
    default:
      return null;
  }
};

const EventPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/events");

        if (Array.isArray(response.data)) {
          setEvents(response.data);
        } else {
          console.error("API response data is not an array:", response.data);
          setError(new Error("API trả về dữ liệu không đúng định dạng."));
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching events:", err);
        if (err.response) {
          setError(
            new Error(`Lỗi khi tải danh sách sự kiện: ${err.response.status}`)
          );
        } else if (err.request) {
          setError(
            new Error(
              "Không nhận được phản hồi từ máy chủ khi tải danh sách sự kiện."
            )
          );
        } else {
          setError(new Error(`Lỗi khi tải danh sách sự kiện: ${err.message}`));
        }
        setError(err);
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
          Sự kiện & Hoạt động
        </h2>
        <p className="text-base text-gray-600">
          Tham gia các sự kiện giáo dục và hoạt động cộng đồng về phòng chống tệ
          nạn xã hội
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="relative inline-block w-full md:w-auto">
          <button className="flex items-center justify-center md:justify-between gap-2 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500">
            Tất cả
            <Settings className="w-5 h-5" />
            ``
          </button>
        </div>
        <div className="flex border border-gray-300 rounded-md overflow-hidden w-full md:w-auto">
          <button className="p-2 bg-green-500 text-white focus:outline-none">
            <Grid className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none">
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Tất cả Sự kiện</h3>
        {/* console.log("Rendering based on:", { isLoading, error, eventsLength: events.length, }); */}{" "}
        {/* Remove or comment out verbose logs */}
        {isLoading && (
          <div className="text-center text-gray-600 text-lg">
            Đang tải sự kiện...
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 text-lg">
            {error.message || "Lỗi khi tải sự kiện."}{" "}
            {/* Use user-friendly error message */}
          </div>
        )}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center text-gray-600 text-lg">
            Không có sự kiện nào.
          </div>
        )}
        {!isLoading && !error && events.length > 0 && (
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {events.map((event) => {
              // console.log("Rendering event:", event.id, event.title); // Remove or comment out verbose logs
              return (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-72 min-w-[288px] bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
                >
                  <div className="relative h-20 flex justify-center items-center bg-green-100 text-green-800">
                    <CalendarCheck className="w-10 h-10 text-green-600" />
                  </div>

                  <div className="p-4 flex-grow flex flex-col">
                    <div className="text-base font-bold text-gray-800 mb-2">
                      {event.title}
                    </div>

                    {event.description && (
                      <div className="text-sm text-gray-600 mb-2 line-clamp-3">
                        {event.description}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center mb-1 gap-2">
                        {getLucideIcon("calendar")}{" "}
                        {formatDateTime(event.startTime).split(",")[0]}{" "}
                      </div>
                      <div className="flex items-center mb-1 gap-2">
                        {getLucideIcon("clock")}{" "}
                        {formatDateTime(event.startTime).split(",")[1]?.trim()}{" "}
                        {event.endTime &&
                          ` - ${formatDateTime(event.endTime)
                            .split(",")[1]
                            ?.trim()}`}{" "}
                      </div>
                      {event.location && (
                        <div className="flex items-center mb-1 gap-2">
                          {getLucideIcon("map-pin")} {event.location}
                        </div>
                      )}
                    </div>

                    {/* Wrap the button in a Link */}
                    <div className="mt-auto">
                      <Link to={`/events/${event.id}`} className="block">
                        {" "}
                        {/* Use Link and make it a block element */}
                        <button className="w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                          Xem chi tiết
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* The "My Events" section remains removed */}
    </div>
  );
};

export default EventPage;
