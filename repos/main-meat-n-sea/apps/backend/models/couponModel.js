import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['flat', 'percent'], required: true },
  discountValue: { type: Number, required: true }, // Value in Paise for 'flat', or percentage (e.g. 10 for 10%) for 'percent'
  minOrderValue: { type: Number, default: 0 }, // Stored in Paise
  maxDiscount: { type: Number }, // Stored in Paise (only applicable if discountType is 'percent')
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const couponModel = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default couponModel;
