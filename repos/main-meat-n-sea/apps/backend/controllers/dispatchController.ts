import { Request, Response } from 'express';
import { Types } from 'mongoose';
import redisClient from '../config/redis.js';
import orderModel from '../models/orderModel';
import riderModel from '../models/riderModel';

const DISPATCH_TTL_SECONDS = 60;
const dispatchRedisKey = (orderId: string) => `dispatch:${orderId}`;

export const offerNearestRiderForAcceptedOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body as { orderId: string };

    const order = await orderModel.findById(orderId).select('_id deliveryAddress status offeredRiderId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted orders can be dispatched.' });
    }

    const nearestRider = await riderModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [order.deliveryAddress.lng, order.deliveryAddress.lat]
          },
          distanceField: 'distanceMeters',
          spherical: true,
          query: { isAvailable: true, status: 'approved' },
          key: 'currentLocationPoint'
        }
      },
      { $limit: 1 },
      { $project: { _id: 1, distanceMeters: 1 } }
    ]);

    if (!nearestRider.length) {
      return res.status(404).json({ success: false, message: 'No available rider found nearby.' });
    }

    const offeredRiderId = new Types.ObjectId(nearestRider[0]._id);

    const updatedOrder = await orderModel.findByIdAndUpdate(
      order._id,
      { $set: { offeredRiderId, status: 'pickup_assigned' } },
      { new: true }
    );

    await redisClient.set(
      dispatchRedisKey(order._id.toString()),
      JSON.stringify({ orderId: order._id.toString(), offeredRiderId: offeredRiderId.toString() }),
      { EX: DISPATCH_TTL_SECONDS }
    );

    return res.json({
      success: true,
      order: updatedOrder,
      offerExpiresInSeconds: DISPATCH_TTL_SECONDS,
      riderDistanceMeters: Math.round(nearestRider[0].distanceMeters)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// Cron-safe timeout worker: call every ~10-30 seconds.
export const processExpiredDispatchOffers = async (): Promise<void> => {
  const keys = await redisClient.keys('dispatch:*');

  for (const key of keys) {
    const ttlSeconds = await redisClient.ttl(key);
    if (ttlSeconds > 0) {
      continue;
    }

    const payloadRaw = await redisClient.get(key);
    if (!payloadRaw) {
      continue;
    }

    const payload = JSON.parse(payloadRaw) as { orderId: string; offeredRiderId: string };

    await orderModel.updateOne(
      {
        _id: payload.orderId,
        offeredRiderId: payload.offeredRiderId,
        status: 'pickup_assigned'
      },
      {
        $set: { offeredRiderId: null, status: 'accepted' }
      }
    );

    await redisClient.del(key);
  }
};

// Optional Redis keyspace event listener (requires Redis notify-keyspace-events Ex).
export const startDispatchExpiryListener = async (): Promise<void> => {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.pSubscribe('__keyevent@*__:expired', async (expiredKey) => {
    if (!expiredKey.startsWith('dispatch:')) return;

    const orderId = expiredKey.replace('dispatch:', '');
    await orderModel.updateOne(
      { _id: orderId, status: 'pickup_assigned' },
      { $set: { offeredRiderId: null, status: 'accepted' } }
    );
  });
};
