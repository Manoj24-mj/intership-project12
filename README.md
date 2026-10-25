# ArtLoop — Art Supply Exchange & Second-hand Material Marketplace

> **Unified Mentor Internship Project**  
> Full-Stack Web Development | Student-to-Student Community Platform

---

## 1. Project Title and Overview

**ArtLoop** is a dedicated web marketplace designed for art students, hobbyists, and independent artists to buy, sell, and exchange second-hand art supplies and studio materials. 

Many creative students accumulate excess paints, half-used sketchbooks, unused canvases, and specialty drawing tools that sit idle after semester projects or end up in landfills. Meanwhile, beginners and peers struggle with the high retail cost of brand-new art materials. ArtLoop bridges this gap by enabling affordable direct local transactions and item-for-item barter exchanges.

---

## 2. Problem Statement

1. **High Material Costs:** Quality artist-grade supplies (acrylics, oils, gouache, pure bristle brushes, heavy-weight paper) are prohibitively expensive for art and design students.
2. **Material Wastage:** Students frequently purchase entire packs for a single course or final submission, leaving 70–90% of the materials unused once the semester concludes.
3. **Absence of Dedicated Local Platforms:** General classifieds (OLX, Quickr) lack community trust, specific art categorization (medium, condition, pigment grade), and direct barter exchange mechanisms.

---

## 3. Objectives & Expected Impact

- **Affordability:** Cut material acquisition costs by 40–70% through peer second-hand pricing.
- **Sustainability:** Divert usable art tools and surplus media away from garbage bins.
- **Barter Culture:** Support cash-free swaps (e.g., exchanging an extra acrylic set for a spiral sketchbook).
- **Local Creative Community:** Foster connections across student campuses and localities (e.g., Yelahanka, Rajanukunte, Bengaluru).

---

## 4. Key Features

- **Authentication & Roles:** Secure user registration, password hashing via `bcryptjs`, session persistence, and role-based access control (`user` and `admin`).
- **Interactive Marketplace:** Real-time search by product name/description, filtering across 7 art supply categories, condition ratings (New, Like New, Good, Fair), locality filters, and dynamic sorting by price or newest.
- **Product Details & Actions:** Comprehensive material specifications, seller location, condition tags, and direct action triggers.
- **Item-for-Item Barter System:** Propose swaps by offering one of your own active listings in exchange for another artist's item, with real-time status transitions (`pending` → `accepted` → `completed` or `rejected`/`cancelled`).
- **Express Buy Interest:** Express interest to arrange direct offline payment and campus handoff with zero middleman commissions.
- **Persistent Chat:** In-app conversation threads linked to specific items and transactions, with participant verification and automatic polling.
- **Studio Inventory Management:** Create, edit, toggle availability (`available` / `sold`), and delete your own listings with instant live card preview.
- **Staff Administration Panel:** Overview metrics, user moderation (suspend/reactivate accounts), listing removal, and complaint report triage.
- **Pre-Seeded Demonstration Data:** 12 realistic art supply listings with high-definition imagery and 1-click demo switcher accounts for internship evaluation.

---

## 5. Technology Stack

| Layer | Technologies Used | Rationale |
|---|---|---|
| **Frontend** | React 19, JavaScript/TypeScript, Tailwind CSS, Lucide Icons | Responsive, accessible, beginner-friendly component hierarchy with warm terracotta art palette. |
| **Backend** | Node.js, Express.js (REST API architecture) | Clear, modular endpoints with centralized authentication and ownership authorization. |
| **Database** | MongoDB Atlas / Mongoose ODM (with seamless in-memory fallback) | Flexible schema validation for users, products, requests, messages, and moderation reports. |
| **Security** | `bcryptjs`, HTTP-only cookies / Bearer token fallback | Secure password storage, tamper-proof session tokens, and input sanitization. |
| **Development** | Vite, TSX, Node test runner (`node:test`) | Instant build feedback, sub-second unit tests, and production compilation. |

---

## 6. Folder Structure

```
artloop/
├── index.html                   # HTML entry point with fonts & metadata
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
├── server.ts                    # Express server with Vite middleware integration
├── server/
│   ├── config/                  # Environment & database settings
│   ├── db.ts                    # Database layer (MongoDB Atlas + memory cache fallback)
│   ├── models/
│   │   └── schemas.ts           # Mongoose schemas (User, Product, BuyRequest, SwapRequest, etc.)
│   ├── routes/
│   │   └── api.ts               # Express REST API routes and middlewares
│   └── seeds/
│       └── sampleData.ts        # 12 realistic art supply listings & seed users
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Responsive header, wordmark & demo account switcher
│   │   ├── Footer.tsx           # Project credits & links
│   │   └── ProductCard.tsx      # Art supply card with condition tags & price in ₹
│   ├── context/
│   │   └── AuthContext.tsx      # React authentication state & quick login helpers
│   ├── pages/
│   │   ├── LoginPage.tsx        # Login and registration with client validation
│   │   ├── DashboardPage.tsx    # Artist dashboard & incoming requests summary
│   │   ├── MarketplacePage.tsx  # Product catalog, multi-criteria filters & search
│   │   ├── ProductDetailsPage.tsx # Item specifications, buy modal & swap modal
│   │   ├── SellAndMyListingsPage.tsx # Material listing form & inventory manager
│   │   ├── SwapRequestsPage.tsx # Barter negotiation & completion lifecycle
│   │   ├── BuyRequestsPage.tsx  # Direct purchase interests & handoff tracker
│   │   ├── ChatPage.tsx         # Persistent peer-to-peer messaging system
│   │   └── AdminPanelPage.tsx   # Staff analytics, user moderation & listing review
│   ├── services/
│   │   └── api.ts               # Clean Fetch API client
│   ├── types/
│   │   └── index.ts             # Shared data interfaces
│   └── utils/
│       ├── rules.ts             # Decoupled business logic & validation rules
│       └── rules.test.ts        # Unit test suite with node:test
└── README.md
```

---

## 7. Prerequisites

- **Node.js:** v18.x or v20.x or higher
- **npm:** v9.x or higher
- *(Optional)* **MongoDB Atlas Account:** For cloud database connection string. If omitted, ArtLoop automatically runs its zero-configuration local embedded store.

---

## 8. Installation & Setup Instructions

### Step 1: Clone or navigate to the repository
```bash
git clone <repository-url>
cd artloop
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set the following variables in `.env`:
```env
# Optional: Your MongoDB Atlas connection URI
# Example: mongodb+srv://<username>:<password>@cluster0.mongodb.net/artloop?retryWrites=true&w=majority
MONGODB_URI=

# Port configuration (default: 3000)
PORT=3000

# Session Secret Key
SESSION_SECRET=artloop_student_secret_key_2026

# Node environment
NODE_ENV=development
```

*(Note: If `MONGODB_URI` is left blank, ArtLoop will launch seamlessly using its built-in in-memory document engine pre-seeded with all 12 items and demo users!)*

### Step 4: Run the Application Locally
```bash
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

### Step 5: Run Unit Tests
ArtLoop includes automated unit test suites for its core transaction and barter rules:
```bash
npm test
# or
npx tsx --test src/utils/rules.test.ts
```

---

## 9. Pre-Configured Demo Accounts (For Evaluators)

Use the convenient **"Demo Switch ▾"** in the top navigation bar or the 1-click buttons on the login page:

1. **Student Artist (Seller):**
   - **Email:** `priya@artloop.in`
   - **Password:** `artloop123`
   - **Locality:** Yelahanka, Bengaluru

2. **Hobbyist Painter (Buyer & Swapper):**
   - **Email:** `rahul@artloop.in`
   - **Password:** `artloop123`
   - **Locality:** Rajanukunte, Bengaluru

3. **Platform Administrator (Staff):**
   - **Email:** `admin@artloop.in`
   - **Password:** `admin123`
   - **Locality:** Bengaluru Central

---

## 10. REST API Endpoint Overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create new student artist account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue session cookie |
| `POST` | `/api/auth/logout` | Public | Terminate session |
| `GET` | `/api/auth/me` | Authenticated | Fetch current profile |
| `GET` | `/api/products` | Public | List products with search, filter, and sorting |
| `GET` | `/api/products/:id` | Public | Retrieve single product details |
| `POST` | `/api/products` | User | Publish new art material listing |
| `PUT` | `/api/products/:id` | Owner/Admin | Update material details |
| `PATCH`| `/api/products/:id/status` | Owner/Admin | Mark available, reserved, or sold |
| `DELETE`| `/api/products/:id` | Owner/Admin | Delete listing |
| `POST` | `/api/swap-requests` | User | Propose item-for-item exchange |
| `GET` | `/api/swap-requests` | User | Get user's sent & received swap requests |
| `PATCH`| `/api/swap-requests/:id/status`| Participant | Accept, reject, cancel, or complete swap |
| `POST` | `/api/buy-requests` | User | Express buy interest for an item |
| `GET` | `/api/buy-requests` | User | List incoming and outgoing buy requests |
| `PATCH`| `/api/buy-requests/:id/status` | Participant | Accept, reject, or complete deal |
| `GET` | `/api/conversations` | User | List user's active message threads |
| `GET` | `/api/conversations/:id/messages` | Participant | Get chat history |
| `POST` | `/api/conversations/:id/messages` | Participant | Send new message |
| `POST` | `/api/reports` | User | Flag listing for moderation |
| `GET` | `/api/admin/stats` | Admin | Retrieve platform metrics |
| `GET` | `/api/admin/users` | Admin | List all registered users |
| `PATCH`| `/api/admin/users/:id/status`| Admin | Suspend or reactivate user |
| `DELETE`| `/api/admin/products/:id` | Admin | Moderate & delete improper listing |
| `GET` | `/api/admin/reports` | Admin | Review reported listings |

---

## 11. Internship Evaluation Deliverables

### A. Project Synopsis
ArtLoop addresses art student financial constraints and studio waste by providing a localized, circular marketplace for second-hand supplies. Built with React, Node.js, Express, and MongoDB/Mongoose, it supports price search, category filtering, persistent messaging, administrator oversight, and an item-for-item barter engine that allows students to swap creative tools without exchanging money.

### B. Feature Summary
1. **Browse & Multi-Filter:** Real-time search, price boundaries, 7 art categories, 4 condition states, and city localities.
2. **Item-for-Item Barter:** Propose trades using your own listed items with state validation.
3. **Cash-on-Collection Coordination:** Direct purchase interest without payment gateway fees.
4. **Persistent Buyer-Seller Chat:** Real-time conversation threads tied to items.
5. **Live Inventory Manager:** Create, edit, and mark items sold with live preview.
6. **Administrator Portal:** Role-protected oversight of users, listings, and reports.

### C. Database Relationships
```
[User] (1) --------< (Many) [Product] (sellerId)
  |                         |
  | (buyerId)               | (productId)
  +--------< [BuyRequest] >-+
  |
  | (requesterId / recipientId)
  +--------< [SwapRequest] >--- [Product] (requestedProductId / offeredProductId)
  |
  +--------< [Conversation] (participantIds) >---< [Message] (senderId, conversationId)
  |
  +--------< [Report] (reporterId) >--- [Product] (productId)
```

### D. User Flow
1. **Discovery:** User visits marketplace, filters by "Paints and Colours" under ₹200.
2. **Evaluation:** Clicks a listing (e.g., Watercolour Paint Set) to inspect condition, pictures, and seller locality.
3. **Action:**
   - Either clicks **Express Buy** with a preferred campus meeting spot;
   - Or clicks **Request Swap**, selecting an item from their own inventory to offer in trade.
4. **Coordination:** A chat thread opens between buyer and seller to agree on physical handoff.
5. **Completion:** Upon meeting and handing over materials, the seller marks the request and listing as **Completed / Sold**.

### E. Short Demonstration Script (For Viva / Demo)
1. **Show Public Catalog:** Open `http://localhost:3000`. Show 12 diverse listings with prices in ₹. Demonstrate search for "acrylic" and filtering by condition "New".
2. **Demonstrate 1-Click Login:** Click **Demo Switch ▾** -> Select **Priya Sharma (Student)**.
3. **Show Artist Dashboard:** Point out active metrics (12 community items, 6 personal listings, incoming requests alert).
4. **Demonstrate Swap Acceptance:** Navigate to **Swap Requests**. View the barter proposal from Rahul Verma (offering an A3 Sketchbook for Priya's Canvas Pack). Click **Accept Swap**.
5. **Demonstrate Chat:** Click **Messages**. Show conversation history with Rahul and send a message: *"See you at the campus library entrance tomorrow at 11am!"*
6. **Demonstrate Admin Panel:** Click **Demo Switch ▾** -> Select **Administrator**. Show restricted administration dashboard, user suspension toggle, and listing moderation.

### F. Likely Internship Evaluation Questions & Answers

**Q1: Why did you not implement an online payment gateway (e.g., Razorpay/Stripe)?**  
*Answer:* Art materials are physical, tactile goods where condition, pigment drying, and bristle quality must be inspected in person. A peer-to-peer campus exchange avoids payment gateway charges (2–3%), courier costs, and fraud, while keeping the platform accessible to college students without credit cards.

**Q2: How do you prevent sellers from buying or swapping their own items?**  
*Answer:* We implemented strict server-side validation in `server/routes/api.ts` and pure rules in `src/utils/rules.ts` (`canExpressBuyInterest` and `canRequestSwap`). If `product.sellerId === req.user.id`, the backend rejects the operation with HTTP 400.

**Q3: How are passwords secured in the database?**  
*Answer:* Passwords are never stored in plaintext. When a user registers, `bcryptjs` generates a cryptographic salt and one-way hash (`bcrypt.hash(password, 10)`). Passwords cannot be retrieved even by database administrators.

**Q4: How does the application handle offline or local development without MongoDB Atlas credentials?**  
*Answer:* ArtLoop features a hybrid persistence layer in `server/db.ts`. When `MONGODB_URI` is provided, it connects to MongoDB Atlas using Mongoose. If running in a demo or offline environment, it initializes a resilient document engine pre-loaded with realistic seed listings, ensuring full zero-configuration functionality.

---

## 12. Deployment Instructions

### Option A: Complete Full-Stack Deployment on Vercel (Recommended & Ready)
ArtLoop includes native Vercel serverless integration (`api/index.ts` and `vercel.json`). You can deploy the complete frontend and backend directly to Vercel in one step:

1. Push this codebase to your GitHub repository.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Framework Preset: **Vite** (Vercel automatically detects this).
4. Build Settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. In **Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://pmnagapapa_db_user:<password>@arts.12dxmg8.mongodb.net/artloop?retryWrites=true&w=majority`
   - `SESSION_SECRET`: Any secure random passphrase (e.g. `artloop_production_session_secret_2026`)
   - `NODE_ENV`: `production`
6. Click **Deploy**. Vercel will build your React SPA and host the Express REST API as serverless functions with zero configuration!

### Option B: Frontend on Vercel + Backend on Render
If you prefer running a continuous Node.js server on Render with the client on Vercel:

1. **Deploy Backend to Render:**
   - Create a **New Web Service** on Render and connect your GitHub repo.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection URI.
     - `SESSION_SECRET`: A secure random string.
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render default)
   - Copy your Render service URL (e.g., `https://artloop-api.onrender.com`).

2. **Deploy Frontend to Vercel:**
   - Import your GitHub repo on Vercel.
   - Set Environment Variable:
     - `VITE_API_URL`: `https://artloop-api.onrender.com`
   - Click **Deploy**. The frontend will automatically route all `/api` requests to Render with credentials and CORS headers enabled.

---

## 13. License

Developed for educational evaluation under Unified Mentor Internship.  
Apache-2.0 License.
