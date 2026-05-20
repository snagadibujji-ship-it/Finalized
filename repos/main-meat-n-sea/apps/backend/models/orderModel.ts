import { HydratedDocument, Model, Schema, model, models } from 'mongoose';

export type PaymentMethod = 'cod' | 'online';
export type PaymentStatus = 'pending_collection' | 'pending_online' | 'paid' | 'failed' | 'refunded';

interface IOrderItem {
  productId: Schema.Types.ObjectId;
  name: string;
  qty: number;
  pricePaise: number;
}

interface IAddress {
  address: string;
  lat: number;
  lng: number;
}

export interface IOrder {
  customerId: Schema.Types.ObjectId;
  vendorId: Schema.Types.ObjectId;
  riderId?: Schema.Types.ObjectId;
  offeredRiderId?: Schema.Types.ObjectId;
  items: IOrderItem[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  totalAmountPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: IAddress;
  status: 'placed' | 'accepted' | 'preparing' | 'pickup_assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
}

export type OrderDocument = HydratedDocument<IOrder>;
export type OrderModel = Model<IOrder>;

const orderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    offeredRiderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        pricePaise: { type: Number, required: true, min: 0 }
      }
    ],
    subtotalPaise: { type: Number, required: true, min: 0 },
    deliveryFeePaise: { type: Number, required: true, min: 0 },
    platformFeePaise: { type: Number, required: true, min: 0 },
    totalAmountPaise: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cod', 'online'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending_collection', 'pending_online', 'paid', 'failed', 'refunded'],
      required: true
    },
    deliveryAddress: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    status: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'pickup_assigned', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed'
    }
  },
  { timestamps: true }
);

orderSchema.pre('validate', function setPaymentStatusByMethod(next) {
  if (this.paymentMethod === 'cod') {
    this.paymentStatus = 'pending_collection';
  } else if (this.paymentMethod === 'online' && !this.paymentStatus) {
    this.paymentStatus = 'pending_online';
  }
  next();
});

const orderModel = (models.Order as OrderModel) || model<IOrder>('Order', orderSchema);
export default orderModel;
