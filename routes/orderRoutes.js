const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
  createOrder,
  addOrderDetail,
  getMyOrders
} = require("../controllers/orderController");

// Người dùng phải đăng nhập mới được tạo đơn hàng
router.post("/", verifyToken, require("../controllers/checkoutController"));
router.get("/my-orders", verifyToken, getMyOrders);
router.post("/:oid/items", verifyToken, addOrderDetail);

module.exports = router;