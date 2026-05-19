import orderModel from "../models/orderModel.js";

import productModel from "../models/productModel.js";

// Place Order
const placeOrder = async (req, res) => {
  try {
    const { vendorId, items, deliveryAddress, paymentMethod } = req.body;

    // Server-side calculation to prevent price manipulation using Paise/Cents (integer math)
    let calculatedSubtotalPaise = 0;
    const finalItems = [];

    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product || product.vendorId.toString() !== vendorId) {
        return res.status(400).json({ success: false, message: `Invalid product: ${item.productId}` });
      }

      const priceToUse = product.offerPrice ? product.offerPrice : product.price;
      // Convert to integer paise/cents before multiplying
      calculatedSubtotalPaise += Math.round(priceToUse * 100) * item.qty;

      finalItems.push({
        productId: product._id,
        name: product.name,
        qty: item.qty,
        price: priceToUse
      });
    }

    const deliveryFeePaise = 60 * 100; // Fixed 60 rupees converted to paise
    const platformFeePaise = Math.round(calculatedSubtotalPaise * 0.10); // 10% platform fee
    const totalPaise = calculatedSubtotalPaise + deliveryFeePaise + platformFeePaise;

    const newOrder = new orderModel({
      customerId: req.user.userId,
      vendorId,
      items: finalItems,
      subtotal: calculatedSubtotalPaise,
      deliveryFee: deliveryFeePaise,
      platformFee: platformFeePaise,
      total: totalPaise,
      paymentMethod,
      deliveryAddress
    });

    await newOrder.save();
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id)
      .populate('vendorId', 'shopName address')
      .populate('riderId', 'vehicleNumber rating');

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Authorization check
    if (order.customerId.toString() !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({ success: false, message: "Cannot cancel order at this stage" });
    }

    order.status = 'cancelled';
    order.statusTimeline.push({ status: 'cancelled' });
    await order.save();

    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Track Live Order
const trackOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id).populate('riderId', 'currentLocation name phone');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, status: order.status, rider: order.riderId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Vendor Order Management - Update Status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Must verify this order belongs to the requesting vendor
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    if (!vendor || order.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    order.status = status;
    order.statusTimeline.push({ status, timestamp: new Date() });
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Vendor Order Management - Get Incoming Orders
const getVendorOrders = async (req, res) => {
  try {
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    if (!vendor) {
       return res.status(403).json({ success: false, message: "Vendor profile not found" });
    }

    const orders = await orderModel.find({ vendorId: vendor._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { placeOrder, getOrderDetails, cancelOrder, trackOrder, updateOrderStatus, getVendorOrders };
