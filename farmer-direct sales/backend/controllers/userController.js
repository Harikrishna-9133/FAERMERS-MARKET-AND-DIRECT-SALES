const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// register new user (farmer or customer)
exports.registerUser = async (req, res) => {
  try {
    const { password, email, mobile, name, role, ...rest } = req.body;
    if(!email || !password || !name){
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: role || 'customer', mobile, ...rest });
    await user.save();
    res.json({ id: user._id, name: user.name, role: user.role, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// login existing user and return JWT
exports.loginUser = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    console.log('[LOGIN] Attempting login with', email ? `email: ${email}` : `mobile: ${mobile}`);
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (mobile) {
      user = await User.findOne({ mobile });
    }
    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(400).json({ message: "User not found. Please register first." });
    }
    console.log('[LOGIN] User found, comparing password');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('[LOGIN] Password mismatch');
      return res.status(400).json({ message: "Invalid password" });
    }
    console.log('[LOGIN] Password match, generating token');
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, mobile: user.mobile, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log('[LOGIN] Token generated successfully');
    res.json({ token });
  } catch (error) {
    console.error('[LOGIN] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};