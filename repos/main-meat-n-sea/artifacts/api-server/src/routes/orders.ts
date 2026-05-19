import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  orderItemsTable,
  productsTable,
  deliveryJobsTable,
  shopsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import { getIO } from "../lib/socket";

const router = Router();

const placeOrderSchema = z.object({
  shopId: z.number().int().positive(),
  deliveryAddress: z.string().min(1),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { shopId, deliveryAddress, notes, items } = parsed.data;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.shopId, shopId));

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    if (!productMap.has(item.productId)) {
      res.status(400).json({ error: `Product ${item.productId} not in this shop` });
      return;
    }
  }

  const deliveryFee = 30;
  let subtotal = 0;
  const itemRows = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.price);
    subtotal += unitPrice * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  const total = (subtotal + deliveryFee).toFixed(2);

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerId: userId,
      shopId,
      deliveryAddress,
      notes,
      total,
      deliveryFee: String(deliveryFee),
    })
    .returning();

  if (!order) {
    res.status(500).json({ error: "Failed to create order" });
    return;
  }

  await db.insert(orderItemsTable).values(
    itemRows.map((r) => ({ ...r, orderId: order.id }))
  );

  try {
    const io = getIO();
    io.to(`shop:${shopId}`).emit("order:new", { orderId: order.id, shopId });
  } catch {
    // socket not ready yet, non-fatal
  }

  res.status(201).json({ ...order, items: itemRows });
});

router.get("/", requireAuth, requireRole("customer"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerId, userId))
    .orderBy(ordersTable.createdAt);
  res.json(orders);
});

router.get("/:id", requireAuth, async (req, res) => {
  const orderId = Number(req.params["id"]);
  const { userId, role } = (req as typeof req & { user: JwtPayload }).user;

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (role === "customer" && order.customerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));

  res.json({ ...order, items });
});

router.patch("/:id/status", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const orderId = Number(req.params["id"]);

  const statusSchema = z.object({
    status: z.enum(["confirmed", "preparing", "ready", "cancelled"]),
  });

  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.id, order.shopId), eq(shopsTable.ownerId, userId)))
    .limit(1);

  if (!shop) {
    res.status(403).json({ error: "Not your shop's order" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (parsed.data.status === "ready") {
    await db.insert(deliveryJobsTable).values({ orderId });
    try {
      const io = getIO();
      io.to("riders").emit("job:available", { orderId });
    } catch {
      // non-fatal
    }
  }

  try {
    const io = getIO();
    io.to(`user:${order.customerId}`).emit("order:status", {
      orderId,
      status: parsed.data.status,
    });
  } catch {
    // non-fatal
  }

  res.json(updated);
});

router.get("/vendor/all", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.ownerId, userId))
    .limit(1);

  if (!shop) {
    res.status(404).json({ error: "No shop found" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.shopId, shop.id))
    .orderBy(ordersTable.createdAt);

  res.json(orders);
});

export default router;
