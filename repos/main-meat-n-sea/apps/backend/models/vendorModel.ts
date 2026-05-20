import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface IVendor {
  userId: Schema.Types.ObjectId;
  shopName: string;
  serviceAreaCoords: IGeoPoint;
  serviceRadiusKm: number;
  isOpen: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  commissionPercent: number;
}

export type VendorDocument = HydratedDocument<IVendor>;
export type VendorModel = Model<IVendor>;

const vendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String, required: true },
    serviceAreaCoords: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: { type: [Number], required: true }
    },
    serviceRadiusKm: { type: Number, default: 5, min: 0.5 },
    isOpen: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 }
  },
  { timestamps: true }
);

vendorSchema.index({ serviceAreaCoords: '2dsphere' });

const vendorModel = (models.Vendor as VendorModel) || model<IVendor>('Vendor', vendorSchema);
export default vendorModel;
