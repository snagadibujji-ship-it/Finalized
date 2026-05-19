import orderModel from "../models/orderModel.js";

// Place Order
const placeOrder = async (req, res) => {
  try {
    const { vendorId, items, subtotal, deliveryFee, platformFee, paymentMethod, deliveryAddress } = req.body;

    const total = subtotal + deliveryFee + platformFee;

    const newOrder = new orderModel({
      customerId: req.user.userId,
      vendorId,
      items,
      subtotal,
      deliveryFee,
      platformFee,
      total,
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

export { placeOrder, getOrderDetails, cancelOrder, trackOrder };
