require("dotenv").config();

for (const key of ["DATABASE_URL", "JWT_SECRET"]) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const portText = process.env.PORT || "3001";
const PORT = Number(portText);

if (!/^\d+$/.test(portText) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const express = require("express");
const prisma = require("./config/prisma");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/memberships", require("./routes/membershipRoutes"));

app.get("/", (req, res) => {
  res.json({ message: "E-commerce Monolithic API is running" });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: "OK",
      database: "connected"
    });
  } catch (error) {
    return res.status(503).json({
      status: "ERROR",
      database: "disconnected"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }

  console.error("REQUEST ERROR:", error);
  return res.status(500).json({ message: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  const timer = setTimeout(() => process.exit(1), 8000);
  timer.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
      clearTimeout(timer);
      process.exit(0);
    } catch (error) {
      console.error("SHUTDOWN ERROR:", error);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
