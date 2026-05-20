import { Request, Response } from 'express';
import orderModel, { PaymentMethod } from '../models/orderModel';
import vendorModel from '../models/vendorModel';

const ONLINE_GATEWAY = {
  createPaymentIntent: async (_orderId: string, _amountPaise: number) => ({ status: 'created' as const })
};

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const { vendorId, items, deliveryAddress, paymentMethod, subtotalPaise, deliveryFeePaise, platformFeePaise } = req.body as {
      vendorId: string;
      items: Array<{ productId: string; name: string; qty: number; pricePaise: number }>;
      deliveryAddress: { address: string; lat: number; lng: number };
      paymentMethod: PaymentMethod;
      subtotalPaise: number;
      deliveryFeePaise: number;
      platformFeePaise: number;
    };

    const vendorWithinRadius = await vendorModel.findOne({
      _id: vendorId,
      status: 'approved',
      isOpen: true,
      serviceAreaCoords: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [deliveryAddress.lng, deliveryAddress.lat] },
          $maxDistance: 1000 // placeholder; overridden below
        }
      }
    }).select('_id serviceRadiusKm');

    if (!vendorWithinRadius) {
      return res.status(400).json({ success: false, message: 'Vendor not available or out of service area.' });
    }

    const vendorDistanceCheck = await vendorModel.findOne({
      _id: vendorId,
      serviceAreaCoords: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [deliveryAddress.lng, deliveryAddress.lat] },
          $maxDistance: Math.round(vendorWithinRadius.serviceRadiusKm * 1000)
        }
      }
    }).select('_id');

    if (!vendorDistanceCheck) {
      return res.status(422).json({ success: false, message: 'Delivery address is outside vendor delivery radius.' });
    }

    const totalAmountPaise = subtotalPaise + deliveryFeePaise + platformFeePaise;

    const order = await orderModel.create({
      customerId: req.user?.userId,
      vendorId,
      items,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending_collection' : 'pending_online',
      subtotalPaise,
      deliveryFeePaise,
      platformFeePaise,
      totalAmountPaise
    });

    if (paymentMethod === 'online') {
      await ONLINE_GATEWAY.createPaymentIntent(order.id, order.totalAmountPaise);
    }

    return res.status(201).json({ success: true, order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
