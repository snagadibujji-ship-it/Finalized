import orderModel from "../models/orderModel.js";
import riderModel from "../models/riderModel.js";
import redisClient from "../config/redis.js";

const CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
export const SURGE_REDIS_KEY = "system:surge_multiplier";

export const startSurgeWorker = () => {
  console.log("Starting Surge Pricing Worker...");

  // Set default state initially
  redisClient.set(SURGE_REDIS_KEY, "1.0");

  setInterval(async () => {
    try {
      // 1. Query unassigned orders (pending pickup)
      const unassignedOrdersCount = await orderModel.countDocuments({
        status: { $in: ['placed', 'preparing'] },
        riderId: null
      });

      // 2. Query available riders
      const availableRidersCount = await riderModel.countDocuments({
        isAvailable: true
      });

      // 3. Calculate Ratio and determine Multiplier
      let newMultiplier = 1.0;

      // Avoid division by zero
      if (availableRidersCount === 0) {
        if (unassignedOrdersCount > 5) { // Arbitrary buffer: if no riders and 5+ orders, surge.
          newMultiplier = 1.5;
        }
      } else {
        const ratio = unassignedOrdersCount / availableRidersCount;

        if (ratio > 2.0) {
          newMultiplier = 1.5;
          console.log(`[SURGE WORKER] High Demand! Ratio: ${ratio.toFixed(2)}. Activating Surge (1.5x)`);
        } else if (ratio < 1.0) {
          newMultiplier = 1.0;
          console.log(`[SURGE WORKER] Normal Demand. Ratio: ${ratio.toFixed(2)}. Deactivating Surge (1.0x)`);
        } else {
          // Between 1.0 and 2.0, maintain previous state (hysteresis to prevent rapid flapping)
          const currentMultiplier = await redisClient.get(SURGE_REDIS_KEY);
          newMultiplier = parseFloat(currentMultiplier) || 1.0;
        }
      }

      // 4. Update Redis State
      await redisClient.set(SURGE_REDIS_KEY, newMultiplier.toString());

    } catch (error) {
      console.error("[SURGE WORKER] Error evaluating surge conditions:", error.message);
    }
  }, CHECK_INTERVAL_MS);
};
