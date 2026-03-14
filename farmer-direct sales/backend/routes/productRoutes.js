const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const controller = require("../controllers/productController");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = controller;

router.post("/", authMiddleware, addProduct);
router.get("/", getProducts);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;