import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      qty: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }
    }
  ],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'upi', 'card', 'wallet'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  orderType: { type: String, enum: ['delivery', 'dining', 'takeaway'], default: 'delivery' },
  deliveryAddress: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  status: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'pickup_assigned', 'out_for_delivery', 'delivered', 'cancelled'],
    default: "placed"
  },
  statusTimeline: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  couponCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  scheduledAt: { type: Date }
}, { timestamps: true });

const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default orderModel;
