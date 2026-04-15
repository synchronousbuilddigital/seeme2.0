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
ADMIN_EMAIL=admin@seemee.com
ADMIN_PASSWORD=admin123
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
- Email: admin@seemee.com
- Password: admin123

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
