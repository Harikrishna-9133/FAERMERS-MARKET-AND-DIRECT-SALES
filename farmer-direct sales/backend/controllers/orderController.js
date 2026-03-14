const Order = require("../models/order");

exports.createOrder = async (req, res) => {
  try {
    const { items, totalPrice } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }
    const body = { items, totalPrice, userId: req.user.id };
    const order = new Order(body);
    await order.save();
    // deduct stock for each item
    const Product = require("../models/Product");
    await Promise.all(items.map(i =>
      Product.findByIdAndUpdate(i.productId, { $inc: { quantity: -i.quantity } })
    ));
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};