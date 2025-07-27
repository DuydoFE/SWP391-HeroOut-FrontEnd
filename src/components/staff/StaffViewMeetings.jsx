import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Modal,
  DatePicker,
  Typography,
  Space,
  Card,
  Select,
  Table,
  Tag,
  Spin,
  Alert,
  message,
  Tooltip,
} from "antd";
import { Lock } from "lucide-react";
import dayjs from "dayjs";
import ApiService from "../../services/apiService";

const { Title, Text } = Typography;
const { Option } = Select;

const StaffViewMeetings = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredConsultantId, setFilteredConsultantId] = useState(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [initialDataError, setInitialDataError] = useState(null);
  const [schedulesError, setSchedulesError] = useState(null);
  const [registrationError, setRegistrationError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitialData(true);
      setInitialDataError(null);
      try {
        const consultantsData = await ApiService.getConsultants();
        setConsultants(consultantsData);

        const slotsData = await ApiService.getSlots();
        setAvailableSlots(slotsData);
      } catch (err) {
        setInitialDataError(
          "Không thể tải dữ liệu ban đầu (danh sách chuyên viên hoặc slot)."
        );
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    setSchedulesError(null);
    try {
      const schedulesData = await ApiService.getSchedules();
      const validSchedules = schedulesData.filter((schedule) => {
        const isValid =
          schedule.slot &&
          schedule.slot.slotStart &&
          schedule.slot.slotEnd &&
          typeof schedule.slot.slotStart === "string" &&
          typeof schedule.slot.slotEnd === "string" &&
          schedule.hasOwnProperty("bookedStatus") &&
          schedule.slotId !== undefined;
        return isValid;
      });
      setSchedules(validSchedules);
    } catch (err) {
      setSchedulesError("Không thể tải danh sách lịch đã đăng ký.");
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedDate(null);
    setSelectedConsultantId(null);
    setSelectedSlotIds([]);
    setRegistrationError(null);
  };

  const handleOk = async () => {
    if (
      !selectedDate ||
      selectedConsultantId === null ||
      selectedSlotIds.length === 0
    ) {
      message.warning(
        "Vui lòng chọn đầy đủ Chuyên viên, Ngày và ít nhất một Slot thời gian."
      );
      return;
    }

    setRegistering(true);
    setRegistrationError(null);

    try {
      const registrationData = {
        date: selectedDate.format("YYYY-MM-DD"),
        consultantId: selectedConsultantId,
        slotIds: selectedSlotIds,
      };

      const response = await ApiService.registerSchedule(registrationData);

      message.success(`Đã đăng ký thành công ${selectedSlotIds.length} slot!`);

      fetchSchedules();

      setIsModalVisible(false);
      setSelectedDate(null);
      setSelectedConsultantId(null);
      setSelectedSlotIds([]);
    } catch (err) {
      const errorMessage =
        err.message || "Có lỗi xảy ra khi đăng ký lịch làm việc.";
      setRegistrationError(errorMessage);
      message.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedDate(null);
    setSelectedConsultantId(null);
    setSelectedSlotIds([]);
    setRegistrationError(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlotIds([]);
  };

  const handleConsultantChange = (value) => {
    setSelectedConsultantId(value);
    setSelectedSlotIds([]);
  };

  const handleSlotSelect = (slotId) => {
    if (bookedSlots.has(slotId)) {
      message.warning("Slot này đã được đăng ký!");
      return;
    }
    if (selectedSlotIds.includes(slotId)) {
      setSelectedSlotIds((prevIds) => prevIds.filter((id) => id !== slotId));
    } else {
      setSelectedSlotIds((prevIds) => [...prevIds, slotId]);
    }
  };

  const handleFilterConsultantChange = (value) => {
    setFilteredConsultantId(value);
  };

  const isOkButtonDisabled =
    !selectedDate ||
    selectedConsultantId === null ||
    selectedSlotIds.length === 0 ||
    registering;

  const selectedSlotObjects = useMemo(() => {
    return availableSlots.filter((slot) => selectedSlotIds.includes(slot.id));
  }, [selectedSlotIds, availableSlots]);

  const bookedSlots = useMemo(() => {
    if (!selectedDate || !selectedConsultantId) return new Set();
    const formattedDate = selectedDate.format("YYYY-MM-DD");
    return new Set(
      schedules
        .filter((schedule) => {
          const matchesConsultant =
            String(schedule.consultantId) === String(selectedConsultantId);
          const matchesDate = schedule.date === formattedDate;
          const isBooked = schedule.bookedStatus === false; // Since 1 -> false means booked
          return matchesConsultant && matchesDate && isBooked;
        })
        .map((schedule) => String(schedule.slotId))
    );
  }, [schedules, selectedConsultantId, selectedDate]);

  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const columns = [
    {
      title: "Chuyên viên",
      dataIndex: "consultantId",
      key: "consultantName",
      render: (consultantId) => {
        const consultant = consultants.find(
          (c) => c.consultant_id === consultantId
        );
        return consultant ? consultant.consultantName : "Không rõ";
      },
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Slot",
      dataIndex: "slot",
      key: "slot",
      render: (slot) => {
        if (!slot || !slot.slotStart || !slot.slotEnd)
          return <Tag color="default">N/A</Tag>;
        return <Tag color="blue">{`${slot.slotStart} - ${slot.slotEnd}`}</Tag>;
      },
    },
  ];

  const filteredSchedules = useMemo(() => {
    if (!filteredConsultantId) return schedules;
    return schedules.filter(
      (schedule) =>
        String(schedule.consultantId) === String(filteredConsultantId)
    );
  }, [schedules, filteredConsultantId]);

  if (loadingInitialData) {
    return (
      <Card>
        <Space
          direction="vertical"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Spin size="large" />
          <Text>Đang tải dữ liệu ban đầu...</Text>
        </Space>
      </Card>
    );
  }

  if (initialDataError) {
    return (
      <Card>
        <Alert
          message="Lỗi tải dữ liệu ban đầu"
          description={initialDataError}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Title level={3} style={{ marginBottom: 0 }}>
          Xem & Đăng ký Lịch làm việc
        </Title>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Button
          type="primary"
          onClick={showModal}
          style={{
            backgroundColor: "#52c41a",
            borderColor: "#52c41a",
          }}
        >
          Đăng kí lịch làm việc
        </Button>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Space align="center">
            <Text strong>Lọc theo chuyên viên:</Text>
            <Select
              placeholder="Chọn chuyên viên để lọc"
              style={{ width: 200 }}
              onChange={handleFilterConsultantChange}
              value={filteredConsultantId}
              allowClear
            >
              {Array.isArray(consultants) &&
                consultants.map((consultant) => (
                  <Option
                    key={consultant.consultant_id}
                    value={consultant.consultant_id}
                  >
                    {consultant.consultantName}
                  </Option>
                ))}
            </Select>
          </Space>

          <Title level={4} style={{ marginTop: "10px", marginBottom: "10px" }}>
            Lịch làm việc đã đăng ký
          </Title>

          {schedulesError && (
            <Alert
              message="Lỗi tải lịch đã đăng ký"
              description={schedulesError}
              type="error"
              showIcon
              style={{ marginBottom: "10px" }}
            />
          )}

          <Spin spinning={loadingSchedules}>
            <Table
              dataSource={filteredSchedules}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Spin>
        </Space>
      </Space>

      <Modal
        title="Đăng ký Lịch làm việc"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{
          disabled: isOkButtonDisabled,
          loading: registering,
          type: "primary",
          style: {
            backgroundColor: "#52c41a",
            borderColor: "#52c41a",
          },
        }}
        cancelButtonProps={{
          type: "primary",
          danger: true,
        }}
        width={400}
        destroyOnClose={true}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {registrationError && (
            <Alert
              message="Lỗi đăng ký"
              description={registrationError}
              type="error"
              showIcon
            />
          )}

          <div>
            <Text strong>Chọn chuyên viên:</Text>
            <br />
            <Select
              placeholder="Chọn chuyên viên"
              style={{ width: "100%", marginTop: "8px" }}
              onChange={handleConsultantChange}
              value={selectedConsultantId}
              allowClear
              loading={loadingInitialData}
            >
              {Array.isArray(consultants) &&
                consultants.map((consultant) => (
                  <Option
                    key={consultant.consultant_id}
                    value={consultant.consultant_id}
                  >
                    {consultant.consultantName}
                  </Option>
                ))}
            </Select>
          </div>

          <div>
            <Text strong>Chọn ngày:</Text>
            <br />
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
              style={{ marginTop: "8px" }}
            />
          </div>

          <div>
            <Title level={5} style={{ marginTop: "10px", marginBottom: "5px" }}>
              Chọn Slot thời gian:
            </Title>

            <div className="grid grid-cols-2 gap-3">
              {availableSlots.map((slot) => {
                const isBooked = bookedSlots.has(String(slot.id));
                return (
                  <Tooltip
                    key={slot.id}
                    title={isBooked ? "Slot này đã được đăng ký" : ""}
                  >
                    <div
                      className={`p-3 border rounded-lg text-center flex flex-col items-center justify-center ${
                        isBooked
                          ? "border-gray-300 bg-gray-100 opacity-60 pointer-events-none"
                          : selectedSlotIds.includes(slot.id)
                          ? "border-emerald-600 bg-emerald-50 cursor-pointer"
                          : "border-gray-200 bg-white cursor-pointer"
                      }`}
                      onClick={() => !isBooked && handleSlotSelect(slot.id)}
                    >
                      <div className="flex items-center">
                        {isBooked && (
                          <Lock className="w-4 h-4 mr-1 text-gray-500" />
                        )}
                        <span
                          className={`font-medium ${
                            isBooked ? "text-gray-500" : "text-gray-700"
                          }`}
                        >
                          {slot.label}
                        </span>
                      </div>
                      {isBooked && (
                        <div className="text-xs text-red-500 mt-1">
                          Đã được đặt
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {selectedSlotIds.length > 0 && (
              <Text strong style={{ marginTop: "10px", display: "block" }}>
                Slot đã chọn:{" "}
                {selectedSlotObjects.map((slot) => slot.label).join(", ")}
              </Text>
            )}
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default StaffViewMeetings;