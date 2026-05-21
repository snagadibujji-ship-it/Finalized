# Meat N Sea — Dual Experience System Agent Blueprint (`agents.md`)

This document serves as the absolute source of truth and execution instructions for the AI Agent (Jules) to implement the dual-mode ecosystem: **Sabka Bazaar Mode** (vibrant local marketplace) and **MnS Studio Mode** (premium curated flagship).

## 🚨 Core Engineering Rules & Architecture Safeguards
1. **Stack Preservation:** Do NOT alter the database engine. We are strictly on MongoDB and Mongoose. Ignore any legacy architecture mentions of Postgres/Drizzle.
2. **Financial Math:** All monetary data fields MUST use integer values representing 'Paise' (e.g., `amountPaise`). Floating-point decimals for currencies are strictly banned.
3. **TypeScript Safety:** All data payloads, parameters, and states must be fully typed. No usage of `any`.
4. **Validation Layer:** All incoming API parameters or request bodies must pass through the backend Zod validation middleware.

---

## 🎨 Branding & Theme Tokens (Derived from Logo Palette)
The application must dynamically switch its UI look using a unified Design Token system reading from the active user mode.

### Mode 1: Sabka Bazaar (data-mode="bazaar")
* **Vibe:** Energetic, local, trustworthy marketplace.
* **Background:** Light, warm off-white surface base (`#FFF7ED`).
* **Primary Accents:** Vibrant Orange (`#F97316`) and Local Yellow (`#EAB308`).
* **Text:** Dark Charcoal (`#1C1917`).

### Mode 2: MnS Studio (data-mode="studio")
* **Vibe:** Premium, art-directed, high-end luxury brand.
* **Background:** Deep, rich textured red from the official logo.
* **Primary Actions:** Metallic Glossy Yellow (High contrast action buttons).
* **Success/Links:** Royal Blue (from the logo's premium accent).
* **Alerts/Danger:** Deeper contrasting Red (from the "n" glyph).

---

## 🛠️ Step-by-Step Execution Plan for Jules

### Checkpoint 1: Database Schema Extensions
Extend the existing Mongoose models to allow products and vendors to partition across the dual modes.

1. **Vendor Schema (`Vendor.ts`):**
   * Add `isMnsStudio`: `Boolean`, default `false`.
   * Add `studioTier`: `String`, enum `['flagship', 'partner']`, optional.

2. **Product Schema (`Product.ts`):**
   * Add `supportedMode`: `String`, enum `['bazaar', 'studio', 'both']`, default `bazaar`.
   * Add `studioDescription`: `String`, optional (for premium art-directed copy).
   * Add `originStory`: `String`, optional (e.g., "Caught 14km offshore at 4 AM").
   * Add `freshnessHours`: `Number`, optional.

3. **New Collection Schemas:**
   * Create `MnsCollection.ts` (`title`, `slug`, `imageUrl`, `isActive`, `sortOrder`).
   * Create `StudioSubscription.ts` (`userId`, `planId`, `status`, `deliveryDay`, `nextDeliveryAt`).

---

### Checkpoint 2: Mode-Aware API Routing
Modify existing route parameters so the client can query information dynamically based on the current mode without modifying the JSON contract format.

1. **Vendor Controller (`GET /api/vendors`):**
   * Accept an optional query string parameter `mode`.
   * If `mode === 'bazaar'`, apply filter `{ isMnsStudio: false }`.
   * If `mode === 'studio'`, apply filter `{ isMnsStudio: true }`.

2. **Product Controller (`GET /api/products`):**
   * Accept an optional query string parameter `mode`.
   * Filter products based on match: `mode === 'studio' ? { supportedMode: { $in: ['studio', 'both'] } } : { supportedMode: { $in: ['bazaar', 'both'] } }`.

3. **New Studio Endpoints:**
   * `GET /api/studio/home` -> Combined aggregation pipeline fetching banners, collections, and active freshness status metrics.

---

### Checkpoint 3: Global State & Route Splitting
Build a light, performant client-side store handling mode shifting with isolated workflows.

1. **State Engine (`useAppStore.ts` via Zustand):**
   * Track `mode`: `'bazaar' | 'studio'`.
   * Persist selection automatically to `localStorage` or native mobile storage.
   * Expose a flag `isTransitioning` to manage the smooth cross-fade duration between states.

2. **Isolated Double Carts (`useCartStore.ts`):**
   * Maintain two separate array items: `bazaarCart` and `studioCart`.
   * Switching modes must NOT drop items from the alternate mode's cart.
   * Derive an `activeCart` array mapping dynamically to the user's active UI state.

3. **Header Pill Switcher:**
   * Create a prominent horizontal pill switcher (`[ Bazaar ] [ MnS Studio ]`) at the top of the Customer header interface for frictionless swapping.

---

### Checkpoint 4: Priority Logistics Core
Incorporate the premium dispatch mechanics to handle Studio service level agreements (SLAs).

1. **Order Record Expansion (`Order.ts`):**
   * Add `deliveryTier`: `String`, enum `['standard', 'priority']`, default `standard`.
   * Add `sourceMode`: `String`, enum `['bazaar', 'studio']`, default `bazaar`.

2. **Rider Notification Processing:**
   * Modify the Redis dispatch queue worker. Orders tagged with `priority` tier must automatically bubble to the top of the delivery matching engine array.
   * Renders with a gold highlight ✦ badge inside the Rider mobile execution UI.
   * Enforce mandatory photo upload collection at handover for priority deliveries.
