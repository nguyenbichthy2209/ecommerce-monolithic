const prisma = require("../config/prisma");

const validId = (value) =>
  /^[1-9]\d*$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) <= 2147483647;

function validateProduct(body) {
  const { pname, price, quantity } = body || {};

  if (
    typeof pname !== "string" ||
    !pname.trim() ||
    pname.trim().length > 100
  ) {
    return "pname must contain 1 to 100 characters";
  }

  // DECIMAL(10,2): tối đa 8 chữ số phần nguyên, 2 số thập phân.
  if (
    !["string", "number"].includes(typeof price) ||
    !/^\d{1,8}(\.\d{1,2})?$/.test(String(price)) ||
    Number(price) <= 0
  ) {
    return "price must be positive, at most 99999999.99 and 2 decimal places";
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 2147483647
  ) {
    return "quantity must be a non-negative integer up to 2147483647";
  }

  return null;
}

function handleError(res, error) {
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Product not found" });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      message: "Cannot delete a product referenced by an order"
    });
  }

  console.error("PRODUCT ERROR:", error);
  return res.status(500).json({ message: "Cannot process product" });
}

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { pid: "asc" }
    });
    return res.status(200).json(products);
  } catch (error) {
    return handleError(res, error);
  }
};

const createProduct = async (req, res) => {
  const message = validateProduct(req.body);
  if (message) return res.status(400).json({ message });

  try {
    const { pname, price, quantity } = req.body;
    const product = await prisma.product.create({
      data: { pname: pname.trim(), price, quantity }
    });
    return res.status(201).json(product);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateProduct = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  const message = validateProduct(req.body);
  if (message) return res.status(400).json({ message });

  try {
    const { pname, price, quantity } = req.body;
    const product = await prisma.product.update({
      where: { pid: Number(req.params.id) },
      data: { pname: pname.trim(), price, quantity }
    });
    return res.status(200).json(product);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteProduct = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    await prisma.product.delete({
      where: { pid: Number(req.params.id) }
    });
    return res.status(200).json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
