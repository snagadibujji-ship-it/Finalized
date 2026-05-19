import { Router } from "express";
import { db } from "@workspace/db";
import { deliveryJobsTable, ordersTable, shopsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import { getIO } from "../lib/socket";

const router = Router();

router.get("/jobs", requireAuth, requireRole("delivery"), async (_req, res) => {
  const jobs = await db
    .select({
      job: deliveryJobsTable,
      order: ordersTable,
      shop: shopsTable,
    })
    .from(deliveryJobsTable)
    .innerJoin(ordersTable, eq(deliveryJobsTable.orderId, ordersTable.id))
    .innerJoin(shopsTable, eq(ordersTable.shopId, shopsTable.id))
    .where(eq(deliveryJobsTable.status, "available"));

  res.json(jobs);
});

router.post("/jobs/:id/accept", requireAuth, requireRole("delivery"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const jobId = Number(req.params["id"]);

  const [job] = await db
    .select()
    .from(deliveryJobsTable)
    .where(
      and(eq(deliveryJobsTable.id, jobId), eq(deliveryJobsTable.status, "available"))
    )
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not available" });
    return;
  }

  const [updated] = await db
    .update(deliveryJobsTable)
    .set({ riderId: userId, status: "accepted", acceptedAt: new Date() })
    .where(eq(deliveryJobsTable.id, jobId))
    .returning();

  await db
    .update(ordersTable)
    .set({ status: "picked_up", updatedAt: new Date() })
    .where(eq(ordersTable.id, job.orderId));

  try {
    const io = getIO();
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, job.orderId))
      .limit(1);
    if (order) {
      io.to(`user:${order.customerId}`).emit("order:status", {
        orderId: job.orderId,
        status: "picked_up",
      });
    }
    io.emit("job:accepted", { jobId, riderId: userId });
  } catch {
    // non-fatal
  }

  res.json(updated);
});

router.patch("/jobs/:id/status", requireAuth, requireRole("delivery"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const jobId = Number(req.params["id"]);

  const statusSchema = z.object({
    status: z.enum(["picked_up", "delivered"]),
  });

  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const [job] = await db
    .select()
    .from(deliveryJobsTable)
    .where(and(eq(deliveryJobsTable.id, jobId), eq(deliveryJobsTable.riderId, userId)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const timestamps: Record<string, Date> = {};
  if (parsed.data.status === "picked_up") timestamps["pickedUpAt"] = new Date();
  if (parsed.data.status === "delivered") timestamps["deliveredAt"] = new Date();

  const [updated] = await db
    .update(deliveryJobsTable)
    .set({ status: parsed.data.status, ...timestamps })
    .where(eq(deliveryJobsTable.id, jobId))
    .returning();

  const newOrderStatus =
    parsed.data.status === "delivered" ? "delivered" : "picked_up";

  await db
    .update(ordersTable)
    .set({ status: newOrderStatus, updatedAt: new Date() })
    .where(eq(ordersTable.id, job.orderId));

  try {
    const io = getIO();
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, job.orderId))
      .limit(1);
    if (order) {
      io.to(`user:${order.customerId}`).emit("order:status", {
        orderId: job.orderId,
        status: newOrderStatus,
      });
    }
  } catch {
    // non-fatal
  }

  res.json(updated);
});

router.get("/my-jobs", requireAuth, requireRole("delivery"), async (req, res) => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const jobs = await db
    .select({
      job: deliveryJobsTable,
      order: ordersTable,
    })
    .from(deliveryJobsTable)
    .innerJoin(ordersTable, eq(deliveryJobsTable.orderId, ordersTable.id))
    .where(eq(deliveryJobsTable.riderId, userId))
    .orderBy(deliveryJobsTable.createdAt);

  res.json(jobs);
});

export default router;
