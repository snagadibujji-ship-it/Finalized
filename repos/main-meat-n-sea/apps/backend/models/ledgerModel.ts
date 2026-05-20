import { HydratedDocument, Schema, model, models } from 'mongoose';

export type CashCollectedBy = 'platform' | 'rider';

export interface ILedgerEntry {
  vendorId: Schema.Types.ObjectId;
  orderId: Schema.Types.ObjectId;
  paymentMethod: 'cod' | 'online';
  totalAmountPaise: number;
  platformFeePaise: number;
  netVendorEarningsPaise: number;
  cashCollectedBy: CashCollectedBy;
}

export type LedgerEntryDocument = HydratedDocument<ILedgerEntry>;

const ledgerSchema = new Schema<ILedgerEntry>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    paymentMethod: { type: String, enum: ['cod', 'online'], required: true },
    totalAmountPaise: { type: Number, required: true, min: 0 },
    platformFeePaise: { type: Number, required: true, min: 0 },
    netVendorEarningsPaise: { type: Number, required: true, min: 0 },
    cashCollectedBy: { type: String, enum: ['platform', 'rider'], required: true }
  },
  { timestamps: true }
);

ledgerSchema.pre('validate', function setCashCollector(next) {
  if (this.paymentMethod === 'cod') {
    this.cashCollectedBy = 'rider';
  } else if (!this.cashCollectedBy) {
    this.cashCollectedBy = 'platform';
  }
  next();
});

const ledgerModel = models.Ledger || model<ILedgerEntry>('Ledger', ledgerSchema);
export default ledgerModel;
