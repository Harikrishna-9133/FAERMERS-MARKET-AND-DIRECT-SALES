const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createCategory,
  getCategories
} = require("../controllers/categoryController");

router.post("/", authMiddleware, createCategory);
router.get("/", getCategories);

module.exports = router;