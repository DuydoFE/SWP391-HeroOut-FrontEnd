import React from "react";
import { Form, Input, Button, Typography, Card, notification } from "antd";
import { LockOutlined, KeyOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import HeroOutLogo from "../../assets/heroout.jpg";
import api from "../../services/axios";

const { Title, Text } = Typography;

function ResetPassword() {
  const navigate = useNavigate();

  const handleResetPassword = async (values) => {
    // Lấy token và password từ giá trị của form
    const { token, password } = values;

    try {
      // Gửi request với payload chính xác theo yêu cầu của API
      await api.post("/reset-password", { token, newPassword: password });
      notification.success({
        message: "Thành công",
        description: "Mật khẩu của bạn đã được đặt lại thành công!",
        placement: "topRight",
      });
      navigate("/login");
    } catch (error) {
      notification.error({
        message: "Đặt lại mật khẩu thất bại",
        description:
          error.response?.data?.message ||
          "Mã khôi phục không hợp lệ hoặc đã hết hạn.",
        placement: "topRight",
      });
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#009066",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card style={{ maxWidth: 400, width: "100%", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link to="/">
              <img
                src={HeroOutLogo}
                alt="Heroout Logo"
                style={{ height: 120 }}
              />
            </Link>
          </div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={3}>Đặt lại mật khẩu</Title>
            <Text type="secondary">Vui lòng nhập mật khẩu mới của bạn.</Text>
          </div>

          <Form layout="vertical" onFinish={handleResetPassword}>
            <Form.Item
              label="Mã khôi phục"
              name="token"
              rules={[
                { required: true, message: "Vui lòng nhập mã khôi phục!" },
              ]}
            >
              <Input
                prefix={<KeyOutlined />}
                placeholder="Nhập mã từ email của bạn"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu mới"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirm_password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Hai mật khẩu bạn đã nhập không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Xác nhận mật khẩu"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                style={{ backgroundColor: "#009066", borderColor: "#009066" }}
              >
                Đặt lại mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}

export default ResetPassword;
