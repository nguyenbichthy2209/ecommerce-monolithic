const prisma = require("../config/prisma");

// Tạo Shipment
const createShipment = async (req, res) => {
  try {
    const { oid, status } = req.body;

    const allowedStatuses = ["PENDING", "SHIPPING", "DELIVERED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid shipment status"
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        oid: oid
      }
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const shipment = await prisma.shipment.create({
      data: {
        oid: oid,
        status: status
      }
    });

    res.status(201).json({
      message: "Shipment created successfully",
      shipment
    });

  } catch (error) {
    console.error("CREATE SHIPMENT ERROR:", error);

    res.status(500).json({
      message: "Cannot create shipment"
    });
  }
};


// Cập nhật trạng thái Shipment
const updateShipmentStatus = async (req, res) => {
  try {
    const shipid = parseInt(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ["PENDING", "SHIPPING", "DELIVERED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid shipment status"
      });
    }

    const shipment = await prisma.shipment.findUnique({
      where: {
        shipid: shipid
      }
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found"
      });
    }

    const updatedShipment = await prisma.shipment.update({
      where: {
        shipid: shipid
      },
      data: {
        status: status
      }
    });

    res.status(200).json({
      message: "Shipment status updated successfully",
      shipment: updatedShipment
    });

  } catch (error) {
    console.error("UPDATE SHIPMENT ERROR:", error);

    res.status(500).json({
      message: "Cannot update shipment"
    });
  }
};
const getShipmentByOrder = async (req, res) => {
  try {
    const oid = parseInt(req.params.oid);

    const order = await prisma.order.findUnique({
      where: {
        oid: oid
      }
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // Chỉ chủ sở hữu Order mới được xem
    if (order.uid !== req.user.uid) {
      return res.status(403).json({
        message: "You do not have permission to view this shipment"
      });
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        oid: oid
      }
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found"
      });
    }

    res.status(200).json(shipment);

  } catch (error) {
    console.error("GET SHIPMENT ERROR:", error);

    res.status(500).json({
      message: "Cannot get shipment"
    });
  }
};
module.exports = {
  createShipment,
  updateShipmentStatus,
  getShipmentByOrder
};