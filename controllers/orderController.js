const prisma = require("../config/prisma");

const createOrder = async (req, res) => {
  try {
    // uid được lấy từ JWT của người đang đăng nhập
    const uid = req.user.uid;

    const order = await prisma.order.create({
      data: {
        uid: uid
      }
    });

    res.status(201).json({
      message: "Order created successfully",
      order
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      message: "Cannot create order"
    });
  }
};
const addOrderDetail = async (req, res) => {
  try {
    const oid = parseInt(req.params.oid);
    const { pid, qty } = req.body;
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

if (order.uid !== req.user.uid) {
  return res.status(403).json({
    message: "You do not have permission to modify this order"
  });
}
    // Tìm sản phẩm
    const product = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Kiểm tra số lượng tồn kho
    if (qty <= 0 || qty > product.quantity) {
      return res.status(400).json({
        message: "Invalid quantity"
      });
    }

    // Thêm sản phẩm vào chi tiết đơn hàng
    // Thêm chi tiết đơn hàng và giảm tồn kho cùng lúc
const [orderDetail] = await prisma.$transaction([
  prisma.orderDetail.create({
    data: {
      oid: oid,
      pid: pid,
      qty: qty,
      unit_price: product.price
    }
  }),

  prisma.product.update({
    where: {
      pid: pid
    },
    data: {
      quantity: {
        decrement: qty
      }
    }
  })
]);

    res.status(201).json({
      message: "Product added to order successfully",
      orderDetail
    });

  } catch (error) {
    console.error("ADD ORDER DETAIL ERROR:", error);

    res.status(500).json({
      message: "Cannot add product to order"
    });
  }
};
const getMyOrders = async (req, res) => {
  try {
    const uid = req.user.uid;

    const orders = await prisma.order.findMany({
      where: {
        uid: uid
      },
      include: {
        orderDetails: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createat: "desc"
      }
    });

    res.status(200).json(orders);

  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);

    res.status(500).json({
      message: "Cannot get orders"
    });
  }
};
module.exports = {
  createOrder,
  addOrderDetail,
  getMyOrders
};