# ArtLoop — System Architecture & Technical Specifications

> **Unified Mentor Internship Project**  
> **Full-Stack Application Architecture Document**  
> **Backend:** Node.js + Express.js  
> **Frontend:** React 19 + TypeScript + Tailwind CSS  
> **Database:** MongoDB Atlas (Mongoose ODM) with Resilient Memory Cache Fallback  

---

## 1. High-Level Architectural Overview

ArtLoop implements a clean client-server architecture designed for high maintainability, zero unnecessary dependencies, and clear separation of concerns.

```
+-----------------------------------------------------------------------+
|                             USER BROWSER                              |
|                                                                       |
|   React SPA (Vite Dev / Static Production Bundle)                     |
|   ├── Components & Pages (Marketplace, Dashboard, Details, Modals)    |
|   ├── Context Layer (AuthContext - User state, Login, Demo Switcher)   |
|   └── API Service Layer (Native Fetch with Credentials / Bearer token)|
+-----------------------------------+-----------------------------------+
                                    |
                         HTTP / REST API Requests
                                    |
+-----------------------------------v-----------------------------------+
|                        EXPRESS.JS SERVER                              |
|                                                                       |
|   Middleware Pipeline:                                                |
|   ├── cors()                                                          |
|   ├── express.json() & express.urlencoded()                           |
|   ├── cookieParser()                                                  |
|   └── requireAuth & requireAdmin middleware                           |
|                                                                       |
|   API Controllers & Route Handlers (/server/routes/api.ts):           |
|   ├── /api/auth          (Register, Login, Logout, Profile)           |
|   ├── /api/products      (CRUD, Status toggling, Filters)             |
|   ├── /api/buy-requests  (Purchase interest workflow)                 |
|   ├── /api/swap-requests (Item-for-item barter lifecycle)             |
|   ├── /api/conversations (Chat threads & messaging)                   |
|   ├── /api/reports       (Flagging listings)                          |
|   └── /api/admin         (Metrics, User suspension, Moderation)       |
+-----------------------------------+-----------------------------------+
                                    |
                         Database Abstraction Layer
                             (/server/db.ts)
                                    |
      +-----------------------------+-----------------------------+
      | (If MONGODB_URI is set)                                   | (Fallback / Offline)
+-----v----------------------+                             +------v----------------------+
|     MongoDB Atlas Cloud    |                             | In-Memory Document Store    |
|   (arts.12dxmg8.mongodb)   |                             | (Pre-seeded with 12 items & |
|  Mongoose Schema Models    |                             |  3 demo accounts)           |
+----------------------------+                             +-----------------------------+
```

---

## 2. Database Schema & Entity Relationship Diagram (ERD)

ArtLoop uses six core collections managed through Mongoose schemas (`server/models/schemas.ts`):

```
                   +------------------------+
                   |          User          |
                   +------------------------+
                   | _id: ObjectId          |
                   | id: String (indexed)   |
                   | name: String           |
                   | email: String (unique) |
                   | passwordHash: String   |
                   | location: String       |
                   | role: "user" | "admin" |
                   | isSuspended: Boolean   |
                   | createdAt: Date        |
                   +-----------+------------+
                               |
             +-----------------+-----------------+
             | 1:N (sellerId)                    | 1:N (participant)
             v                                   v
+-----------------------------+     +-------------------------------+
|           Product           |     |         Conversation          |
+-----------------------------+     +-------------------------------+
| _id: ObjectId               |     | _id: ObjectId                 |
| id: String (indexed)        |     | id: String (indexed)          |
| title: String               |     | productId: String             |
| description: String         |     | participantIds: [String]      |
| category: String            |     | updatedAt: Date               |
| condition: String           |     +---------------+---------------+
| price: Number               |                     |
| location: String            |                     | 1:N (conversationId)
| imageUrl: String            |                     v
| sellerId: String (FK)       |     +-------------------------------+
| sellerName: String          |     |            Message            |
| status: "available" |       |     +-------------------------------+
|         "reserved"  | "sold"|     | _id: ObjectId                 |
| createdAt: Date             |     | id: String (indexed)          |
+--------------+--------------+     | conversationId: String (FK)   |
               |                    | senderId: String (FK)         |
        +------+------+             | text: String                  |
        | 1:N         | 1:N         | createdAt: Date               |
        v             v             +-------------------------------+
+---------------+ +-----------------------------+
|  BuyRequest   | |         SwapRequest         |
+---------------+ +-----------------------------+
| id: String    | | id: String                  |
| productId: FK | | requestedProductId: FK      |
| buyerId: FK   | | offeredProductId: FK        |
| sellerId: FK  | | requesterId: FK             |
| message: Str  | | recipientId: FK             |
| status: Enum  | | message: String             |
| createdAt: Dt | | status: "pending" |         |
+---------------+ |         "accepted" |        |
                  |         "rejected" |        |
                  |         "completed" |       |
                  |         "cancelled"         |
                  | createdAt: Date             |
                  +-----------------------------+
```

---

## 3. Frontend Component Hierarchy

The application frontend is structured into modular components:

```
src/
├── App.tsx                     # Main layout shell, view state switching & modals
├── context/
│   └── AuthContext.tsx         # User authentication provider, token storage, demo switcher
├── components/
│   ├── Navbar.tsx              # Top bar, search bar, active links, quick demo account switcher
│   ├── Footer.tsx              # Platform footer, sustainability notice, copyright
│   ├── Marketplace.tsx         # Catalog grid, category pills, condition tags, price filter
│   ├── ProductCard.tsx         # Individual material card with status badge & quick action
│   ├── ProductDetailModal.tsx  # Full screen view, material specs, buy/swap/report triggers
│   ├── Dashboard.tsx           # Artist overview, incoming request alerts, metric cards
│   ├── SellModal.tsx           # New listing creation modal with live preview
│   ├── MyListings.tsx          # Inventory management, edit listing, toggle sold status
│   ├── RequestsManager.tsx     # Buy requests & Swap proposals (incoming vs outgoing tabs)
│   ├── SwapModal.tsx           # Item picker modal to propose one's own item in exchange
│   ├── ChatModal.tsx           # Persistent P2P chat dialog with auto-polling
│   ├── AdminPanel.tsx          # Admin statistics, user suspension table, report resolution
│   └── AuthModal.tsx           # Tabbed Login / Sign-up form with instant demo login buttons
└── utils/
    ├── rules.ts                # Pure business logic functions (testable without DOM)
    └── rules.test.ts           # 10 comprehensive unit tests using node:test
```

---

## 4. Key Workflows & State Machines

### 4.1 Buy Interest Workflow
```
[Buyer: Express Interest]
           |
           v
  Status: PENDING
      /         \
 [Seller]      [Buyer]
   /   \          \
Accept  Reject   Cancel
  |       |        |
  v       v        v
ACCEPTED REJECTED CANCELLED
  |
[Item Handoff Completed]
  |
  v
COMPLETED  ===> Product status automatically updated to SOLD
```

### 4.2 Item-for-Item Barter Swap Workflow
```
[Requester: Selects Own Available Listing]
           |
           v
  Status: PENDING
      /         \
 [Recipient]   [Requester]
   /   \          \
Accept  Reject   Cancel
  |       |        |
  v       v        v
ACCEPTED REJECTED CANCELLED
  |
[Physical Material Handoff Verified]
  |
  v
COMPLETED  ===> Both products automatically updated to SOLD
```

---

## 5. Security & Authentication Architecture

1. **Password Encryption:** All passwords undergo 10 rounds of salt hashing using `bcryptjs` before storage:
   ```typescript
   const salt = await bcrypt.genSalt(10);
   const passwordHash = await bcrypt.hash(password, salt);
   ```
2. **Session Integrity:** Tokens are issued upon login and validated through `requireAuth` middleware. If session cookies are blocked by cross-origin browser policies, the client transparently transmits the token via the `Authorization: Bearer <token>` header.
3. **Role Guards:** Administrative endpoints (`/api/admin/*`) require `req.user.role === 'admin'`. Non-admin attempts return `403 Forbidden`.
4. **Ownership Verification:** Users can only modify or delete listings where `product.sellerId === req.user.id`. The server strictly enforces this invariant.
5. **Sanitization:** String fields are trimmed and validated against allowed categories and positive prices.

---

## 6. Deployment Topology

- **Web Frontend:** Built with Vite (`npm run build`), producing static assets deployed to Vercel or served by Express.
- **API Server:** Express.js app running on Node.js runtime (Render / Container).
- **Persistent Storage:** MongoDB Atlas cloud cluster (`arts.12dxmg8.mongodb.net/artloop`) with TLS encryption.
- **Monitoring & Health:** Clean health check endpoint available at `/api/health`.
