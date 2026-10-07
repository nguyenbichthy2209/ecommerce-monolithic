const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const register = async (req, res) => {
  try {
    const { username, fullname, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !fullname || !password) {
      return res.status(400).json({
        message: "Please provide username, fullname and password"
      });
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản
    const user = await prisma.user.create({
      data: {
        username,
        fullname,
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
    console.error(error);

    return res.status(500).json({
      message: "Cannot register user"
    });
  }
};
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Please provide username and password"
      });
    }

    const user = await prisma.user.findFirst({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        uid: user.uid,
        roleid: user.roleid
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successfully",
      token
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Cannot login"
    });
  }
};
module.exports = {
  register,
  login
};