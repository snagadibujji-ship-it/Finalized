import express from "express";

const productRouter = express.Router();

// Placeholder routes for Phase 1 Setup
productRouter.get("/", (req, res) => res.json({ success: true, message: "List Products" }));
productRouter.post("/", (req, res) => res.json({ success: true, message: "Create Product" }));
productRouter.put("/:id", (req, res) => res.json({ success: true, message: "Update Product" }));
productRouter.delete("/:id", (req, res) => res.json({ success: true, message: "Delete Product" }));

export default productRouter;
