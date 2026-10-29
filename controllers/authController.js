const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

function validUsername(value) {
  return typeof value === "string" &&
    value.length >= 3 &&
    value.length <= 50 &&
    /^[a-zA-Z0-9_.-]+$/.test(value);
}

const register = async (req, res) => {
  const { username, fullname, password } = req.body || {};

  if (!validUsername(username)) {
    return res.status(400).json({
      message: "Username must contain 3-50 letters, digits, underscores, dots or hyphens"
    });
  }

  if (
    typeof fullname !== "string" ||
    !fullname.trim() ||
    fullname.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Fullname must contain 1-100 characters"
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Password must contain at least 8 characters and at most 72 UTF-8 bytes"
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        fullname: fullname.trim(),
        password: hashedPassword,
        roleid: 1,
        mid: 1
      },
      select: {
        uid: true,
        username: true,
        fullname: true,
        roleid: true,
        mid: true
      }
    });

    return res.status(201).json({
      message: "Register successfully",
      user
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Cannot register user"
    });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    !username ||
    username.length > 50 ||
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Please provide a valid username and password"
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      { uid: user.uid, roleid: user.roleid },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successfully",
      token
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Cannot login"
    });
  }
};

module.exports = { register, login };
