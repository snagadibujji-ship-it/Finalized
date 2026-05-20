import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import couponModel from "../models/couponModel.js";
import vendorModel from "../models/vendorModel.js";
import userModel from "../models/userModel.js";
import redisClient from "../config/redis.js";
import { SURGE_REDIS_KEY } from "../workers/surgePricing.js";

const getSurgeStatus = async (req, res) => {
  try {
    const rawMultiplier = await redisClient.get(SURGE_REDIS_KEY);
    const multiplier = parseFloat(rawMultiplier) || 1.0;
    res.json({ success: true, surgeActive: multiplier > 1.0, multiplier });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { vendorId, items, deliveryAddress, paymentMethod, couponCode } = req.body;

    const customer = await userModel.findById(req.user.userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const canPlaceOrder = await customer.canPlaceOrder(orderModel);
    if (!canPlaceOrder) {
      return res.status(429).json({ success: false, message: `Active order limit reached (${customer.maxActiveOrders})` });
    }

    let calculatedSubtotalPaise = 0;
    const finalItems = [];

    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product || product.vendorId.toString() !== vendorId) {
        return res.status(400).json({ success: false, message: `Invalid product: ${item.productId}` });
      }

      const priceToUse = product.offerPrice ? product.offerPrice : product.price;
      calculatedSubtotalPaise += Math.round(priceToUse * 100) * item.qty;

      finalItems.push({ productId: product._id, name: product.name, qty: item.qty, price: priceToUse });
    }

    const rawMultiplier = await redisClient.get(SURGE_REDIS_KEY);
    const surgeMultiplier = parseFloat(rawMultiplier) || 1.0;
    const baseDeliveryFeePaise = 60 * 100;
    const deliveryFeePaise = Math.round(baseDeliveryFeePaise * surgeMultiplier);
    let platformFeePaise = Math.round(calculatedSubtotalPaise * 0.10);

    let discountAmountPaise = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await couponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() <= new Date(coupon.expiresAt) && coupon.usedCount < coupon.maxUses && calculatedSubtotalPaise >= coupon.minOrderValue) {
        if (coupon.discountType === 'flat') {
          discountAmountPaise = coupon.discountValue;
        } else if (coupon.discountType === 'percent') {
          const calcDisc = Math.round(calculatedSubtotalPaise * (coupon.discountValue / 100));
          discountAmountPaise = coupon.maxDiscount ? Math.min(calcDisc, coupon.maxDiscount) : calcDisc;
        }
        if (discountAmountPaise > calculatedSubtotalPaise) discountAmountPaise = calculatedSubtotalPaise;
        appliedCoupon = coupon.code;
      }
    }

    platformFeePaise -= discountAmountPaise;
    const effectivePlatformFeeForLedger = Math.max(0, platformFeePaise);
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
      discountAmount: discountAmountPaise
    });

    await newOrder.save();
    if (appliedCoupon) await couponModel.updateOne({ code: appliedCoupon }, { $inc: { usedCount: 1 } });

    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const getOrderDetails = async (req, res) => { /* unchanged */
  try {
    const order = await orderModel.findById(req.params.id).populate('vendorId', 'shopName address').populate('riderId', 'vehicleNumber rating');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.customerId.toString() !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'vendor') return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    res.json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: "Server Error" }); }
};

const cancelOrder = async (req, res) => { try { const order = await orderModel.findById(req.params.id); if (!order) return res.status(404).json({ success: false, message: "Order not found" }); if (order.customerId.toString() !== req.user.userId) return res.status(403).json({ success: false, message: "Not authorized" }); if (order.status !== 'placed') return res.status(400).json({ success: false, message: "Cannot cancel order at this stage" }); order.status = 'cancelled'; order.statusTimeline.push({ status: 'cancelled' }); await order.save(); res.json({ success: true, message: "Order cancelled" }); } catch (error) { res.status(500).json({ success: false, message: "Server Error" }); } };
const trackOrder = async (req, res) => { try { const order = await orderModel.findById(req.params.id).populate('riderId', 'currentLocation name phone'); if (!order) return res.status(404).json({ success: false, message: "Order not found" }); res.json({ success: true, status: order.status, rider: order.riderId }); } catch (error) { res.status(500).json({ success: false, message: "Server Error" }); } };
const updateOrderStatus = async (req, res) => { try { const { status } = req.body; const order = await orderModel.findById(req.params.id); if (!order) return res.status(404).json({ success: false, message: "Order not found" }); const vendor = await vendorModel.findOne({ userId: req.user.userId }); if (!vendor || order.vendorId.toString() !== vendor._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" }); order.status = status; order.statusTimeline.push({ status, timestamp: new Date() }); await order.save(); if (status === 'out_for_delivery') { const customer = await userModel.findById(order.customerId); if (customer && customer.fcmToken) { const { sendPushNotification } = await import('../utils/notificationService.js'); await sendPushNotification(customer.fcmToken, "Order Out For Delivery!", "Your rider has picked up the order and is on the way.", { orderId: order._id.toString() }); } } res.json({ success: true, order }); } catch (error) { res.status(500).json({ success: false, message: "Server Error" }); } };
const getVendorOrders = async (req, res) => { try { const vendor = await vendorModel.findOne({ userId: req.user.userId }); if (!vendor) return res.status(403).json({ success: false, message: "Vendor profile not found" }); const orders = await orderModel.find({ vendorId: vendor._id }).sort({ createdAt: -1 }); res.json({ success: true, orders }); } catch (error) { res.status(500).json({ success: false, message: "Server Error" }); } };

export { placeOrder, getOrderDetails, cancelOrder, trackOrder, updateOrderStatus, getVendorOrders, getSurgeStatus };
