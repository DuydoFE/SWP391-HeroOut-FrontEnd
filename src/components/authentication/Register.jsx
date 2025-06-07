import React, { useState } from "react";
import { Form, Input, Checkbox, Button, Row, Col, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Link } from "react-router-dom";
import HeroOutLogo from "../../assets/heroout.jpg";


const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log("Success:", values);
    // Handle registration logic here
  };

  return (
    <>
      <style>{`
        
        *, *::before, *::after {
          margin: 0;
          padding: 0;

      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#009066",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: 40,
            borderRadius: 12,
            width: "100%",
            maxWidth: 480,
            margin: "20px 0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link to="/">
              <img
                src={HeroOutLogo}
                alt="Heroout Logo"
                style={{ width: 140, height: 120, objectFit: "contain" }}
              />
            </Link>
          </div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={3}>Đăng ký tài khoản</Title>
            <Text type="secondary">
              Tạo tài khoản để trải nghiệm đầy đủ dịch vụ
            </Text>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Họ"
                  name="firstName"
                  rules={[{ required: true, message: "Vui lòng nhập họ" }]}
                >
                  <Input placeholder="Nhập họ" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tên"
                  name="lastName"
                  rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                >
                  <Input placeholder="Nhập tên" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email của bạn" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                {
                  pattern: /^0\d{9}$/,
                  message:
                    "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0",
                },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                placeholder="Tạo mật khẩu"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Nhập lại mật khẩu"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                        new Error("Bạn phải đồng ý với điều khoản")
                      ),
                },
              ]}
            >
              <Checkbox>
                Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và{" "}
                <a href="#">Chính sách bảo mật</a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{
                  backgroundColor: "#009066",
                  borderColor: "#009066",
                  padding: "10px 20px",      
                  fontSize: "14px",           
                  height: "44px",             
                  borderRadius: "10px",        
                }}
              >
                Đăng ký
              </Button>


            </Form.Item>
          </Form>

          <Text style={{ display: "block", textAlign: "center" }}>
            Đã có tài khoản?{" "}
            <Link to="/login" style={{ color: "#009066" }}>
              Đăng nhập
            </Link>
          </Text>
        </div>
      </div>
    </>
  );
};

export default Register;
