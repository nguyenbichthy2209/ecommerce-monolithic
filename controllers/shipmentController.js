const prisma = require("../config/prisma");

const allowedStatuses = ["PENDING", "SHIPPING", "DELIVERED"];

const validInt = (value) =>
  Number.isInteger(value) && value > 0 && value <= 2147483647;

const parseId = (value) =>
  /^[1-9]\d*$/.test(value) && validInt(Number(value))
    ? Number(value)
    : null;

function handleError(res, error) {
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Shipment not found" });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      message: "Related order changed. Please refresh and retry"
    });
  }

  console.error("SHIPMENT ERROR:", error);
  return res.status(500).json({ message: "Cannot process shipment" });
}

const createShipment = async (req, res) => {
  const { oid, status } = req.body || {};

  if (!validInt(oid)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid shipment status" });
  }

  try {
    const order = await prisma.order.findUnique({ where: { oid } });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shipment = await prisma.shipment.create({
      data: { oid, status }
    });

    return res.status(201).json({
      message: "Shipment created successfully",
      shipment
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateShipmentStatus = async (req, res) => {
  const shipid = parseId(req.params.id);
  const { status } = req.body || {};

  if (shipid === null) {
    return res.status(400).json({ message: "Invalid shipment ID" });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid shipment status" });
  }

  try {
    const shipment = await prisma.shipment.update({
      where: { shipid },
      data: { status }
    });

    return res.status(200).json({
      message: "Shipment status updated successfully",
      shipment
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getShipmentByOrder = async (req, res) => {
  const oid = parseId(req.params.oid);

  if (oid === null) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const order = await prisma.order.findUnique({ where: { oid } });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.uid !== req.user.uid) {
      return res.status(403).json({
        message: "You do not have permission to view this shipment"
      });
    }

    const shipment = await prisma.shipment.findFirst({
      where: { oid },
      orderBy: { shipid: "asc" }
    });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    return res.status(200).json(shipment);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createShipment,
  updateShipmentStatus,
  getShipmentByOrder
};
