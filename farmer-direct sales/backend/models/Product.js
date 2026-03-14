const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: "kg" },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  farmerName: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);