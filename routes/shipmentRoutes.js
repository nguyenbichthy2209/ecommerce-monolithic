const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  createShipment,
  updateShipmentStatus,
  getShipmentByOrder
} = require("../controllers/shipmentController");

router.post(
  "/",
  verifyToken,
  authorizeRole(2),
  createShipment
);

router.put(
  "/:id/status",
  verifyToken,
  authorizeRole(2),
  updateShipmentStatus
);

router.get(
  "/order/:oid",
  verifyToken,
  getShipmentByOrder
);

module.exports = router;