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
  serviceRadius: { type: Number, default: 5 }, // in km
  serviceAreaCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  bankAccount: { type: String },
  upiId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  commissionPercent: { type: Number, default: 10 },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, { timestamps: true });

const vendorModel = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default vendorModel;
