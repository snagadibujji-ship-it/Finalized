import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'rider', 'worker', 'admin'],
      default: "customer"
    },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    walletBalance: { type: Number, default: 0 },
    fcmToken: { type: String },
    isActive: { type: Boolean, default: true },
    cartData: { type: Object, default: {} },
  },
  { timestamps: true, minimize: false }
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
