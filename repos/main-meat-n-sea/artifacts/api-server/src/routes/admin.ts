import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, usersTable, ordersTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/shops", requireAuth, requireRole("admin"), async (_req, res) => {
  const shops = await db.select().from(shopsTable).orderBy(shopsTable.createdAt);
  res.json(shops);
});

router.patch("/shops/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params["id"]);
  const schema = z.object({
    status: z.enum(["active", "pending", "suspended"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [updated] = await db
    .update(shopsTable)
    .set({ status: parsed.data.status })
    .where(eq(shopsTable.id, id))
    .returning();

  res.json(updated);
});

router.get("/users", requireAuth, requireRole("admin"), async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

router.get("/orders", requireAuth, requireRole("admin"), async (_req, res) => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(ordersTable.createdAt);
  res.json(orders);
});

router.get("/categories", async (_req, res) => {
  const cats = await db.select().from(categoriesTable);
  res.json(cats);
});

router.post("/categories", requireAuth, requireRole("admin"), async (req, res) => {
  const schema = z.object({ name: z.string().min(1), icon: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json(cat);
});

router.delete("/categories/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).send();
});

router.get("/stats", requireAuth, requireRole("admin"), async (_req, res) => {
  const [users, shops, orders] = await Promise.all([
    db.select({ id: usersTable.id }).from(usersTable),
    db.select({ id: shopsTable.id }).from(shopsTable),
    db.select({ id: ordersTable.id, total: ordersTable.total }).from(ordersTable),
  ]);

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  res.json({
    totalUsers: users.length,
    totalShops: shops.length,
    totalOrders: orders.length,
    totalRevenue: revenue.toFixed(2),
  });
});

export default router;
