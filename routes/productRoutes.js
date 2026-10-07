const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

// Ai cũng có thể xem sản phẩm
router.get("/", getAllProducts);

// Chỉ ADMIN được thêm, sửa, xóa sản phẩm
router.post("/", verifyToken, authorizeRole(2), createProduct);
router.put("/:id", verifyToken, authorizeRole(2), updateProduct);
router.delete("/:id", verifyToken, authorizeRole(2), deleteProduct);

module.exports = router;