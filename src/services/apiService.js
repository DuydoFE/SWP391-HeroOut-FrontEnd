import api from "./axios";

class ApiService {
  static async login(credentials) {
    try {
      const response = await api.post("login", credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async register(userData) {
    try {
      const response = await api.post("register", userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getAccount(userId) {
    try {
      const response = await api.get(`account/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateAccount(userId, userData) {
    try {
      const response = await api.put(`/accounts/update`, userData, {
        params: { id: userId },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateAvatar(id, avatarUrl) {
    try {
      // Gửi request tới đúng endpoint /accounts/{id}/avatar
      // Body của request là chuỗi URL trần (raw string)
      // THAY ĐỔI QUAN TRỌNG: Thêm config để chỉ định Content-Type là 'text/plain'
      const response = await api.put(`/accounts/${id}/avatar`, avatarUrl, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getAccountById(userId) {
    try {
      const response = await api.get(`account/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Dashboard Statistics APIs
  static async getAllAccounts() {
    try {
      const response = await api.get("accounts");
      return response.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getCourses() {
    try {
      const response = await api.get("courses");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getEvents() {
    try {
      const response = await api.get("events");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Consultant APIs
  static async getConsultants() {
    try {
      const consultantsResponse = await api.get("consultants");
      const allConsultants = consultantsResponse.data;
      if (!allConsultants || allConsultants.length === 0) {
        console.warn("No consultants found in /api/consultants.");
        return [];
      }

      const consultantsWithAccountInfo = await Promise.all(
        allConsultants.map(async (consultant) => {
          let account = null;
          try {
            const accountResponse = await api.get(
              `account/${consultant.accountId}`
            );
            account = accountResponse.data;
          } catch (error) {
            console.warn(
              `No account info found for consultant ID: ${consultant.id}`
            );
            // If account not found, treat as inactive or skip
            return null; // Return null to filter out later
          }

          // Only include consultants with an active account
          if (account && account.status === "ACTIVE") {
            return {
              id: account.id,
              name:
                account.name || consultant.consultantName || "Chưa cập nhật",
              email: account.email || "",
              phone: account.phone || "",
              avatar:
                account.avatar || consultant.consultantName?.charAt(0) || "C",
              address: account.address || "",
              gender: account.gender || "",
              date_of_birth: account.dateOfBirth || null,
              status: account.status || "ACTIVE",
              bio: consultant.bio || "Chưa có thông tin",
              consultations: consultant.consultations || 0,
              degree_level: consultant.degreeLevel || "Chưa cập nhật",
              experience: consultant.experience || "Chưa cập nhật",
              expiry_date: consultant.expiryDate || null,
              field_of_study: consultant.fieldOfStudy || "Chưa cập nhật",
              issued_date: consultant.issuedDate || null,
              organization: consultant.organization || "Chưa cập nhật",
              rating: consultant.rating || 5.0,
              specialties: consultant.specialities
                ? consultant.specialities
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                : ["Tư vấn tâm lý"],
              consultant_id: consultant.id || null,
              consultantName: consultant.consultantName || "Chưa cập nhật",
            };
          } else {
            return null; // Filter out inactive accounts
          }
        })
      );

      // Filter out any null entries (inactive or not found accounts)
      const finalConsultants = consultantsWithAccountInfo.filter(
        (consultant) => consultant !== null
      );

      return finalConsultants;
    } catch (error) {
      console.error("Error in getConsultants:", error);
      throw this.handleError(error);
    }
  }

  static async getConsultant(id) {
    try {
      const accountResponse = await api.get(`account/${id}`);
      const account = accountResponse.data;

      if (account.role !== "CONSULTANT") {
        throw new Error("Account is not a consultant");
      }

      const consultantsResponse = await api.get("consultants");
      const allConsultants = consultantsResponse.data;
      const consultantInfo = allConsultants.find(
        (consultant) => consultant.accountId === account.id
      );

      if (!consultantInfo) {
        throw new Error("Consultant information not found");
      }

      return {
        id: account.id,
        name: account.name || consultantInfo.consultantName || "Chưa cập nhật",
        email: account.email || "",
        phone: account.phone || "",
        avatar:
          account.avatar || consultantInfo.consultantName?.charAt(0) || "C",
        address: account.address || "",
        gender: account.gender || "",
        dateOfBirth: account.dateOfBirth || null,
        status: account.status || "ACTIVE",
        bio: consultantInfo.bio || "Chưa có thông tin",
        consultations: consultantInfo.consultations || 0,
        degreeLevel: consultantInfo.degreeLevel || "Chưa cập nhật",
        experience: consultantInfo.experience || "Chưa cập nhật",
        expiryDate: consultantInfo.expiryDate || null,
        fieldOfStudy: consultantInfo.fieldOfStudy || "Chưa cập nhật",
        issuedDate: consultantInfo.issuedDate || null,
        organization: consultantInfo.organization || "Chưa cập nhật",
        rating: consultantInfo.rating || 5.0,
        specialties: consultantInfo.specialities
          ? consultantInfo.specialities
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          : ["Tư vấn tâm lý"],
        consultant_id: consultantInfo.id,
        consultantName: consultantInfo.consultantName || "Chưa cập nhật",
      };
    } catch (error) {
      console.error("Error in getConsultant:", error);
      throw this.handleError(error);
    }
  }

  // Schedule APIs
  static async getSchedules() {
    try {
      const response = await api.get("schedules");
      const schedules = response.data || [];

      // Hàm xử lý thời gian dưới dạng chuỗi hoặc object
      const formatTimeString = (timeData) => {
        if (!timeData) {
          return null;
        }
        if (typeof timeData === "string") {
          // Xử lý chuỗi thời gian "HH:MM:SS"
          return timeData.substring(0, 5); // Lấy "HH:MM"
        }
        if (typeof timeData === "object" && timeData.hour && timeData.minute) {
          // Xử lý object thời gian { hour, minute, second, nano }
          return `${String(timeData.hour).padStart(2, "0")}:${String(
            timeData.minute
          ).padStart(2, "0")}`;
        }
        console.warn("Invalid time data:", timeData);
        return null;
      };

      return schedules.map((schedule) => {
        console.log(
          `Schedule ID ${schedule.id} bookedStatus:`,
          schedule.bookedStatus,
          `-> Interpreted as: ${schedule.bookedStatus === 0 ? true : false}`
        );
        return {
          id: schedule.id,
          date: schedule.date,
          recurrence: schedule.recurrence,
          // API trả về bookedStatus: 0 cho slot đã đặt, 1 cho slot chưa đặt
          bookedStatus: schedule.bookedStatus === 0 ? true : false,
          slotId: schedule.slotId,
          consultantId: schedule.consultantId,
          slot: schedule.slot
            ? {
                slotStart: formatTimeString(schedule.slot.slotStart),
                slotEnd: formatTimeString(schedule.slot.slotEnd),
              }
            : { slotStart: null, slotEnd: null },
        };
      });
    } catch (error) {
      console.error("Error fetching schedules:", error);
      throw this.handleError(error);
    }
  }

  static async getSchedule(id) {
    try {
      const response = await api.get(`schedules/${id}`);
      const schedule = response.data;

      // Hàm xử lý thời gian dưới dạng chuỗi hoặc object
      const formatTimeString = (timeData) => {
        if (!timeData) {
          return null;
        }
        if (typeof timeData === "string") {
          // Xử lý chuỗi thời gian "HH:MM:SS"
          return timeData.substring(0, 5); // Lấy "HH:MM"
        }
        if (typeof timeData === "object" && timeData.hour && timeData.minute) {
          // Xử lý object thời gian { hour, minute, second, nano }
          return `${String(timeData.hour).padStart(2, "0")}:${String(
            timeData.minute
          ).padStart(2, "0")}`;
        }
        console.warn("Invalid time data:", timeData);
        return null;
      };

      return {
        id: schedule.id,
        date: schedule.date,
        recurrence: schedule.recurrence,
        // API trả về bookedStatus: 0 cho slot đã đặt, 1 cho slot chưa đặt
        bookedStatus: schedule.bookedStatus === 0 ? true : false,
        slotId: schedule.slotId,
        consultantId: schedule.consultantId,
        slot: schedule.slot
          ? {
              slotStart: formatTimeString(schedule.slot.slotStart),
              slotEnd: formatTimeString(schedule.slot.slotEnd),
            }
          : { slotStart: null, slotEnd: null },
      };
    } catch (error) {
      console.error("Error fetching schedule:", error);
      throw this.handleError(error);
    }
  }

  static async getConsultantSchedules(consultantId) {
    try {
      if (
        !Number.isInteger(Number(consultantId)) ||
        Number(consultantId) <= 0
      ) {
        throw new Error("ID tư vấn viên không hợp lệ");
      }
      const response = await api.get(`schedules/consultant/${consultantId}`);
      const schedules = response.data || [];
      return schedules.map((schedule) => {
        if (!schedule.slot) {
          console.warn(`Lịch ID ${schedule.id} không có thông tin slot`);
          return {
            id: schedule.id,
            date: schedule.date,
            recurrence: schedule.recurrence,
            // API trả về bookedStatus: 0 cho slot đã đặt, 1 cho slot chưa đặt
            bookedStatus: schedule.bookedStatus === 0 ? true : false,
            slotId: schedule.slotId,
            consultantId: schedule.consultantId,
            slot: { slotStart: null, slotEnd: null },
          };
        }

        // Xử lý slot.slotStart và slot.slotEnd dưới dạng chuỗi
        const formatTimeString = (timeStr) => {
          if (!timeStr || typeof timeStr !== "string") {
            console.warn(
              `Invalid time string for schedule ID ${schedule.id}:`,
              timeStr
            );
            return null;
          }
          // Lấy "HH:MM" từ "HH:MM:SS"
          return timeStr.substring(0, 5);
        };

        return {
          id: schedule.id,
          date: schedule.date,
          recurrence: schedule.recurrence,
          // API trả về bookedStatus: 0 cho slot đã đặt, 1 cho slot chưa đặt
          bookedStatus: schedule.bookedStatus === 0 ? true : false,
          slotId: schedule.slotId,
          consultantId: schedule.consultantId,
          slot: {
            slotStart: formatTimeString(schedule.slot.slotStart),
            slotEnd: formatTimeString(schedule.slot.slotEnd),
          },
        };
      });
    } catch (error) {
      console.error("Lỗi khi lấy lịch tư vấn viên:", error);
      throw this.handleError(error);
    }
  }

  // Slot APIs
  static async getSlots() {
    try {
      const response = await api.get("slot");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async createSlot(slotData) {
    try {
      const response = await api.post("slot", slotData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Đăng ký lịch làm việc cho consultant
  static async registerSchedule(scheduleData) {
    try {
      const response = await api.post("slot/register", scheduleData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Appointment APIs
  static async createAppointment(appointmentData) {
    try {
      const requiredFields = [
        "slotId",
        "scheduleId",
        "consultantId",
        "appointmentDate",
      ];
      for (const field of requiredFields) {
        if (!appointmentData[field]) {
          throw new Error(`Thiếu trường bắt buộc: ${field}`);
        }
      }
      if (
        !Number.isInteger(Number(appointmentData.slotId)) ||
        Number(appointmentData.slotId) <= 0
      ) {
        throw new Error("ID slot không hợp lệ");
      }
      if (
        !Number.isInteger(Number(appointmentData.scheduleId)) ||
        Number(appointmentData.scheduleId) <= 0
      ) {
        throw new Error("ID lịch không hợp lệ");
      }
      if (
        !Number.isInteger(Number(appointmentData.consultantId)) ||
        Number(appointmentData.consultantId) <= 0
      ) {
        throw new Error("ID tư vấn viên không hợp lệ");
      }
      const payload = {
        slotId: appointmentData.slotId,
        scheduleId: appointmentData.scheduleId,
        consultantId: appointmentData.consultantId,
        description: appointmentData.description || "",
        appointmentDate: appointmentData.appointmentDate,
      };
      const response = await api.post("appointment", payload);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo lịch hẹn:", error);
      throw this.handleError(error);
    }
  }

  static async updateAppointment(id, appointmentData) {
    try {
      const response = await api.put(`appointments/${id}`, appointmentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async deleteAppointment(id) {
    try {
      const response = await api.delete(`appointments/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateAppointmentStatus(appointmentId, status) {
    try {
      if (
        !Number.isInteger(Number(appointmentId)) ||
        Number(appointmentId) <= 0
      ) {
        throw new Error("ID lịch hẹn không hợp lệ");
      }
      const validStatuses = ["BOOKED", "CONSULTED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        throw new Error("Trạng thái không hợp lệ");
      }
      const response = await api.put(
        `/appointment/${appointmentId}/status?status=${status}`
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      if (error.response?.status === 400) {
        throw new Error(
          "Không thể check-in vào thời điểm này. Vui lòng kiểm tra lại thời gian."
        );
      } else if (error.response?.status === 404) {
        throw new Error("Không tìm thấy lịch hẹn.");
      } else if (error.response?.status === 409) {
        throw new Error("Lịch hẹn đã được check-in trước đó.");
      }
      throw this.handleError(error);
    }
  }

  static async getAppointments() {
    try {
      const response = await api.get("appointment");
      const appointments = response.data || [];
      return appointments.map((appointment) => ({
        id: appointment.id,
        createAt: appointment.createAt,
        description: appointment.description || "",
        status: appointment.status || "BOOKED",
        accountId: appointment.accountId,
        accountName: appointment.accountName || "Chưa cập nhật",
        consultantId: appointment.consultantId,
        consultantName: appointment.consultantName || "Chưa cập nhật",
        meetingLink: appointment.meetingLink || null,
        checkedIn: appointment.checkedIn || false,
        appointmentDate: appointment.appointmentDate,
        scheduleId: appointment.scheduleId,
      }));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      throw this.handleError(error);
    }
  }

  // Get appointments for a specific member
  static async getMemberAppointments(memberId) {
    try {
      const response = await api.get(`appointment/account/${memberId}`);
      const appointments = response.data || [];

      if (appointments.some((apt) => !apt.scheduleId)) {
        console.warn(
          "Some raw appointments are missing scheduleId:",
          appointments.filter((apt) => !apt.scheduleId)
        );
      }

      const schedulesResponse = await api.get("schedules");
      const allSchedules = schedulesResponse.data || [];

      const consultantsResponse = await api.get("consultants");
      const allConsultants = consultantsResponse.data || [];

      // Hàm xử lý thời gian dưới dạng chuỗi hoặc object
      const formatTimeString = (timeData) => {
        if (!timeData) {
          return null;
        }
        if (typeof timeData === "string") {
          // Xử lý chuỗi thời gian "HH:MM:SS"
          return timeData.substring(0, 5); // Lấy "HH:MM"
        }
        if (typeof timeData === "object" && timeData.hour && timeData.minute) {
          // Xử lý object thời gian { hour, minute, second, nano }
          return `${String(timeData.hour).padStart(2, "0")}:${String(
            timeData.minute
          ).padStart(2, "0")}`;
        }
        console.warn("Invalid time data:", timeData);
        return null;
      };

      const enrichedAppointments = await Promise.all(
        appointments.map(async (appointment) => {
          const schedule = allSchedules.find(
            (s) => s.id === appointment.scheduleId
          );
          if (!schedule) {
            console.warn(
              `No schedule found for appointment ${appointment.id} with scheduleId: ${appointment.scheduleId}`
            );
          }

          const consultant = allConsultants.find(
            (c) => c.id === appointment.consultantId
          );

          return {
            id: appointment.id,
            create_at: appointment.createAt,
            description: appointment.description || "",
            status: appointment.status || "BOOKED",
            checked_in: appointment.checkedIn || false,
            meeting_link: appointment.meetingLink || null,
            account_id: appointment.accountId,
            accountName: appointment.accountName || "Chưa cập nhật",
            schedule_id: appointment.scheduleId,
            consultant_id: appointment.consultantId,
            consultantName: appointment.consultantName || "Chưa cập nhật",
            appointment_date: appointment.appointmentDate,
            schedule: schedule
              ? {
                  id: schedule.id,
                  date: schedule.date,
                  // API trả về bookedStatus: 0 cho slot đã đặt, 1 cho slot chưa đặt
                  is_booked: schedule.bookedStatus === 0,
                  recurrence: schedule.recurrence,
                  slot_id: schedule.slotId,
                  consultantId: schedule.consultantId,
                  slot: schedule.slot
                    ? {
                        id: schedule.slotId,
                        label:
                          schedule.slot.label ||
                          `${formatTimeString(
                            schedule.slot.slotStart
                          )} - ${formatTimeString(schedule.slot.slotEnd)}`,
                        slot_start: formatTimeString(schedule.slot.slotStart),
                        slot_end: formatTimeString(schedule.slot.slotEnd),
                      }
                    : null,
                }
              : null,
            consultant: consultant
              ? {
                  id: consultant.id,
                  name: consultant.consultantName || "Chuyên gia",
                  email: consultant.account?.email || "",
                  phone: consultant.account?.phone || "",
                  avatar: consultant.account?.avatar || "",
                  field_of_study: consultant.fieldOfStudy || "",
                  degree_level: consultant.degreeLevel || "",
                  experience: consultant.experience || "",
                  organization: consultant.organization || "",
                  rating: consultant.rating || 5.0,
                  bio: consultant.bio || "",
                  specialties: consultant.specialities
                    ? consultant.specialities.split(",").map((s) => s.trim())
                    : [],
                  consultantName: consultant.consultantName || "Chưa cập nhật",
                }
              : null,
          };
        })
      );

      return enrichedAppointments;
    } catch (error) {
      console.error("Error fetching member appointments:", error);
      throw this.handleError(error);
    }
  }

  // Check-in to an appointment
  static async checkInAppointment(appointmentId) {
    try {
      const response = await api.post(`appointment/${appointmentId}/check-in`);
      return response.data;
    } catch (error) {
      console.error("Error checking in appointment:", error);
      if (error.response?.status === 400) {
        throw new Error(
          "Không thể check-in vào thời điểm này. Vui lòng kiểm tra lại thời gian."
        );
      } else if (error.response?.status === 404) {
        throw new Error("Không tìm thấy lịch hẹn.");
      } else if (error.response?.status === 409) {
        throw new Error("Lịch hẹn đã được check-in trước đó.");
      }
      throw this.handleError(error);
    }
  }

  // Blog APIs
  static async getBlogs() {
    try {
      const response = await api.get("blogs");
      const blogs = response.data || [];

      // Transform the API response to match the expected format
      return blogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        category: blog.category,
        author: {
          name: blog.author,
          role: "Chuyên gia",
          avatar: blog.author ? blog.author.charAt(0).toUpperCase() : "A",
          bio: `Chuyên gia trong lĩnh vực ${
            blog.category?.toLowerCase() || "tư vấn"
          }`,
        },
        readTime: blog.readTime || "5 phút đọc",
        views: blog.views || "0 lượt xem",
        date: blog.date || new Date().toLocaleDateString("vi-VN"),
        tags: blog.tags ? blog.tags.split(",").map((tag) => tag.trim()) : [],
      }));
    } catch (error) {
      console.error("Error fetching blogs:", error);
      throw this.handleError(error);
    }
  }

  static async getBlog(id) {
    try {
      const response = await api.get(`blogs/${id}`);
      const blog = response.data;

      if (!blog) {
        throw new Error("Blog not found");
      }

      // Transform the API response to match the expected format
      return {
        id: blog.id,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        category: blog.category,
        author: {
          name: blog.author,
          role: "Chuyên gia",
          avatar: blog.author ? blog.author.charAt(0).toUpperCase() : "A",
          bio: `Chuyên gia trong lĩnh vực ${
            blog.category?.toLowerCase() || "tư vấn"
          }`,
        },
        readTime: blog.readTime || "5 phút đọc",
        views: blog.views || "0 lượt xem",
        date: blog.date || new Date().toLocaleDateString("vi-VN"),
        tags: blog.tags ? blog.tags.split(",").map((tag) => tag.trim()) : [],
      };
    } catch (error) {
      console.error("Error fetching blog:", error);
      throw this.handleError(error);
    }
  }

  static async createBlog(blogData) {
    try {
      const payload = {
        title: blogData.title,
        description: blogData.description,
        content: blogData.content,
        category: blogData.category,
        author: blogData.author,
        readTime: blogData.readTime || "5 phút đọc",
        views: blogData.views || "0 lượt xem",
        date: blogData.date || new Date().toISOString().split("T")[0],
        tags: Array.isArray(blogData.tags)
          ? blogData.tags.join(", ")
          : blogData.tags || "",
      };

      const response = await api.post("blogs", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating blog:", error);
      throw this.handleError(error);
    }
  }

  static async updateBlog(id, blogData) {
    try {
      const payload = {
        title: blogData.title,
        description: blogData.description,
        content: blogData.content,
        category: blogData.category,
        author: blogData.author,
        readTime: blogData.readTime || "5 phút đọc",
        views: blogData.views || "0 lượt xem",
        date: blogData.date || new Date().toISOString().split("T")[0],
        tags: Array.isArray(blogData.tags)
          ? blogData.tags.join(", ")
          : blogData.tags || "",
      };

      const response = await api.put(`blogs/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating blog:", error);
      throw this.handleError(error);
    }
  }

  static async deleteBlog(id) {
    try {
      const response = await api.delete(`blogs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting blog:", error);
      throw this.handleError(error);
    }
  }

  // Handle API errors
  static handleError(error) {
    console.error("API Error:", error);
    if (error.response) {
      const message = error.response.data?.message || "Server error occurred";
      return new Error(message);
    } else if (error.request) {
      return new Error("Network error - please check your connection");
    } else {
      return new Error("An unexpected error occurred");
    }
  }
}

export default ApiService;