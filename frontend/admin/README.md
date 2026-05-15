# See Mee - Admin Panel

Separate admin panel application running on port 3001.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run Admin Panel
```bash
npm run dev
```

Admin panel will be available at: **http://localhost:3001**

## 🔐 Login

**URL:** http://localhost:3001/login

**Credentials:**
- Email: `admin@seemee.com`
- Password: `admin123`

## 📊 Features

- Dashboard with statistics
- New Arrivals management
- Products management (up to 10 images + 1 video)
- Orders management with status tracking
- Cloudinary integration for image/video hosting

## 🔗 Backend Connection

Admin panel connects to backend API at: **http://localhost:5000**

Make sure the backend server is running before using the admin panel.

## 📁 Structure

```
admin/
├── src/
│   ├── components/          # Admin components
│   │   ├── NewArrivalsManager.jsx
│   │   ├── ProductsManager.jsx
│   │   └── OrdersManager.jsx
│   ├── pages/               # Admin pages
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Separate from Customer Site

- **Customer Site:** http://localhost:3000
- **Admin Panel:** http://localhost:3001
- **Backend API:** http://localhost:5000

The admin panel is completely separate from the customer-facing website.
