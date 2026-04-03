# BazzarNet API (Backend)

## Overview

This is the backend service for **BazzarNet**, a local e-commerce platform connecting customers, vendors, and administrators.

It provides a secure and scalable REST API built with Node.js and Express, handling authentication, product management, orders, payments, and user roles.

---

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT (JSON Web Tokens)
* **Validation:** Joi
* **File Uploads:** Multer
* **Email Service:** Nodemailer
* **Testing:** Jest + Supertest
* **Security:**

  * express-mongo-sanitize
  * xss-clean
  * express-rate-limit

---

## Features

### Authentication & Users

* JWT-based authentication
* Role-based access (Customer, Vendor, Admin)
* Secure password handling
* Profile management

### Products & Stores

* CRUD operations for products
* Store creation & management
* Image uploads for products and store logos

### Orders & Payments

* Cart management
* Order placement with stock validation
* Payment tracking (UPI mock support)
* Delivery confirmation via OTP

### Admin Controls

* Manage users and vendors
* Control products and stores
* Monitor orders and refunds
* Platform analytics

### Additional

* Coupon system
* Email notifications
* Input validation (Joi)
* Rate limiting & security middleware

---

## Project Structure

```bash
backend/
├── config/         # DB & environment configs
├── controllers/    # Business logic
├── middleware/     # Auth, error handling, validation
├── models/         # Mongoose schemas
├── routes/         # API routes
├── services/       # Email & external services
├── validators/     # Joi schemas
├── utils/          # Helper functions
├── tests/          # Unit & integration tests
├── uploads/        # Local file storage
├── server.js       # Entry point
└── package.json
```

---

## Environment Variables

Create a `.env` file inside `backend/`:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h

EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password

FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
```

---

## Installation & Setup

```bash
# clone repo
git clone <your-backend-repo-url>
cd backend

# install dependencies
npm install
```

---

## Run the Server

```bash
# development
npm run dev

# production
npm start
```

Server runs on:

```
http://localhost:5000
```

---

## API Base URL

```
http://localhost:5000/api
```

---

## Testing

```bash
npm test
```

Runs unit and integration tests using Jest and Supertest.

---

## Key Workflows

### Order Flow

1. Add items to cart
2. Apply coupon
3. Place order
4. Backend validates stock
5. Creates order + payment record
6. Generates delivery OTP
7. Sends confirmation email

### Vendor Flow

* Manage products
* View orders
* Confirm delivery via OTP

### Admin Flow

* Manage users, stores, products
* Monitor platform activity

---

## Security Practices

* Input sanitization against NoSQL injection
* XSS protection
* Rate limiting for APIs
* JWT authentication with expiry
* Structured error handling

---

## Deployment Notes

* Can be deployed on:

  * Render
  * Railway
  * VPS (Ubuntu + PM2)
* Use environment variables for all secrets
* Recommended: use cloud storage (Cloudinary/S3) instead of local uploads in production

---




