import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get("/", listProducts);

// Use multer for product image uploads
productRouter.post("/", authMiddleware, roleMiddleware(['vendor']), upload.array('images', 5), createProduct);
productRouter.put("/:id", authMiddleware, roleMiddleware(['vendor']), upload.array('images', 5), updateProduct);

productRouter.delete("/:id", authMiddleware, roleMiddleware(['vendor']), deleteProduct);

export default productRouter;
