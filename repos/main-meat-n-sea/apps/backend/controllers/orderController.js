import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import couponModel from "../models/couponModel.js";
import redisClient from "../config/redis.js";
import { SURGE_REDIS_KEY } from "../workers/surgePricing.js";

// Get Surge Status (For Frontend)
const getSurgeStatus = async (req, res) => {
  try {
    const rawMultiplier = await redisClient.get(SURGE_REDIS_KEY);
    const multiplier = parseFloat(rawMultiplier) || 1.0;
    res.json({ success: true, surgeActive: multiplier > 1.0, multiplier });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Place Order
const placeOrder = async (req, res) => {
  try {
    const { vendorId, items, deliveryAddress, paymentMethod, couponCode } = req.body;

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

    // Phase 1.1: Fetch active Surge Multiplier from Redis
    const rawMultiplier = await redisClient.get(SURGE_REDIS_KEY);
    const surgeMultiplier = parseFloat(rawMultiplier) || 1.0;

    // Apply Surge Multiplier to Delivery Fee (Base 60 Rupees)
    const baseDeliveryFeePaise = 60 * 100;
    const deliveryFeePaise = Math.round(baseDeliveryFeePaise * surgeMultiplier);

    let platformFeePaise = Math.round(calculatedSubtotalPaise * 0.10); // 10% platform fee

    // Phase 1.1: Coupon Promotions Engine
    let discountAmountPaise = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await couponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() <= new Date(coupon.expiresAt) && coupon.usedCount < coupon.maxUses && calculatedSubtotalPaise >= coupon.minOrderValue) {

        // Recalculate discount natively
        if (coupon.discountType === 'flat') {
          discountAmountPaise = coupon.discountValue;
        } else if (coupon.discountType === 'percent') {
          const calcDisc = Math.round(calculatedSubtotalPaise * (coupon.discountValue / 100));
          discountAmountPaise = coupon.maxDiscount ? Math.min(calcDisc, coupon.maxDiscount) : calcDisc;
        }

        // Cap discount to prevent negative totals
        if (discountAmountPaise > calculatedSubtotalPaise) {
           discountAmountPaise = calculatedSubtotalPaise;
        }

        appliedCoupon = coupon.code;
      }
    }

    // CRITICAL FINANCIAL LOGIC: The platform absorbs the cost of the promotion.
    // We deduct the discount from the platformFee. We DO NOT touch the Subtotal,
    // ensuring the Vendor is paid their full amount in the ledger.
    platformFeePaise = platformFeePaise - discountAmountPaise;

    // We do not let platform fees go negative in the ledger (floor at 0).
    // If the discount is massive, the platform takes a 0 fee, and the remainder
    // of the discount effectively offsets the customer's total out of the platform's pocket.
    const effectivePlatformFeeForLedger = Math.max(0, platformFeePaise);

    // Calculate final safe total
    let finalTotalPaise = calculatedSubtotalPaise + deliveryFeePaise + platformFeePaise;
    if (finalTotalPaise < 0) finalTotalPaise = 0;

    const newOrder = new orderModel({
      customerId: req.user.userId,
      vendorId,
      items: finalItems,
      subtotal: calculatedSubtotalPaise,
      deliveryFee: deliveryFeePaise,
      platformFee: effectivePlatformFeeForLedger,
      total: finalTotalPaise,
      paymentMethod,
      deliveryAddress,
      couponCode: appliedCoupon,
      discountAmount: discountAmountPaise // Storing for record-keeping
    });

    await newOrder.save();

    // Increment coupon usage if one was applied
    if (appliedCoupon) {
       await couponModel.updateOne({ code: appliedCoupon }, { $inc: { usedCount: 1 } });
    }
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

    // Phase 8: Push Notification for Customer on Delivery Departure
    if (status === 'out_for_delivery') {
      const { default: userModel } = await import('../models/userModel.js');
      const customer = await userModel.findById(order.customerId);
      if (customer && customer.fcmToken) {
        const { sendPushNotification } = await import('../utils/notificationService.js');
        await sendPushNotification(
          customer.fcmToken,
          "Order Out For Delivery!",
          "Your rider has picked up the order and is on the way.",
          { orderId: order._id.toString() }
        );
      }
    }

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

export { placeOrder, getOrderDetails, cancelOrder, trackOrder, updateOrderStatus, getVendorOrders, getSurgeStatus };
