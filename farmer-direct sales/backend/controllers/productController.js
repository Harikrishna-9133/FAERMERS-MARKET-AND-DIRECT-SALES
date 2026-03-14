const Product = require("../models/Product");

exports.addProduct = async (req, res) => {
  try {
    // attach farmer info from token
    const body = { 
      ...req.body, 
      farmer: req.user.id, 
      farmerName: req.user.name 
    };
    const product = new Product(body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("farmer", "name farmName");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ message: "Product not found" });
    if (prod.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    Object.assign(prod, req.body);
    await prod.save();
    res.json(prod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ message: "Product not found" });
    if (prod.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await prod.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};