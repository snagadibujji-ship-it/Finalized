# MEAT N SEA — COMPLETE BUILD PLAN

## Overview
A full hyperlocal commerce platform with 5 user roles: Customer, Vendor, Rider, Worker/Ops, Admin.

## Tech Stack
- **Backend API:** Node.js + Express + MongoDB (Mongoose)
- **Authentication:** JWT with role-based access
- **Mobile Apps:** React Native (Expo)
- **Web Admin & Customer:** Next.js (+ Tailwind CSS for Admin)
- **Real-time:** WebSocket + Redis
- **Payments:** Razorpay (UPI, COD, bank transfer)
- **Notifications:** Firebase FCM
- **Maps:** Google Maps SDK
- **File Uploads:** Cloudinary or AWS S3

## Database Schemas
- **Users:** id, name, phone, email, passwordHash, role, location, walletBalance, fcmToken
- **Vendors:** id, userId, shopName, businessType, GST, docs (Aadhaar/PAN), address, serviceRadius, bankAccount, status, commissionPercent
- **Products:** id, vendorId, name, category, price, stock, images, availability
- **Orders:** id, customerId, vendorId, riderId, items, totals, paymentMethod/Status, deliveryAddress, statusTimeline
- **Riders:** id, userId, vehicle details, docs, bankAccount, currentLocation, totalEarnings, status
- **Payouts:** id, recipientId, amount, method, status
- **Notifications:** id, userId, title, body, type
- **Coupons:** id, code, discount, constraints

## Build Order / Phases

### 1. Foundation & Backend Core API
- Set up MongoDB schemas for all collections.
- Build JWT authentication for all 5 roles.
- Develop REST APIs for users, vendors, products, orders, riders, payouts, and admin controls.

### 2. Admin Control Panel
- Build Next.js admin dashboard.
- Features: Vendor approval workflow, order live view, rider map, payout management, system analytics.

### 3. Vendor Platform (App + Web)
- Implement multi-step vendor registration (basic, business, docs, service area).
- Build Vendor Dashboard for order management, product updates, and earnings analytics.

### 4. Customer Mobile App + Web
- Develop Customer interface for browsing nearby vendors, categories (Fresh Items, Pickles, etc.), and featured products.
- Implement shopping cart, checkout flow with Razorpay, and coupon validation.
- Build live order tracking UI.

### 5. Rider App + Smart Dispatch
- Implement rider registration and verification.
- Build Rider Dashboard for toggling availability, accepting jobs, and viewing earnings.
- Implement smart dispatch and routing logic.

### 6. Real-time Tracking & Notifications
- Set up WebSocket and Redis for live rider location updates every 5 seconds.
- Connect Firebase FCM for order status updates, new job alerts, and chat.

### 7. Payments & Payouts
- Integrate Razorpay for orders (UPI, Card, Wallet).
- Setup automated payout logic for vendors (daily/weekly) and riders (daily).
- Implement platform commission deduction logic.

### 8. Analytics & Advanced Features
- Build detailed vendor and admin analytics dashboards.
- Future AI Features: smart dispatch ML, pricing suggestions, fraud detection.

## Pre-commit Steps
- Run standard testing, verification, review, and reflection prior to finalizing code changes.