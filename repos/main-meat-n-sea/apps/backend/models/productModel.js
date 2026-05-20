import mongoose from "mongoose";

const deriveStockFlags = (currentDoc, updatePayload = null) => {
  const stockFromUpdate = updatePayload?.$set?.stockQuantity ?? updatePayload?.stockQuantity;
  const nextStock = stockFromUpdate ?? currentDoc.stockQuantity ?? 0;
  const normalizedStock = Number.isFinite(Number(nextStock)) ? Number(nextStock) : 0;

  const isOutOfStock = normalizedStock <= 0;

  if (updatePayload) {
    updatePayload.$set = updatePayload.$set || {};
    updatePayload.$set.isOutOfStock = isOutOfStock;
    if (updatePayload.isOutOfStock !== undefined) {
      delete updatePayload.isOutOfStock;
    }
    return;
  }

  currentDoc.isOutOfStock = isOutOfStock;
};

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
  weight: { type: String },
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isOutOfStock: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.pre('save', function productPreSave(next) {
  if (this.isModified('stockQuantity') || this.isNew) {
    deriveStockFlags(this);
  }
  next();
});

productSchema.pre('findOneAndUpdate', function productPreFindOneAndUpdate(next) {
  const update = this.getUpdate() || {};
  const hasStockUpdate = update.stockQuantity !== undefined || update.$set?.stockQuantity !== undefined;

  if (hasStockUpdate) {
    deriveStockFlags(null, update);
    this.setUpdate(update);
  }

  next();
});

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;
