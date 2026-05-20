import { HydratedDocument, Schema, model, models } from 'mongoose';

interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IRider {
  userId: Schema.Types.ObjectId;
  isAvailable: boolean;
  status: 'pending' | 'approved' | 'suspended';
  currentLocationPoint: IGeoPoint;
}

export type RiderDocument = HydratedDocument<IRider>;

const riderSchema = new Schema<IRider>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAvailable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending'
    },
    currentLocationPoint: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: { type: [Number], required: true }
    }
  },
  { timestamps: true }
);

riderSchema.index({ currentLocationPoint: '2dsphere' });

const riderModel = models.Rider || model<IRider>('Rider', riderSchema);
export default riderModel;
