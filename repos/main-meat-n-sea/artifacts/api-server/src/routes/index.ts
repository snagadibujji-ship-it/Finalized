import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import shopsRouter from "./shops";
import productsRouter from "./products";
import ordersRouter from "./orders";
import deliveryRouter from "./delivery";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/shops", shopsRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/delivery", deliveryRouter);
router.use("/admin", adminRouter);

export default router;
