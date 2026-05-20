import couponModel from "../models/couponModel.js";

// Validate Coupon
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotalPaise } = req.body;

    if (!code || subtotalPaise === undefined) {
      return res.status(400).json({ success: false, message: "Code and subtotalPaise required" });
    }

    const coupon = await couponModel.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon" });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: "Coupon limit reached" });
    }

    if (subtotalPaise < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${(coupon.minOrderValue / 100).toFixed(2)} required`
      });
    }

    let discountAmountPaise = 0;

    if (coupon.discountType === 'flat') {
      discountAmountPaise = coupon.discountValue; // discountValue is in Paise for flat
    } else if (coupon.discountType === 'percent') {
      const calculatedDiscount = Math.round(subtotalPaise * (coupon.discountValue / 100));
      // Cap the discount if maxDiscount is defined
      if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
        discountAmountPaise = coupon.maxDiscount;
      } else {
        discountAmountPaise = calculatedDiscount;
      }
    }

    // Ensure discount isn't larger than the subtotal
    if (discountAmountPaise > subtotalPaise) {
      discountAmountPaise = subtotalPaise;
    }

    res.json({ success: true, discountAmountPaise, code: coupon.code });
  } catch (error) {
    console.error("Validate Coupon Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
