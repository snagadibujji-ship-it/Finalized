import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, shopsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router = Router();

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  inStock: z.boolean().optional(),
});

router.patch("/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const productId = Number(req.params["id"]);

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.id, product.shopId), eq(shopsTable.ownerId, userId)))
    .limit(1);

  if (!shop) {
    res.status(403).json({ error: "Not your product" });
    return;
  }

  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [updated] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.id, productId))
    .returning();

  res.json(updated);
});

router.delete("/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const productId = Number(req.params["id"]);

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(and(eq(shopsTable.id, product.shopId), eq(shopsTable.ownerId, userId)))
    .limit(1);

  if (!shop) {
    res.status(403).json({ error: "Not your product" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, productId));
  res.status(204).send();
});

export default router;
