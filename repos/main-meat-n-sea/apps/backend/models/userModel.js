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
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    walletBalance: { type: Number, default: 0 },
    fcmToken: { type: String },
    isActive: { type: Boolean, default: true },
    maxActiveOrders: { type: Number, default: 3, min: 1 },
    cartData: { type: Object, default: {} },
  },
  { timestamps: true, minimize: false }
);

userSchema.index({ location: '2dsphere' });

userSchema.methods.canPlaceOrder = async function canPlaceOrder(orderModel) {
  const activeStatuses = ['placed', 'accepted', 'preparing', 'pickup_assigned', 'out_for_delivery'];
  const activeOrderCount = await orderModel.countDocuments({
    customerId: this._id,
    status: { $in: activeStatuses }
  });

  return activeOrderCount < this.maxActiveOrders;
};

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
