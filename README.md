# 🏢 Nexora Backend

**Nexora Backend** is a high-performance RESTful API server for the Nexora Apartment Management System. Built using Node.js, Express 5, Mongoose ORM, Better Auth, Zod validation, and Stripe payment integration, it follows an enterprise-grade **Routes -> Controllers -> Services** modular architecture.

---

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-5.x-lightgrey?logo=express)
![Mongoose](https://img.shields.io/badge/Mongoose-ORM-red?logo=mongoose)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.x-purple)
![Zod](https://img.shields.io/badge/Zod-Validation-blue?logo=zod)
![Stripe](https://img.shields.io/badge/Stripe-Payments-blue?logo=stripe)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

✅ **Layered Modular Architecture** (Routes, Controllers, Services)  
✅ **Better Auth Integration** (`better-auth`) for session & email/password authentication  
✅ **Password Hashing** via `bcryptjs` (salt rounds: 10)  
✅ **Strict Request Body Validation** using `Zod` schemas  
✅ **Role-Based Authorization** (Admin / Member / User)  
✅ **Apartments Management** with pagination, rent range filtering, and sorting  
✅ **Agreements Workflow** (Application request, admin accept/reject)  
✅ **Coupons System** (Create, update, delete, and discount validation)  
✅ **Rent Payments** integrated with Stripe PaymentIntents  
✅ **Automated Monthly Rent Generation** via `node-cron`  
✅ **Announcements System** for property notices  
✅ **Admin Dashboard Statistics** with MongoDB aggregation pipelines  

---

## 🛠️ Tech Stack

| Tech | Purpose |
| :--- | :--- |
| ⚡ **Express.js (v5)** | High-performance Web Application Framework |
| 🍃 **Mongoose (v9)** | Object Data Modeling (ODM) for MongoDB |
| 🔐 **Better Auth** | Authentication & Session Management |
| 🔑 **bcryptjs** | Password Hashing (Salt 10) |
| 🛡️ **Zod** | Type-safe Request Schema Validation |
| 💳 **Stripe** | Payment Intent Processing |
| 🕒 **Node-cron** | Automated Scheduled Jobs |

---

## 📁 Directory & Module Structure

```
Nexora-server/
├── app.js                           # Express application & global middleware
├── server.js                        # Database connection & server listener
├── index.js                         # Main entry point (Exports app for Vercel/Local)
├── .env.example                     # Environment variables template
├── config/
│   ├── auth.js                      # Better Auth configuration & MongoDB adapter
│   └── db.js                        # Mongoose database connection setup
├── cron/
│   └── rentCron.js                  # Monthly rent generation cron job
├── middleware/
│   └── auth.js                      # Better Auth session & role authorization
├── validators/
│   └── schemas.js                   # Zod request validation schemas & middleware
├── models/                          # Mongoose Database Schemas
│   ├── User.js
│   ├── Apartment.js
│   ├── Agreement.js
│   ├── RentPayment.js
│   ├── Announcement.js
│   └── Coupon.js
└── modules/                         # Feature Modules (Route - Controller - Service)
    ├── apartment/                   # Apartment routes, controllers, services
    ├── agreement/                   # Agreement workflow routes & services
    ├── user/                        # User registration, login, role handlers
    ├── coupon/                      # Coupon creation & validation
    ├── rentPayment/                 # Stripe payment intent & rent recording
    ├── announcement/                # Announcement management
    └── admin/                       # Admin statistics & member management
```

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Nexora?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_test_51...

BETTER_AUTH_SECRET=your_super_secret_better_auth_key_here
BETTER_AUTH_URL=http://localhost:5000
```

---

## 📦 Installation & Local Development

### Using `npm`:

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Start production server
npm start
```

### Using `bun`:

```bash
# 1. Install dependencies
bun install

# 2. Run in development mode
bun dev
```

---

## 🌐 API Reference

### 🔐 Authentication (`Better Auth`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| ALL | `/api/auth/*` | Better Auth handlers (Sign In, Sign Up, Sign Out, Session) | Public |
| POST | `/users/login` | Email & password login (returns JWT/Session) | Public |

### 👤 Users

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/users` | Create or update user account | Public (Zod) |
| GET | `/users/:email/role` | Get user role (`user`, `member`, `admin`) | Session |

### 🏢 Apartments

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/apartments` | Paginated apartments list (`page`, `limit`, `minRent`, `maxRent`, `sortBy`, `sortOrder`) | Public |

### 📄 Agreements

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/agreements` | Apply for an apartment agreement | Session (Zod) |
| GET | `/agreements?status=pending` | Get agreements by status | Admin |
| PATCH | `/agreements/:id` | Accept or reject agreement request | Admin |
| GET | `/agreements/user/:email` | Get user's agreements list | Session |

### 🎟️ Coupons

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/coupons` | List all available coupons | Public |
| POST | `/coupons/validate` | Validate coupon code and get discount | Member |
| POST | `/coupons` | Add a new coupon | Admin (Zod) |
| PUT | `/coupons/:id` | Update existing coupon details | Admin (Zod) |
| DELETE | `/coupons/:id` | Delete coupon by ID | Admin |

### 💳 Rent Payments & Stripe

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/create-payment-intent` | Create Stripe PaymentIntent with optional coupon discount | Member (Zod) |
| POST | `/rent-payments` | Record successful rent payment | Session (Zod) |
| GET | `/rent-payments/:email` | Get rent payments history for user | Session |
| PATCH | `/rent-payments/:id` | Update rent payment status | Session |

### 📢 Announcements

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/announcements` | Get list of announcements | Session |
| POST | `/announcements` | Create new announcement | Admin (Zod) |
| PATCH | `/announcements/:id` | Update announcement by ID | Admin (Zod) |
| DELETE | `/announcements/:id` | Delete announcement by ID | Admin |

### 📊 Admin Dashboard

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/members` | Get all members with agreement & apartment info | Admin |
| PATCH | `/members/:email/remove` | Downgrade member role & release apartment | Admin |
| GET | `/members/:email/due-months` | Get unpaid rent months for a member | Admin |
| GET | `/admin/stats` | Aggregate stats (Total rooms, availability %, total users, members) | Admin |

---

## ⏰ Cron Jobs

| Schedule | Description |
| :--- | :--- |
| `0 1 1 * *` | Runs on the 1st of every month at 01:00 AM to automatically generate unpaid rent records for active members and advance their `nextRentDate`. |

---

## 📜 License

This project is licensed under the **MIT License**.

Built with ❤️ by **Taj Uddin**  
📧 Contact: `tajuddin.cse.dev@gmail.com`
