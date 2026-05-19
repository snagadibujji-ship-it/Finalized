import vendorModel from "../models/vendorModel.js";
import orderModel from "../models/orderModel.js";
import riderModel from "../models/riderModel.js";
import userModel from "../models/userModel.js";

const getDashboardStats = async (req, res) => {
  try {
    const ordersCount = await orderModel.countDocuments();
    const vendorsCount = await vendorModel.countDocuments();
    const usersCount = await userModel.countDocuments({ role: 'customer' });

    res.json({ success: true, stats: { ordersCount, vendorsCount, usersCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const listAllVendors = async (req, res) => {
  try {
    const vendors = await vendorModel.find().populate('userId', 'name email phone').lean();

    // Mask sensitive PII before sending to the frontend
    const maskedVendors = vendors.map(v => {
      if (v.aadhaar) v.aadhaar = '[Aadhaar Redacted]';
      if (v.pan) v.pan = '[PAN Redacted]';
      if (v.bankAccount) v.bankAccount = 'XXXX-XXXX-' + String(v.bankAccount).slice(-4);
      return v;
    });

    res.json({ success: true, vendors: maskedVendors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const approveVendor = async (req, res) => {
  try {
    const vendor = await vendorModel.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const rejectVendor = async (req, res) => {
  try {
    const vendor = await vendorModel.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const listAllRiders = async (req, res) => {
  try {
    const riders = await riderModel.find().populate('userId', 'name phone email');
    res.json({ success: true, riders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const listAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const listAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select('-passwordHash');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export {
  getDashboardStats, listAllVendors, approveVendor, rejectVendor,
  listAllRiders, listAllOrders, listAllUsers
};
