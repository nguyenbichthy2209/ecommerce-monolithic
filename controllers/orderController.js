const prisma = require("../config/prisma");

const validInt = (value) =>
  Number.isInteger(value) && value > 0 && value <= 2147483647;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function handleError(res, error) {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      message: "Product already exists in this order"
    });
  }

  if (error.code === "P2034") {
    return res.status(409).json({
      message: "Concurrent update detected. Please retry"
    });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      message: "Related data changed. Please refresh and retry"
    });
  }

  console.error("ORDER ERROR:", error);
  return res.status(500).json({ message: "Cannot process order" });
}

const createOrder = async (req, res) => {
  try {
    const order = await prisma.order.create({
      data: { uid: req.user.uid }
    });

    return res.status(201).json({
      message: "Order created successfully",
      order
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const addOrderDetail = async (req, res) => {
  const oidText = req.params.oid;
  const oid = Number(oidText);
  const { pid, qty } = req.body || {};

  if (!/^[1-9]\d*$/.test(oidText) || !validInt(oid)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  if (!validInt(pid) || !validInt(qty)) {
    return res.status(400).json({
      message: "pid and qty must be positive integers up to 2147483647"
    });
  }

  try {
    const orderDetail = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { oid } });

      if (!order) fail(404, "Order not found");

      if (order.uid !== req.user.uid) {
        fail(403, "You do not have permission to modify this order");
      }

      const existing = await tx.orderDetail.findUnique({
        where: { oid_pid: { oid, pid } }
      });

      if (existing) fail(409, "Product already exists in this order");

      // Chỉ giảm kho khi số lượng hiện tại vẫn đủ.
      const stock = await tx.product.updateMany({
        where: {
          pid,
          quantity: { gte: qty }
        },
        data: {
          quantity: { decrement: qty }
        }
      });

      if (stock.count === 0) {
        const product = await tx.product.findUnique({
          where: { pid }
        });

        if (!product) fail(404, "Product not found");
        fail(409, "Insufficient stock");
      }

      // Bản ghi sản phẩm đã được khóa bởi thao tác giảm kho
      // cho đến khi transaction hoàn tất.
      const product = await tx.product.findUnique({
        where: { pid }
      });

      return tx.orderDetail.create({
        data: {
          oid,
          pid,
          qty,
          unit_price: product.price
        }
      });
    });

    return res.status(201).json({
      message: "Product added to order successfully",
      orderDetail
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { uid: req.user.uid },
      include: {
        orderDetails: {
          include: { product: true }
        }
      },
      orderBy: { createat: "desc" }
    });

    return res.status(200).json(orders);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createOrder,
  addOrderDetail,
  getMyOrders
};
