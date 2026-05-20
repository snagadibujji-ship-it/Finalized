import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, fcmToken } = req.body;

    const user = await userModel.findByIdAndUpdate(
      req.user.userId,
      { $set: { name, phone, location, fcmToken } },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Wallet Balance
const getWallet = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("walletBalance");
    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get User Orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { getProfile, updateProfile, getWallet, getMyOrders };
