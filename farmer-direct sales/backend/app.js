const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);

// fallback to index.html for any other routes (SPA support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Health endpoint to report DB connection state
app.get('/api/health', (req, res) => {
  const state = mongoose.connection ? mongoose.connection.readyState : 0;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.json({ ok: true, dbState: state });
});

module.exports = app;