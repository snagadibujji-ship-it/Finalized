import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['fresh', 'dry', 'pickles', 'ready-to-cook', 'combos', 'others'],
    required: true
  },
  price: { type: Number, required: true },
  offerPrice: { type: Number },
  stockQuantity: { type: Number, required: true, default: 0 },
  weight: { type: String }, // e.g., '1kg', '500g'
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;
