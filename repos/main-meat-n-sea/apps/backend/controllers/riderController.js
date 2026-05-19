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

// Get Available Jobs (Stub)
const getAvailableJobs = async (req, res) => {
  // In a full implementation, this queries Orders with status="preparing" near rider's location
  res.json({ success: true, jobs: [] });
};

export { registerRider, getRiderProfile, toggleAvailability, updateLocation, getAvailableJobs };
