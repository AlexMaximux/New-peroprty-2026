# 🏡 New Property 2026

**A modern, full-stack property marketplace platform for buying, selling, and renting real estate.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-blue.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

---

## 📌 **Table of Contents**
- [🚀 Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🏗 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
- [🔧 Configuration](#-configuration)
- [📜 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [📧 Contact](#-contact)

---

## 🚀 **Features**
✅ **Multi-Role Platform**: Separate dashboards for **Agencies**, **Investors**, and **Admin**.
✅ **Property Listings**: Create, edit, and manage property listings with rich details (images, videos, 3D tours).
✅ **Advanced Search & Filters**: Filter by location, price, type (HMO, R2R, SA), bedrooms, etc.
✅ **Geocoding Integration**: Auto-fill addresses and validate locations.
✅ **Favorites & Watchlist**: Users can save properties and track market changes.
✅ **Messaging System**: Secure in-app messaging between agencies and investors.
✅ **Admin Panel**: Manage users, agencies, listings, and audit logs.
✅ **Onboarding Workflow**: Guided setup for new agencies.
✅ **HMO & R2R Calculators**: Built-in tools for rental yield and profitability analysis.
✅ **Responsive Design**: Works on desktop, tablet, and mobile.

---

## 🛠 **Tech Stack**
| Layer          | Technologies                                                                 |
|----------------|------------------------------------------------------------------------------|
| **Frontend**   | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, ShadCN UI          |
| **Backend**    | NestJS, Node.js, Express, RESTful APIs                                       |
| **Database**   | PostgreSQL (Prisma ORM), Redis (caching)                                    |
| **Auth**       | JWT, Passport.js, BCrypt                                                     |
| **Storage**    | AWS S3 (for images/videos), Cloudinary (alternative)                         |
| **Maps**       | Google Maps API, Mapbox                                                     |
| **DevOps**     | Docker, GitHub Actions (CI/CD), Vercel (frontend), Railway (backend)         |
| **Testing**    | Jest, React Testing Library, Playwright (E2E)                                |

---

## 📂 **Project Structure**
```
new-property-2026/
├── apps/
│   ├── api/               # NestJS Backend
│   │   ├── src/
│   │   │   ├── admin/      # Admin controllers/services
│   │   │   ├── agency/     # Agency-related logic
│   │   │   ├── auth/       # Authentication
│   │   │   ├── listing/    # Property listings
│   │   │   ├── messaging/  # In-app messaging
│   │   │   └── ...
│   │   └── prisma/         # Prisma schema & migrations
│   └── web/               # Next.js Frontend
│       ├── app/           # App Router pages
│       ├── components/    # Reusable UI components
│       └── public/        # Static assets
├── packages/             # Shared utilities (if any)
├── docker-compose.yml    # Docker setup
└── README.md             # This file
```

---

## 🏗 **Getting Started**

### **Prerequisites**
- Node.js **18+** (LTS recommended)
- npm **9+** or yarn **1.22+**
- PostgreSQL **15+**
- Docker (optional, for containerized setup)
- Git

### **Installation**
1. **Clone the repository**:
   ```bash
   git clone https://github.com/AlexMaximux/New-peroprty-2026.git
   cd New-peroprty-2026
   ```

2. **Install dependencies** (monorepo setup):
   ```bash
   npm install
   # or
   yarn install
   ```

### **Environment Variables**
Create a `.env` file in **both** `apps/api` and `apps/web` based on the examples below.

#### **Backend (`apps/api/.env`)**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/new_property_2026?schema=public"

# JWT
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="1d"

# Geocoding (Google Maps)
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="new-property-2026"
```

#### **Frontend (`apps/web/.env`)**
```env
# API Base URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Auth
NEXT_PUBLIC_JWT_SECRET="your_jwt_secret_key"
```

### **Running the Project**
1. **Start the database** (if using Docker):
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations** (from `apps/api`):
   ```bash
   npx prisma migrate dev
   ```

3. **Start the backend** (from `apps/api`):
   ```bash
   npm run start:dev
   ```
   - Runs on `http://localhost:3001`

4. **Start the frontend** (from `apps/web`):
   ```bash
   npm run dev
   ```
   - Runs on `http://localhost:3000`

5. **Seed the database** (optional):
   ```bash
   npx prisma db seed
   ```

---

## 🔧 **Configuration**
| Setting               | Description                                  | Default Value          |
|-----------------------|----------------------------------------------|------------------------|
| `NODE_ENV`            | Environment mode (`development`, `production`) | `development`         |
| `PORT` (Backend)      | Backend server port                         | `3001`                |
| `PORT` (Frontend)     | Frontend server port                        | `3000`                |
| `DATABASE_URL`        | PostgreSQL connection string                 | (Required)            |
| `JWT_SECRET`          | Secret key for JWT tokens                    | (Required)            |

---

## 📜 **API Documentation**
The backend API is built with **NestJS** and follows RESTful conventions. Key endpoints:

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| POST   | `/api/auth/register`         | Register a new user                  |
| POST   | `/api/auth/login`            | Login and get JWT token              |
| GET    | `/api/listings`              | Get all property listings            |
| POST   | `/api/listings`              | Create a new listing (Agency only)   |
| GET    | `/api/listings/:id`          | Get a single listing                 |
| PUT    | `/api/listings/:id`          | Update a listing                     |
| DELETE | `/api/listings/:id`          | Delete a listing                     |
| GET    | `/api/agency/listings`       | Get listings for an agency           |
| POST   | `/api/messages`              | Send a message                       |
| GET    | `/api/admin/users`           | Admin: List all users                |

**Full API docs**: [Postman Collection](https://www.postman.com/) (Add link if available)

---

## 🤝 **Contributing**
We welcome contributions! Follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a **Pull Request** on GitHub.

### **Contribution Guidelines**
- Follow the existing code style (ESLint, Prettier).
- Write tests for new features.
- Update documentation as needed.

---

## 📜 **License**
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 📧 **Contact**
For questions or support, reach out to:
- **Email**: [alex.maxim@example.com](mailto:alex.maxim@example.com)
- **GitHub**: [@AlexMaximux](https://github.com/AlexMaximux)
- **Project Link**: [https://github.com/AlexMaximux/New-peroprty-2026](https://github.com/AlexMaximux/New-peroprty-2026)

---
**© 2026 New Property 2026. All rights reserved.**