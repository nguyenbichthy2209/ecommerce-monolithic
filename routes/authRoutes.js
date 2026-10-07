const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  register,
  login
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

router.get("/profile", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Access granted",
    user: req.user
  });
});

router.get(
  "/admin",
  verifyToken,
  authorizeRole(2),
  (req, res) => {
    res.status(200).json({
      message: "Welcome Admin"
    });
  }
);

module.exports = router;