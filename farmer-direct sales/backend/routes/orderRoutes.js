const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createOrder,
  getOrders
} = require("../controllers/orderController");

router.post("/", authMiddleware, createOrder);
router.get("/", getOrders);

module.exports = router;