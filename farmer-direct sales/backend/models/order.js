const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [
    {
      productId: String,
      name: String,
      quantity: Number,
      price: Number,
      farmerId: String
    }
  ],
  totalPrice: Number,
  status: {
    type: String,
    default: "ordered"
  }
});

module.exports = mongoose.model("Order", orderSchema);