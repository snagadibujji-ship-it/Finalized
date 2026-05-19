import productModel from "../models/productModel.js";
import vendorModel from "../models/vendorModel.js";

// List Products
const listProducts = async (req, res) => {
  try {
    const { vendorId, category } = req.query;
    const filter = { isAvailable: true };
    if (vendorId) filter.vendorId = vendorId;
    if (category) filter.category = category;

    const products = await productModel.find(filter);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create Product (Vendor Only)
const createProduct = async (req, res) => {
  try {
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    if (!vendor) return res.status(403).json({ success: false, message: "Vendor profile not found" });

    const newProduct = new productModel({
      ...req.body,
      vendorId: vendor._id
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    const product = await productModel.findOneAndUpdate(
      { _id: req.params.id, vendorId: vendor._id },
      { $set: req.body },
      { new: true }
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found or not owned by you" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const vendor = await vendorModel.findOne({ userId: req.user.userId });
    const product = await productModel.findOneAndDelete({ _id: req.params.id, vendorId: vendor._id });

    if (!product) return res.status(404).json({ success: false, message: "Product not found or not owned by you" });
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { listProducts, createProduct, updateProduct, deleteProduct };
