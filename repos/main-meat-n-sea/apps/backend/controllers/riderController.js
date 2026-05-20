import riderModel from "../models/riderModel.js";

// Register Rider Profile
const registerRider = async (req, res) => {
  try {
    const { vehicleType, vehicleNumber, licenseNumber, aadhaarNumber, bankAccount, upiId } = req.body;

    const existingRider = await riderModel.findOne({ userId: req.user.userId });
    if (existingRider) {
      return res.status(400).json({ success: false, message: "Rider profile already exists" });
    }

    const newRider = new riderModel({
      userId: req.user.userId,
      vehicleType, vehicleNumber, licenseNumber, aadhaarNumber, bankAccount, upiId
    });

    await newRider.save();
    res.status(201).json({ success: true, rider: newRider });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get Rider Profile
const getRiderProfile = async (req, res) => {
  try {
    const rider = await riderModel.findOne({ userId: req.user.userId });
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
    res.json({ success: true, rider });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Toggle Availability
const toggleAvailability = async (req, res) => {
  try {
    const rider = await riderModel.findOne({ userId: req.user.userId });
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    rider.isAvailable = !rider.isAvailable;
    await rider.save();

    res.json({ success: true, isAvailable: rider.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Location
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const rider = await riderModel.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { currentLocation: { lat, lng } } },
      { new: true }
    );
    res.json({ success: true, location: rider.currentLocation });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

import orderModel from "../models/orderModel.js";
import mongoose from "mongoose";

// Get Available Jobs (Batched by Vendor)
const getAvailableJobs = async (req, res) => {
  try {
    const batchedJobs = await orderModel.aggregate([
      // 1. Only find orders that are preparing and unassigned
      { $match: { status: 'preparing', riderId: null } },

      // 2. Group by Vendor
      {
        $group: {
          _id: '$vendorId',
          orders: {
            $push: {
              orderId: '$_id',
              deliveryAddress: '$deliveryAddress',
              subtotalPaise: '$subtotal',
              deliveryFeePaise: '$deliveryFee'
            }
          },
          totalBatchEarningsPaise: { $sum: '$deliveryFee' }
        }
      },

      // 3. Lookup Vendor info (Location & Name)
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendorDetails' } },
      { $unwind: '$vendorDetails' },

      // 4. Format output
      {
        $project: {
          _id: 0,
          vendorId: '$_id',
          vendorName: '$vendorDetails.shopName',
          vendorLocation: '$vendorDetails.serviceAreaCoords',
          totalBatchEarningsPaise: 1,
          totalDropoffs: { $size: '$orders' },
          orders: 1
        }
      }
    ]);

    res.json({ success: true, jobs: batchedJobs });
  } catch (error) {
    console.error("Fetch Jobs Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Accept Batch of Orders (Atomic)
const acceptBatchJob = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const rider = await riderModel.findOne({ userId: req.user.userId });
    if (!rider || !rider.isAvailable) {
      return res.status(403).json({ success: false, message: "Rider not found or offline" });
    }

    // ATOMIC UPDATE: Only update if ALL requested orders currently have riderId: null
    // Use MongoDB's $in operator with the riderId condition
    const updateResult = await orderModel.updateMany(
      {
        _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) },
        riderId: null,
        status: 'preparing'
      },
      {
        $set: { riderId: rider._id, status: 'pickup_assigned' },
        $push: { statusTimeline: { status: 'pickup_assigned', timestamp: new Date() } }
      }
    );

    // Race condition check: Verify we actually captured the exact number of orders we requested
    if (updateResult.modifiedCount !== orderIds.length) {
      // Rollback: Another rider grabbed part or all of the batch.
      // We must reset the ones we *did* grab back to null to maintain batch integrity.
      if (updateResult.modifiedCount > 0) {
        await orderModel.updateMany(
          { _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) }, riderId: rider._id },
          {
            $set: { riderId: null, status: 'preparing' }
          }
        );
      }
      return res.status(409).json({ success: false, message: "Batch no longer available. Another rider accepted it." });
    }

    res.json({ success: true, message: "Batch successfully assigned", assignedOrdersCount: updateResult.modifiedCount });
  } catch (error) {
    console.error("Accept Batch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { registerRider, getRiderProfile, toggleAvailability, updateLocation, getAvailableJobs, acceptBatchJob };
