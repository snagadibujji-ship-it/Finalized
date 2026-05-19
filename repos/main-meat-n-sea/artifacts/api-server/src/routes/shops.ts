import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router = Router();

const shopSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  description: z.string().optional(),
  area: z.string().min(1),
  logoUrl: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  inStock: z.boolean().default(true),
});

router.post("/", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const parsed = shopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const existing = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.ownerId, userId))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "You already have a shop" });
    return;
  }

  const [shop] = await db
    .insert(shopsTable)
    .values({ ...parsed.data, ownerId: userId })
    .returning();

  res.status(201).json(shop);
});

router.get("/", async (_req, res) => {
  const shops = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.status, "active"));
  res.json(shops);
});

router.get("/mine", requireAuth, requireRole("vendor"), async (req, res) => {
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
  res.json(shop);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, id))
    .limit(1);

  if (!shop) {
    res.status(404).json({ error: "Shop not found" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.shopId, id), eq(productsTable.inStock, true)));

  res.json({ ...shop, products });
});

router.patch("/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const id = Number(req.params["id"]);

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.id, id), eq(shopsTable.ownerId, userId)))
    .limit(1);

  if (!shop) {
    res.status(404).json({ error: "Shop not found or not yours" });
    return;
  }

  const updateSchema = shopSchema.partial();
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [updated] = await db
    .update(shopsTable)
    .set(parsed.data)
    .where(eq(shopsTable.id, id))
    .returning();

  res.json(updated);
});

router.post("/:id/products", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const shopId = Number(req.params["id"]);

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.id, shopId), eq(shopsTable.ownerId, userId)))
    .limit(1);

  if (!shop) {
    res.status(404).json({ error: "Shop not found or not yours" });
    return;
  }

  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, shopId })
    .returning();

  res.status(201).json(product);
});

router.get("/:id/products", async (req, res) => {
  const shopId = Number(req.params["id"]);
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.shopId, shopId));
  res.json(products);
});

export default router;
