# WMS Pro — Warehouse Management System

A complete, production-ready Warehouse Management System built with React, Node.js/Express, and MongoDB.

---

## Features

### Core Modules
| Module | Features |
|---|---|
| **Authentication** | JWT login/logout, role-based access (Admin / Manager / Staff), password change |
| **Dashboard** | Live KPIs, stock movement charts, order status doughnut, low-stock alerts, recent activity feed |
| **Inventory** | Full CRUD, SKU/barcode tracking, category filter, quantity adjustments with audit trail, low-stock filter |
| **Orders** | Create inbound/outbound/transfer/return orders, status workflow engine, stock auto-update on delivery/ship |
| **Operations** | Full goods-in/out/transfer/adjustment log with reference numbers |
| **Warehouses** | Multi-warehouse support, zone management, capacity tracking |
| **Locations** | Zone → Aisle → Rack → Shelf → Bin hierarchy, capacity visualization |
| **Reports** | Inventory, orders, movements reports; CSV export; analytics charts (top movers, category breakdown) |
| **Users** | Full CRUD user management (admin only), role assignment, activity tracking |
| **Notifications** | In-app notification panel with unread count, mark-as-read |
| **Profile** | Password change, role/permissions view |

### Tech Stack
- **Frontend**: React 18, Tailwind CSS 3, React Router v6, Chart.js, Heroicons, React Hot Toast
- **Backend**: Node.js 18+, Express 4, MongoDB 6+, Mongoose 8, JWT, Helmet, Morgan
- **Fonts**: Sora (display), DM Sans (body), JetBrains Mono (code)

---

## Prerequisites

- **Node.js** v18 or higher — https://nodejs.org
- **MongoDB** v6 or higher (local or Atlas) — https://www.mongodb.com
- **npm** v9 or higher (comes with Node.js)

---

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm install
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example env file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wms
JWT_SECRET=your_super_secret_key_min_32_characters_long
CLIENT_URL=http://localhost:3000
```

> **MongoDB Atlas** users: replace `MONGODB_URI` with your Atlas connection string.

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 4 users (admin, manager, 2 staff)
- 2 warehouses with zones
- 72 storage locations (Zone A-D)
- 44 products across 6 categories with realistic data
- 50 orders of all types/statuses
- 100 stock movement operations

### 4. Start the Application

```bash
# Start both backend + frontend concurrently (development)
npm run dev
```

Or start separately:
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open: **http://localhost:3000**

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@wms.com | admin123 |
| Manager | manager@wms.com | manager123 |
| Staff | staff@wms.com | staff123 |

---

## Project Structure

```
wms/
├── backend/
│   ├── models/
│   │   ├── User.js               # User with roles & permissions
│   │   ├── Product.js            # Inventory with SKU, barcode, stock levels
│   │   ├── Order.js              # Orders with status workflow
│   │   └── index.js              # Warehouse, Location, Operation, Notification, AuditLog
│   ├── routes/
│   │   ├── auth.js               # Login, register, me, change-password
│   │   ├── products.js           # Full CRUD + quantity adjustments
│   │   ├── orders.js             # Full CRUD + status updates + stock sync
│   │   ├── warehouse.js          # Warehouse CRUD
│   │   ├── locations.js          # Location CRUD
│   │   ├── operations.js         # Movement log + transfers
│   │   ├── reports.js            # Inventory/orders/movements reports + CSV export
│   │   ├── dashboard.js          # Aggregated KPIs and chart data
│   │   ├── notifications.js      # Notification CRUD
│   │   └── users.js              # User management (admin)
│   ├── middleware/
│   │   └── auth.js               # JWT auth, role authorization, permission check, audit log
│   ├── server.js                 # Express app with all middleware
│   ├── seed.js                   # Database seeder
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js    # JWT auth state, login/logout
│   │   │   └── ThemeContext.js   # Dark/light mode
│   │   ├── utils/
│   │   │   └── api.js            # Axios instance + all API modules + helpers
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Layout.js           # Sidebar, header, mobile nav
│   │   │       └── NotificationPanel.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js  # Charts, KPIs, alerts
│   │   │   ├── InventoryPage.js  # Products CRUD + filters + qty adjust
│   │   │   ├── OrdersPage.js     # Orders CRUD + status workflow
│   │   │   ├── WarehousePage.js  # Warehouse management
│   │   │   ├── LocationsPage.js  # Location hierarchy
│   │   │   ├── OperationsPage.js # Movement log
│   │   │   ├── ReportsPage.js    # Analytics + CSV export
│   │   │   ├── UsersPage.js      # User management
│   │   │   └── ProfilePage.js    # Account settings
│   │   ├── App.js                # Routing + providers
│   │   ├── index.js
│   │   └── index.css             # Tailwind + global component classes
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── package.json                  # Root scripts (concurrently)
├── .gitignore
└── README.md
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/register | Register new user |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Logout |
| PUT | /api/auth/change-password | Change password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products (paginated, filterable) |
| GET | /api/products/low-stock | Get low stock items |
| GET | /api/products/categories | Get all categories |
| GET | /api/products/:id | Get single product |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| PATCH | /api/products/:id/quantity | Adjust stock quantity |
| DELETE | /api/products/:id | Soft-delete product |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | List orders (paginated, filterable) |
| GET | /api/orders/stats | Order statistics |
| GET | /api/orders/:id | Get order detail |
| POST | /api/orders | Create order |
| PUT | /api/orders/:id | Update order |
| PATCH | /api/orders/:id/status | Update status (auto-syncs stock) |
| DELETE | /api/orders/:id | Cancel order |

### Reports (with CSV export)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/inventory | Inventory report (?format=csv) |
| GET | /api/reports/orders | Orders report (?format=csv) |
| GET | /api/reports/movements | Stock movements (?format=csv) |
| GET | /api/reports/analytics | Full analytics aggregation |

---

## Role Permissions

| Feature | Admin | Manager | Staff |
|---------|-------|---------|-------|
| View all modules | ✅ | ✅ | ✅ |
| Create/Edit products | ✅ | ✅ | ❌ |
| Delete products | ✅ | ❌ | ❌ |
| Adjust quantities | ✅ | ✅ | ✅ |
| Create/manage orders | ✅ | ✅ | ✅ |
| Manage warehouses | ✅ | ✅ | ❌ |
| Manage locations | ✅ | ✅ | ❌ |
| View reports + export | ✅ | ✅ | ❌ |
| Manage users | ✅ | View only | ❌ |

---

## Production Deployment

### Backend (Node.js server)

1. Set `NODE_ENV=production` in your environment
2. Set a strong `JWT_SECRET` (min 32 chars, random)
3. Use MongoDB Atlas for the database
4. Deploy to: **Railway**, **Render**, **Heroku**, **AWS EC2/ECS**, or **DigitalOcean App Platform**

```bash
# Build and start
npm start --prefix backend
```

### Frontend (React SPA)

```bash
cd frontend && npm run build
```

Deploy the `frontend/build/` folder to:
- **Vercel** (recommended — zero config)
- **Netlify**
- **AWS S3 + CloudFront**
- Or serve statically from the Express backend

### Serve Frontend from Express (unified deployment)

Add to `backend/server.js`:

```js
const path = require('path');
// After all API routes:
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
```

Then set `REACT_APP_API_URL=https://your-domain.com/api` in the frontend build.

---

## Environment Variables Reference

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default 5000) | Server port |
| `NODE_ENV` | No (default development) | Environment |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs |
| `CLIENT_URL` | No (default *) | Allowed CORS origin |

### Frontend
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL (default: `/api` via proxy) |

---

## License

MIT — Free to use, modify, and deploy for personal and commercial projects.
