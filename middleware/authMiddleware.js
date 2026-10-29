const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied. No token provided"
    });
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authHeader);
  if (!match) {
    return res.status(401).json({
      message: "Invalid Authorization header"
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    if (
      typeof decoded !== "object" ||
      !Number.isInteger(decoded.uid) ||
      decoded.uid <= 0 ||
      decoded.uid > 2147483647
    ) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { uid: decoded.uid },
      select: { uid: true, roleid: true }
    });

    if (!user) {
      return res.status(401).json({
        message: "Account no longer exists"
      });
    }

    req.user = {
      uid: user.uid,
      roleid: user.roleid
    };

    return next();
  } catch (error) {
    console.error("AUTH DATABASE ERROR:", error);
    return res.status(503).json({
      message: "Authentication service temporarily unavailable"
    });
  }
};

module.exports = verifyToken;
