import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  bankAccount: { type: String },
  upiId: { type: String },
  isAvailable: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  totalEarnings: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending'
  }
}, { timestamps: true });

const riderModel = mongoose.models.Rider || mongoose.model("Rider", riderSchema);

export default riderModel;
