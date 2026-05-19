import {
  pgTable,
  serial,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const jobStatusEnum = pgEnum("job_status", [
  "available",
  "accepted",
  "picked_up",
  "delivered",
  "cancelled",
]);

export const deliveryJobsTable = pgTable("delivery_jobs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  riderId: integer("rider_id").references(() => usersTable.id),
  status: jobStatusEnum("status").notNull().default("available"),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryJobSchema = createInsertSchema(
  deliveryJobsTable,
).omit({ id: true, createdAt: true });

export const selectDeliveryJobSchema = createSelectSchema(deliveryJobsTable);

export type InsertDeliveryJob = z.infer<typeof insertDeliveryJobSchema>;
export type DeliveryJob = typeof deliveryJobsTable.$inferSelect;
