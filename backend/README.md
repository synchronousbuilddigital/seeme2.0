# See Mee Backend Server

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```
PORT=5000
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_secret_key_here
NODE_ENV=development
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password
```

3. **Create admin user:**
```bash
node scripts/createAdmin.js
```

4. **Start server:**
```bash
npm run dev
```

## Admin Panel Access
- URL: http://localhost:3000/admin/login
- Email: Set via `ADMIN_EMAIL` in `.env`
- Password: Set via `ADMIN_PASSWORD` in `.env`

## Features
✅ Product Management (CRUD)
✅ Order Management
✅ New Arrivals Management
✅ File Upload (Images & Videos)
✅ Stock Tracking
✅ JWT Authentication
✅ Role-based Access Control

## API Documentation
See BACKEND-SETUP.md for complete API documentation.
