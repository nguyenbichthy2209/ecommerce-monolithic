const prisma = require("../config/prisma");

const validInt = (value) =>
  Number.isInteger(value) && value > 0 && value <= 2147483647;

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

module.exports = async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return res.status(400).json({
      message: "Order must contain 1-100 items"
    });
  }

  if (items.some(item =>
    !item || !validInt(item.pid) || !validInt(item.qty)
  )) {
    return res.status(400).json({
      message: "Each item must contain positive integer pid and qty"
    });
  }

  if (new Set(items.map(item => item.pid)).size !== items.length) {
    return res.status(400).json({
      message: "Duplicate product IDs are not allowed"
    });
  }

  // Khóa sản phẩm theo cùng thứ tự để giảm nguy cơ deadlock.
  const sortedItems = [...items].sort((a, b) => a.pid - b.pid);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: { uid: req.user.uid }
      });

      for (const item of sortedItems) {
        const stock = await tx.product.updateMany({
          where: {
            pid: item.pid,
            quantity: { gte: item.qty }
          },
          data: {
            quantity: { decrement: item.qty }
          }
        });

        if (stock.count === 0) {
          const product = await tx.product.findUnique({
            where: { pid: item.pid }
          });

          if (!product) {
            fail(404, `Product ${item.pid} not found`);
          }

          fail(409, `Insufficient stock for product ${item.pid}`);
        }

        const product = await tx.product.findUnique({
          where: { pid: item.pid }
        });

        await tx.orderDetail.create({
          data: {
            oid: created.oid,
            pid: item.pid,
            qty: item.qty,
            unit_price: product.price
          }
        });
      }

      await tx.shipment.create({
        data: {
          oid: created.oid,
          status: "PENDING"
        }
      });

      return tx.order.findUnique({
        where: { oid: created.oid },
        include: {
          orderDetails: {
            include: { product: true }
          },
          shipments: true
        }
      });
    }, { timeout: 15000 });

    return res.status(201).json({
      message: "Order and shipment created successfully",
      order
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    if (["P2034", "P2003", "P2028"].includes(error.code)) {
      return res.status(409).json({
        message: "Order could not complete. Please refresh and retry"
      });
    }

    console.error("CHECKOUT ERROR:", error);
    return res.status(500).json({ message: "Cannot create order" });
  }
};
