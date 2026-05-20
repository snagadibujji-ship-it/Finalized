import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopName: { type: String, required: true },
  shopPhoto: { type: String },
  businessType: { type: String },
  gst: { type: String },
  aadhaar: { type: String },
  pan: { type: String },
  address: { type: String },
  landmark: { type: String },
  workingHours: { type: String },
  serviceRadius: { type: Number, default: 5 },
  serviceAreaCoords: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  bankAccount: { type: String },
  upiId: { type: String },
  isOpen: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  commissionPercent: { type: Number, default: 10 },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, { timestamps: true });

vendorSchema.index({ serviceAreaCoords: '2dsphere' });

const vendorModel = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default vendorModel;
