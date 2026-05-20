import vendorModel from "../models/vendorModel.js";

const VENDOR_SAFE_FIELDS = '-aadhaar -pan -bankAccount';

const registerVendor = async (req, res) => {
  try {
    const {
      shopName, businessType, gst, aadhaar, pan, address,
      landmark, workingHours, serviceRadius, serviceAreaCoords,
      bankAccount, upiId
    } = req.body;

    const existingVendor = await vendorModel.findOne({ userId: req.user.userId });
    if (existingVendor) {
      return res.status(400).json({ success: false, message: "Vendor profile already exists for this user" });
    }

    const newVendor = new vendorModel({
      userId: req.user.userId,
      shopName, businessType, gst, aadhaar, pan, address,
      landmark, workingHours, serviceRadius, serviceAreaCoords,
      bankAccount, upiId
    });

    await newVendor.save();
    res.status(201).json({ success: true, vendor: newVendor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const getVendorProfile = async (req, res) => {
  try {
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateVendorProfile = async (req, res) => {
  try {
    const {
      shopName, businessType, gst, aadhaar, pan, address,
      landmark, workingHours, serviceRadius, serviceAreaCoords,
      bankAccount, upiId
    } = req.body;

    const updates = {};
    if (shopName) updates.shopName = shopName;
    if (businessType) updates.businessType = businessType;
    if (gst) updates.gst = gst;
    if (aadhaar) updates.aadhaar = aadhaar;
    if (pan) updates.pan = pan;
    if (address) updates.address = address;
    if (landmark) updates.landmark = landmark;
    if (workingHours) updates.workingHours = workingHours;
    if (serviceRadius) updates.serviceRadius = serviceRadius;
    if (serviceAreaCoords) updates.serviceAreaCoords = serviceAreaCoords;
    if (bankAccount) updates.bankAccount = bankAccount;
    if (upiId) updates.upiId = upiId;

    const vendor = await vendorModel.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updates },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const toggleVendorOpenStatus = async (req, res) => {
  try {
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    vendor.isOpen = !vendor.isOpen;
    await vendor.save();

    res.json({ success: true, isOpen: vendor.isOpen, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getNearbyVendors = async (req, res) => {
  try {
    const includeClosed = req.query.includeClosed === 'true';
    const filter = { status: 'approved' };

    if (!includeClosed) {
      filter.isOpen = true;
    }

    const vendors = await vendorModel.find(filter).select(VENDOR_SAFE_FIELDS);
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { registerVendor, getVendorProfile, updateVendorProfile, toggleVendorOpenStatus, getNearbyVendors };
