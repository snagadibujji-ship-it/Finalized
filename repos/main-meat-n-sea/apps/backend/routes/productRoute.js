import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get("/", listProducts);
productRouter.post("/", authMiddleware, roleMiddleware(['vendor']), createProduct);
productRouter.put("/:id", authMiddleware, roleMiddleware(['vendor']), updateProduct);
productRouter.delete("/:id", authMiddleware, roleMiddleware(['vendor']), deleteProduct);

export default productRouter;
