import React from "react";
import { Form, Input, Button, Typography, Card, notification } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import HeroOutLogo from "../../assets/heroout.jpg";
import api from "../../services/axios";

const { Title, Text } = Typography;

function ForgotPassword() {
  const navigate = useNavigate();

  const handleForgotPassword = async (values) => {
    try {
      await api.post("/forgot-password", values);
      notification.success({
        message: "Thành công",
        description:
          "Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn!",
        placement: "topRight",
      });
      navigate("/reset-password");
    } catch (error) {
      notification.error({
        message: "Gửi yêu cầu thất bại",
        description:
          error.response?.data?.message ||
          "Đã có lỗi xảy ra. Vui lòng thử lại.",
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link to="/">
              <img
                src={HeroOutLogo}
                alt="Heroout Logo"
                style={{ height: 120 }}
              />
            </Link>
          </div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={3}>Quên mật khẩu</Title>
            <Text type="secondary">Nhập email để khôi phục mật khẩu</Text>
          </div>

          <Form layout="vertical" onFinish={handleForgotPassword}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không đúng định dạng!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Nhập email của bạn"
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
                Gửi liên kết đặt lại mật khẩu
              </Button>
            </Form.Item>

            <Text style={{ display: "block", textAlign: "center" }}>
              Quay lại{" "}
              <Link to="/login" style={{ color: "#009066" }}>
                Đăng nhập
              </Link>
            </Text>
          </Form>
        </Card>
      </div>
    </>
  );
}

export default ForgotPassword;
