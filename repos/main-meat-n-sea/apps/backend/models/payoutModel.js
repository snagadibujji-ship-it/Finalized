import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientType: { type: String, enum: ['vendor', 'rider'], required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bank', 'upi'], required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  settledAt: { type: Date }
}, { timestamps: true });

const payoutModel = mongoose.models.Payout || mongoose.model("Payout", payoutSchema);

export default payoutModel;
