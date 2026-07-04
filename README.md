# AcademiaHub - Platform Overview

AcademiaHub is a comprehensive peer-to-peer marketplace designed specifically for university students. It empowers students to buy, sell, and share academic resources like lecture notes, study guides, and past exams.

## 🚀 Core Features

### 1. Dual-Sided Marketplace
* **Buyers:** Students can search for study materials by keyword, department, or trending status. They can preview files, read reviews, and purchase notes securely.
* **Sellers (Creators):** Any student can become a seller. They get a dedicated dashboard to upload notes in PDF format, set prices (or offer them for free), and track their sales analytics and earnings.

### 2. E-Commerce & Payments
* **Shopping Cart & Wishlist:** Users can add multiple resources to their cart for bulk checkout or save them for later in their wishlist.
* **Payment Gateway Integration:** Secure payment processing handled via **Razorpay**, allowing seamless transactions using credit cards, UPI, or net banking.
* **Seller Payouts:** Sellers accumulate earnings and can connect their bank accounts to request manual or automated payouts.

### 3. Advanced Authentication
* **Role-Based Access Control:** Distinct roles for `buyer`, `seller`, and `admin` to ensure users only access what they are authorized to see.
* **Academic Verification:** During sign-up, the platform captures the user's specific college, current year, and academic batch to personalize the experience.
* **OTP Email Verification:** Enhances security by requiring email verification before account activation.
* **JWT Sessions:** Stateless and secure session management using Access and Refresh tokens.

### 4. Interactive Community Features
* **Ratings & Reviews:** Buyers can leave star ratings and written feedback on purchased notes. Other users can upvote helpful reviews.
* **File Previews:** Buyers can view a limited preview of the document (watermarked or snippet) before committing to a purchase.
* **Notifications System:** Real-time inbox for users to receive alerts about successful purchases, sales, and platform updates.

---

## 🛠️ Technology Stack

The platform is built using a modern, scalable web architecture:

### Frontend (Client-Side)
* **HTML5 & CSS3:** Semantic HTML structured with modern CSS layouts.
* **Vanilla JavaScript:** Fast, dependency-free DOM manipulation and API integration.
* **Dynamic Routing:** Single-page-like tab switching and responsive dashboard layouts without heavy frameworks.

### Backend (Server-Side)
* **Node.js & Express.js:** A robust and lightweight backend framework handling all API routes, business logic, and middleware (authentication, role checking, file parsing).

### Database & Storage (Supabase)
* **PostgreSQL (via Supabase):** A highly relational, enterprise-grade database managing users, notes, purchases, and relationships.
* **Supabase Storage:** Handles the secure uploading and hosting of all PDF files and cover images.

### Third-Party Services
* **Razorpay API:** Processes all financial transactions.
* **Nodemailer / Email Services:** Handles the dispatching of OTPs and transactional emails.

---

## 📂 Architecture & API Structure

The backend is cleanly separated into specialized micro-routes under `/api/v1`:

* `/auth` - Handles registration, login, OTP verification, and profile management.
* `/notes` - Core CRUD operations for notes, search functionality, and secure file downloads.
* `/seller` - Dashboard metrics, analytics graphs, and payout requests.
* `/purchases` - Cart logic, Razorpay checkout flow, and library access.
* `/reviews` - Note feedback and ratings.
* `/notifications` - Inbox and read/unread status tracking.
* `/admin` - Platform moderation and global analytics.

---

## 🎯 Launch Readiness
The platform is currently optimized for rapid deployment. By utilizing Supabase as a Backend-as-a-Service (BaaS) for the database and storage, the application avoids the complexity of manual database scaling and AWS S3 configuration, making it highly cost-effective and ready for immediate production launch.
