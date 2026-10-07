const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Không có token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided"
    });
  }

  // Lấy token sau chữ Bearer
  const token = authHeader.split(" ")[1];

  try {
    // Kiểm tra token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lưu thông tin user vào request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = verifyToken;