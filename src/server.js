
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const errorHandler = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

app.use(express.json());


app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);

app.use(errorHandler);
console.log("errorHandler:", errorHandler);
console.log("errorHandler Type:", typeof errorHandler);

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
