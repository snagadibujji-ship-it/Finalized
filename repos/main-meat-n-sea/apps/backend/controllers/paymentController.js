import Razorpay from "razorpay";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import payoutModel from "../models/payoutModel.js";
import userModel from "../models/userModel.js";
import vendorModel from "../models/vendorModel.js";
import riderModel from "../models/riderModel.js";

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "mock_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_key_secret",
});

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { receipt } = req.body;

    // Securely fetch exact amount from the verified internal database order
    // Do NOT trust the client-provided amount
    const dbOrder = await orderModel.findById(receipt);
    if (!dbOrder) {
       return res.status(404).json({ success: false, message: "Order not found" });
    }

    const amount = dbOrder.total;

    if (process.env.MOCK_PAYMENTS === "true") {
      return res.json({
        success: true,
        order: { id: `mock_order_${Date.now()}`, amount, currency: "INR", receipt }
      });
    }

    const options = {
      amount, // Amount must be in the smallest currency unit (paise)
      currency: "INR",
      receipt
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Verify Payment and Distribute Payouts
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = req.body;

    const dbOrder = await orderModel.findById(internal_order_id);
    if (!dbOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // PREVENT REPLAY ATTACK / DOUBLE SPEND
    if (dbOrder.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: "Order is already paid" });
    }

    let isVerified = false;

    if (process.env.MOCK_PAYMENTS === "true") {
      isVerified = true;
    } else {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generatedSignature === razorpay_signature) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 1. Update Order Status
    dbOrder.paymentStatus = "paid";
    dbOrder.statusTimeline.push({ status: "paid", timestamp: new Date() });
    await dbOrder.save();

    // 2. Financial Ledger Distribution (Using Paise established in Phase 2)
    const { subtotal, deliveryFee, platformFee } = dbOrder;

    // A. Vendor Payout
    if (dbOrder.vendorId) {
      const vendorDoc = await vendorModel.findById(dbOrder.vendorId);

      if (vendorDoc) {
        await userModel.findByIdAndUpdate(vendorDoc.userId, {
          $inc: { walletBalance: subtotal } // Add Subtotal Paise to Vendor Wallet
        });

        await new payoutModel({
          recipientId: vendorDoc._id,
          recipientType: 'vendor',
          amount: subtotal,
          method: 'bank',
          status: 'pending'
        }).save();
      }
    }

    // B. Rider Payout (if assigned during checkout or later)
    if (dbOrder.riderId) {
       const riderDoc = await riderModel.findById(dbOrder.riderId);

       if (riderDoc) {
          await userModel.findByIdAndUpdate(riderDoc.userId, {
            $inc: { walletBalance: deliveryFee } // Add Delivery Fee Paise to Rider Wallet
          });

          await new payoutModel({
            recipientId: riderDoc._id,
            recipientType: 'rider',
            amount: deliveryFee,
            method: 'bank',
            status: 'pending'
          }).save();
       }
    }

    // C. Platform Fee stays with Admin implicitly (no direct wallet needed right now)

    // Phase 8: Trigger Push Notification to Vendor
    if (dbOrder.vendorId) {
      const vendorDoc = await vendorModel.findById(dbOrder.vendorId);
      if (vendorDoc) {
        const userDoc = await userModel.findById(vendorDoc.userId);
        if (userDoc && userDoc.fcmToken) {
          const { sendPushNotification } = await import('../utils/notificationService.js');
          await sendPushNotification(
            userDoc.fcmToken,
            "New Order Received!",
            `You have received a new order for ₹${(subtotal / 100).toFixed(2)}`,
            { orderId: dbOrder._id.toString() }
          );
        }
      }
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
