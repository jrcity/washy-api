# 🧺 Washy API

> Multi-branch laundry management system with real-time order tracking, payment processing, and delivery management.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-9.x-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🔐 **JWT Authentication** - Secure role-based access control with 6 user roles
- 📦 **Order Management** - Complete order lifecycle from booking to delivery
- 💳 **Paystack Integration** - Card, bank transfer, USSD, and cash payments
- 🚚 **Rider Management** - Real-time rider assignment and delivery tracking
- 🏢 **Multi-Branch Support** - Manage multiple branches with coverage zones
- 📱 **Push Notifications** - Real-time order status updates
- 📊 **Analytics & Reports** - Branch performance and order statistics
- 📖 **Swagger Documentation** - Interactive API documentation

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.9 |
| Framework | Express 5.x |
| Database | MongoDB (Mongoose 9.x) |
| Authentication | JWT (jsonwebtoken) |
| Validation | Zod |
| Payments | Paystack |
| Documentation | Swagger/OpenAPI 3.0 |

## 📁 Project Structure

```
src/
├── config/          # Database & Swagger configuration
├── constants/       # Enums, configs, HTTP status codes
├── controllers/     # Route handlers
├── middlewares/     # Auth, validation, error handling
├── models/          # Mongoose schemas & models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Helper functions
├── validations/     # Zod validation schemas
├── app.ts           # Express app setup
├── server.ts        # Server entry point
└── seed.ts          # Database seeder
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas)
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd washy-api
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # MongoDB
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/washy
   
   # JWT
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRES_IN=7d
   
   # Paystack
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   
   # CORS
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Seed the database** (optional)
   ```bash
   pnpm seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm seed` | Seed database with test data |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |

## 📖 API Documentation

Once the server is running, access the interactive documentation:

| URL | Description |
|-----|-------------|
| [`/api/v1/docs`](http://localhost:3000/api/v1/docs) | Swagger UI (Interactive) |
| [`/api/v1/docs.json`](http://localhost:3000/api/v1/docs.json) | OpenAPI JSON spec |
| [`/api/v1/health`](http://localhost:3000/api/v1/health) | Health check endpoint |

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new customer |
| POST | `/api/v1/auth/login` | Login and get JWT token |
| GET | `/api/v1/auth/profile` | Get current user profile |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create new order |
| GET | `/api/v1/orders` | Get all orders (Admin) |
| GET | `/api/v1/orders/my-orders` | Get customer's orders |
| GET | `/api/v1/orders/:id` | Get order by ID |
| PATCH | `/api/v1/orders/:id/status` | Update order status |
| POST | `/api/v1/orders/:id/assign-rider` | Assign rider |
| POST | `/api/v1/orders/:id/generate-otp` | Generate delivery OTP |
| POST | `/api/v1/orders/:id/verify-delivery` | Verify delivery |
| POST | `/api/v1/orders/:id/rate` | Rate order |
| POST | `/api/v1/orders/:id/cancel` | Cancel order |
| GET | `/api/v1/orders/stats/overview` | Order statistics |

### Branches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/branches` | Get all branches |
| GET | `/api/v1/branches/find-by-zone` | Find branch by coverage zone |
| GET | `/api/v1/branches/:id` | Get branch by ID |
| POST | `/api/v1/branches` | Create branch (Admin) |
| PATCH | `/api/v1/branches/:id` | Update branch |
| DELETE | `/api/v1/branches/:id` | Delete branch (Super Admin) |
| POST | `/api/v1/branches/:id/assign-manager` | Assign manager |
| POST | `/api/v1/branches/:id/assign-staff` | Assign staff |
| POST | `/api/v1/branches/:id/coverage-zones` | Add coverage zones |
| GET | `/api/v1/branches/:id/stats` | Get branch stats |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/services` | Get all services |
| GET | `/api/v1/services/catalog` | Get price catalog |
| GET | `/api/v1/services/active` | Get active services |
| GET | `/api/v1/services/slug/:slug` | Get service by slug |
| GET | `/api/v1/services/:id` | Get service by ID |
| POST | `/api/v1/services` | Create service |
| PATCH | `/api/v1/services/:id` | Update service |
| PATCH | `/api/v1/services/:id/pricing` | Update pricing |
| DELETE | `/api/v1/services/:id` | Delete service |
| POST | `/api/v1/services/calculate-price` | Calculate price |
| POST | `/api/v1/services/seed` | Seed default services |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/initialize` | Initialize payment |
| GET | `/api/v1/payments/verify/:reference` | Verify payment |
| POST | `/api/v1/payments/webhook` | Paystack webhook |
| GET | `/api/v1/payments` | Get all payments (Admin) |
| GET | `/api/v1/payments/:id` | Get payment by ID |
| POST | `/api/v1/payments/cash` | Record cash payment |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | Get notifications |
| GET | `/api/v1/notifications/unread-count` | Get unread count |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read |
| PATCH | `/api/v1/notifications/read-all` | Mark all as read |

## 👥 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `customer` | Regular customers | Place orders, view own orders, rate |
| `rider` | Delivery personnel | View assigned orders, update delivery status |
| `staff` | Branch staff | Manage orders, update statuses |
| `branch_manager` | Branch managers | Full branch control, reports, staff management |
| `admin` | Administrators | System-wide management |
| `super_admin` | Super administrators | Full system access, delete operations |

## 🧪 Test Credentials

After running the seeder (`pnpm seed`), use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@washy.com.ng` | `SuperAdmin@123` |
| Admin | `admin@washy.com.ng` | `Admin@123456` |
| Branch Manager | `manager@washy.com.ng` | `Manager@123` |
| Staff | `staff@washy.com.ng` | `Staff@12345` |
| Rider | `rider@washy.com.ng` | `Rider@12345` |
| Customer | `customer@example.com` | `Customer@123` |

## 📊 Order Status Flow

```
PENDING → CONFIRMED → PICKED_UP → IN_PROCESS → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
                                                                                    ↓
                                                            (at any point) → CANCELLED
```

| Status | Description |
|--------|-------------|
| `pending` | Initial booking state |
| `confirmed` | Order confirmed, awaiting pickup |
| `picked_up` | Rider has collected items |
| `in_process` | Items at branch, being cleaned |
| `ready` | Ready for delivery |
| `out_for_delivery` | Rider en route to customer |
| `delivered` | Successfully delivered |
| `completed` | Payment confirmed, order closed |
| `cancelled` | Order cancelled |

## 💳 Payment Methods

| Method | Description |
|--------|-------------|
| `card` | Paystack card payment |
| `bank_transfer` | Paystack bank transfer |
| `ussd` | Paystack USSD payment |
| `cash` | Cash on delivery (recorded by staff) |

## 🛡️ Security Features

- JWT-based authentication with configurable expiration
- Role-based access control (RBAC)
- Permission-based route protection
- Request validation using Zod
- Helmet for HTTP security headers
- CORS configuration
- Rate limiting ready (proxy-aware)

## 🏢 Multi-Branch Features

- **Coverage Zones**: Define service areas for each branch
- **Zone-Based Routing**: Automatically find branches serving customer locations
- **Branch Metrics**: Track orders, revenue, and performance per branch
- **Staff Assignment**: Assign staff and riders to specific branches
- **Operating Hours**: Configure branch-specific schedules

## 📱 Service Categories

| Category | Description |
|----------|-------------|
| `laundry` | Standard laundry services |
| `dry_cleaning` | Dry cleaning services |
| `alteration` | Clothing alterations |
| `shoe_care` | Shoe cleaning and care |
| `household` | Household items (curtains, bedding) |
| `graphics_design` | Future: Graphics design services |

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URL` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | No (default: 7d) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Yes |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | Yes |
| `CORS_ORIGINS` | Comma-separated allowed origins | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Redemption Jonathan**

---

<p align="center">
  Made with ❤️ for the Nigerian laundry industry
</p>
