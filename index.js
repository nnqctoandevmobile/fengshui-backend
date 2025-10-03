const express = require("express");
const sgMail = require("@sendgrid/mail");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Log để kiểm tra khi server khởi động
console.log("Starting server...");
console.log("PORT:", process.env.PORT);

// Kiểm tra SENDGRID_API_KEY
if (!process.env.SENDGRID_API_KEY) {
  console.error("ERROR: SENDGRID_API_KEY is not set in environment variables!");
  process.exit(1); // Thoát nếu thiếu API Key
}

// Cấu hình SendGrid API Key
try {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid API Key configured successfully");
} catch (error) {
  console.error("ERROR: Failed to configure SendGrid API Key:", error.message);
  process.exit(1);
}

// Middleware
app.use(cors()); // Cho phép Flutter Web gửi yêu cầu
app.use(express.json()); // Parse JSON body

// Endpoint gửi email: https://fengshui-backend-7szh.onrender.com/api/send-email
app.post("/api/send-email", async (req, res) => {
  console.log("Received POST request to /api/send-email");
  console.log("Request body:", req.body);

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const {
    customerName,
    customerPhone,
    customerAddress,
    consultationDescription,
    receivedTime,
    emailTemplate,
    toEmail,
  } = req.body;

  if (!toEmail || !customerName || !customerPhone || !emailTemplate) {
    console.log("Missing required fields:", { toEmail, customerName, customerPhone, emailTemplate });
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  const address = customerAddress || "Chưa cung cấp";
  const description = consultationDescription || "Không có mô tả";

  const subject = `Yêu cầu tư vấn mới - ${receivedTime}`;
  const msg = {
    to: toEmail,
    from: {
      email: "toannguyendc9@gmail.com", // Email đã xác minh trên SendGrid
      name: "Phong Thủy Đại Nam",
    },
    subject,
    html: emailTemplate,
    metadata: { address, description },
  };

  try {
    console.log("Sending email with config:", msg);
    await sgMail.send(msg);
    console.log("Email sent successfully to:", toEmail);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("SendGrid error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint: https://fengshui-backend-7szh.onrender.com/api/health
app.get("/api/health", (req, res) => {
  console.log("Health check requested");
  res.status(200).json({ status: "OK" });
});

// Khởi động server
try {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error("ERROR: Failed to start server:", error.message);
  process.exit(1);
}