# ArtLoop — Art Supply Exchange & Second-hand Material Marketplace
## Comprehensive Product Requirements Document (PRD)

> **Program:** Unified Mentor Full-Stack Web Development Internship  
> **Project Title:** ArtLoop — Art Supply Exchange & Second-hand Material Marketplace  
> **Tagline:** Create More. Waste Less.  
> **Status:** Production-Ready & Deployed  
> **Repository Type:** Full-Stack Web Application (Node.js + Express + React + MongoDB Atlas)  

---

## 1. Project Context & Background

Art students, hobbyists, and professionals frequently accumulate unused or lightly used art supplies such as paints, brushes, canvases, sketchbooks, easels, and sculpting tools. These materials are often abandoned after semester projects, coursework completion, or changing creative preferences.

At the same time, many learners and beginners face severe budget constraints and cannot afford expensive retail art supplies. Before ArtLoop, there was no dedicated, trustworthy platform focused on local exchange, barter, or affordable resale of art materials tailored for creative communities.

### Creative Ecosystem Inspiration
The project draws contextual inspiration from the creative educational ethos of leading visual arts institutions:
- **Lalit Kala Akademi:** Promotes visual arts and artist communities.
- **National Institute of Design (NID):** Supports design learning and accessible creative resources.
- **International Society of Education Through Art (InSEA):** Encourages arts education and international creative exchange.

*(Note: Mentioned for academic and domain context; ArtLoop is an independent student internship project developed under Unified Mentor).*

---

## 2. Problem Statement

Key challenges addressed by ArtLoop:
1. **High Cost of Art Supplies:** Professional-grade media (acrylics, oils, specialized brushes, heavy paper) impose heavy financial burdens on students and hobbyists.
2. **Material Wastage:** 60–80% of unused paints and specialty materials end up discarded or forgotten in studio drawers.
3. **Absence of Dedicated Exchange Platforms:** General classifieds (e.g., OLX) lack artistic taxonomy, condition indicators, and barter options.
4. **Difficulty Finding Affordable Second-Hand Materials:** Beginners have no central place to discover discounted supplies locally.
5. **Limited Local Connectivity Among Artists:** Students from neighboring colleges lack a safe, structured channel to trade supplies.

---

## 3. Primary & Secondary Objectives

### 3.1 Primary Objectives
- Create a dedicated, circular marketplace for second-hand art supplies.
- Enable direct peer-to-peer buying, selling, and item-for-item swapping.
- Promote studio affordability and environmental sustainability.
- Connect local student artists and learners within college clusters.
- Dramatically reduce creative material waste through reuse.

### 3.2 Secondary Objectives
- Encourage community engagement and peer collaboration among student creators.
- Support beginner artists with low-cost or free starter materials.
- Provide visibility and recovery of material investments to sellers.
- Promote eco-friendly, zero-waste studio habits.

---

## 4. Scope of the Product

### 4.1 In-Scope (Phase 1 — Implemented & Live)
- User registration, login, and profile management with location tagging.
- Art supply product listing module with category, condition, price, and image preview.
- Interactive buy/sell marketplace catalog with multi-criteria filtering and instant search.
- Item-for-item barter (swap) proposal workflow with side-by-side comparison.
- Location-based filtering (Bengaluru localities: Yelahanka, Rajanukunte, Central, etc.).
- Persistent buyer-seller chat and messaging module.
- Studio inventory manager ("My Listings") with status toggle (`available` / `sold`).
- Administrator panel for user management, listing moderation, and report resolution.
- Live MongoDB Atlas database integration.

### 4.2 Out-of-Scope (Phase 1 Constraints)
- Online payment gateway integration (avoiding transaction fees; exchanges happen via direct UPI / cash-on-collection).
- Third-party courier and logistics integration (handoffs are peer-to-peer on campus).
- Advanced AI/ML recommendation system.
- Native mobile application builds (iOS/Android native binaries).

---

## 5. Functional Requirements (7 Core Modules)

### 5.1 User Module
- **Registration & Login:** Full name, email, password (min 6 characters), and locality.
- **Password Security:** Salted and hashed using `bcryptjs` (10 rounds). Plaintext passwords never stored.
- **Session Persistence:** HTTP-only cookies with Bearer token header fallback.
- **Dashboard:** Real-time metrics showing active listings, incoming buy requests, and swap proposals.
- **Role Assignment:** Default `user` role with dedicated `admin` role for staff moderators.

### 5.2 Listing Module
- **Create Listing:** Title, detailed description, category selection, condition rating, price in ₹, campus locality, and image URL.
- **Live Preview:** Instant real-time card preview before submission.
- **Image Fallbacks:** Automatic CSS/SVG placeholders if image fails to load.
- **Availability Management:** Quick toggling between `available`, `reserved`, and `sold`.
- **Edit & Delete:** Full CRUD operations protected by ownership verification (`sellerId === req.user.id`).

### 5.3 Marketplace Module
- **Responsive Product Grid:** Cards displaying title, price, condition badge, category chip, seller locality, and availability.
- **Product Detail View:** Detailed material specifications, seller profile, and action triggers.
- **Contextual Actions:** "Express Buy", "Request Swap", "Contact Seller", and "Report Listing". Self-buying and self-swapping are strictly prevented.

### 5.4 Swap Request Module (Item-for-Item Barter)
- **Propose Swap:** Requester selects an active item from their own inventory to offer in trade.
- **Side-by-Side Review:** Recipient evaluates the requested item alongside the offered item.
- **Status Lifecycle:** `pending` → `accepted` or `rejected` / `cancelled` → `completed`.
- **Completion Effect:** Completing a swap automatically sets both involved products to `sold`.

### 5.5 Chat & Communication Module
- **Direct P2P Threads:** In-app conversation threads linked directly to products and transactions.
- **Negotiation:** Coordinate campus meeting points (e.g., "Main Library gate, 3 PM") and verify supplies.
- **History & Polling:** Messages stored in database with automatic polling during active conversations.

### 5.6 Search & Filter Module
- **Text Search:** Real-time query search across titles, descriptions, and categories.
- **Recent Searches:** Cached in `sessionStorage` (`artloop_recent_searches`) with quick re-query chips and dismissal.
- **Category Filter:** 7 categories (Paints & Colours, Brushes & Tools, Canvases & Boards, Sketchbooks & Paper, Drawing & Sculpting, Easels & Accessories, Free Supplies).
- **Condition Filter:** 4 states (New/Unopened, Like New, Good, Fair/Well-Used).
- **Price Range & Sorting:** Min/Max bounds, Free items (₹0), Newest, Price: Low-to-High, Price: High-to-Low.

### 5.7 Admin Module
- **Overview Metrics:** Total users, total active listings, completed swaps, pending requests, flagged reports.
- **User Management:** Table of registered users with one-click account suspension toggle.
- **Listing Moderation:** Review and delete non-compliant or inappropriate listings.
- **Dispute & Report Resolution:** Review user-submitted flags with reporter notes, resolve or dismiss.

---

## 6. Non-Functional Requirements

| Dimension | Specification | Implementation in ArtLoop |
|---|---|---|
| **Security** | OWASP principles, encrypted passwords, authorization guards | `bcryptjs` hashing, `requireAuth` and `requireAdmin` middlewares, ownership validation on all mutations. |
| **Usability** | Intuitive, beginner-friendly UI with zero cognitive load | Warm terracotta artistic palette (`#C85A32`), clear visual hierarchy, Lucide iconography, zero complex setups. |
| **Accessibility** | Mobile-responsive, high contrast, semantic HTML | Responsive Tailwind breakpoints (`sm`, `md`, `lg`), accessible buttons, keyboard navigability. |
| **Performance** | Sub-second page loads, lightweight bundle | Vite development/build pipeline, zero heavy external state management libraries, fast JSON REST endpoints. |
| **Data Integrity** | Structured schemas, unique constraints, referential checks | Mongoose schemas with indexed IDs, unique email index, status transition rules. |
| **Scalability** | Cloud-native database, stateless Express handlers | MongoDB Atlas connection with connection pooling and in-memory document fallback. |

---

## 7. Technology Stack

- **Frontend:** React 19, JavaScript/TypeScript, Tailwind CSS 4, Lucide React Icons.
- **Backend:** Node.js, Express.js (REST API architecture).
- **Database:** MongoDB Atlas (Cloud Cluster: `arts.12dxmg8.mongodb.net/artloop`) with Mongoose ODM.
- **Testing:** Node.js native test runner (`node:test`) with TypeScript execution (`tsx`).
- **Deployment:** Live on Google Cloud Run container environment (Dev & Preview URLs), fully compatible with Vercel (Frontend) and Render (Backend).

---

## 8. High-Level User Flows

### 8.1 Buyer Flow
```
Register / Login -> Browse Marketplace -> Filter by Category / Price / Location
      -> Open Product Details -> Inspect Material Specs & Condition
      -> Click [Express Buy] -> Specify Campus Meeting Point
      -> Seller Accepts -> Open Chat to Finalize Handoff
      -> Cash-on-Collection / Direct UPI -> Transaction Marked Completed
```

### 8.2 Seller Flow
```
Register / Login -> Click [List an Item] -> Fill Title, Category, Condition, Price, Photo
      -> Inspect Live Preview Card -> Submit Listing (Persisted in MongoDB Atlas)
      -> Manage Inventory in [My Listings] -> Receive Incoming Buy / Swap Requests
      -> Accept or Negotiate via Chat -> Complete Handoff -> Mark Item Sold
```

### 8.3 Admin Flow
```
Login as Admin -> Navigate to [Admin Panel] -> Review Platform Metrics
      -> Inspect Flagged Reports -> Review & Moderate Suspicious Listings
      -> Suspend Violating User Accounts -> Resolve Inquiries
```

---

## 9. Key Performance Indicators (KPIs)

- **Number of Listings Created:** Target: 10+ diverse supplies per campus cluster.
- **Number of Transactions (Buy + Swap):** Tracks circular economy material flow.
- **User Engagement Rate:** Ratio of active swappers/buyers to registered users.
- **Active Community Count:** Active users interacting within 30 days.
- **Listing Conversion Rate:** Percentage of listings transitioning from `available` to `sold`.

---

## 10. Live Deployed Deliverables & Links

- **Live Development App URL:**  
  `https://ais-dev-5tf37cxqz5ezb4ucj77ky2-558421851409.asia-east1.run.app`
- **Live Shared / Production App URL:**  
  `https://ais-pre-5tf37cxqz5ezb4ucj77ky2-558421851409.asia-east1.run.app`
- **Cloud Database:** MongoDB Atlas (`arts.12dxmg8.mongodb.net/artloop`)
- **Automated Tests:** 10 / 10 Passing (`npm test`)

---

## 11. Future Enhancements (Phase 2 Roadmap)
- Integrated online payment escrow (Razorpay / UPI Intent SDK).
- Campus-specific student ID email verification (`.edu` / `.ac.in`).
- Student courier partner delivery for inter-city swaps.
- Star rating and peer review system for verified sellers and swappers.
- PWA (Progressive Web App) offline caching and mobile home-screen installability.
