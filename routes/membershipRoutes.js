const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
  getMyMembership
} = require("../controllers/membershipController");

// Người dùng xem thông tin Membership của chính mình
router.get(
  "/me",
  verifyToken,
  getMyMembership
);

module.exports = router;