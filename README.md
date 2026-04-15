# See Mee - Ethnic Fashion E-commerce Platform

A complete full-stack e-commerce platform for women's ethnic suits with warm retro beach aesthetics, featuring a powerful admin panel and shopping cart functionality.

## ✨ Features

### Customer Features
- 🎨 Warm retro color palette (Orange #F96635, Coral, Peach, Warm Yellow)
- ✨ Smooth animations with Framer Motion
- 📱 Fully responsive design
- 🛍️ Shopping cart with localStorage persistence
- 🖼️ Dynamic new arrivals from database
- 💫 Organic blob shapes with morphing animations
- 🎯 Category browsing (Anarkali, Palazzo, Straight Cut, Sharara)
- 📜 Transparent navbar that shrinks on scroll

### Admin Features
- 🔐 Secure JWT authentication
- 📊 Dashboard with statistics (orders, products, revenue)
- 🆕 New Arrivals Manager (1 image per category)
- 📦 Products Manager (up to 10 images + 1 video per product)
- 📋 Orders Manager with status tracking
- 🖼️ Image & video upload system
- ⚡ Real-time updates

## 🚀 Tech Stack

### Frontend
- React 18 with Vite
- React Router DOM
- Framer Motion (animations)
- Context API (state management)
- CSS3 with custom properties

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT authentication
- Multer (file uploads)
- bcryptjs (password hashing)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)
- **Cloudinary account** (free tier - for image/video hosting)

### Installation

**1. Install Frontend Dependencies:**
```bash
npm install
```

**2. Install Backend Dependencies:**
```bash
cd server
npm install
```

**3. Setup Cloudinary:**
- Create free account at https://cloudinary.com
- Get your credentials from dashboard
- Add to `server/.env`:
  ```env
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- See [CLOUDINARY-SETUP.md](CLOUDINARY-SETUP.md) for detailed guide

### Running the Application

**1. Start Backend Server:**
```bash
cd server
npm run dev
```
Backend runs on http://localhost:5000

**2. Start Customer Frontend (in new terminal):**
```bash
npm run dev
```
Customer site runs on http://localhost:3000

**3. Start Admin Panel (in new terminal):**
```bash
cd admin
npm run dev
```
Admin panel runs on http://localhost:3001

## 🔐 Admin Access

**Admin Panel (Separate App):** http://localhost:3001/login

**Credentials:**
- Email: `admin@seemee.com`
- Password: `admin123`

The admin panel runs as a completely separate application on port 3001.

## 📁 Project Structure

```
seemee/
├── src/                          # Customer Frontend
│   ├── components/               # UI components
│   ├── context/                  # React context
│   └── utils/                    # Utilities
├── admin/                        # Admin Panel (Separate App)
│   ├── src/
│   │   ├── components/           # Admin components
│   │   ├── pages/                # Admin pages
│   │   └── App.jsx
│   └── package.json
├── server/                       # Backend
│   ├── models/                   # MongoDB models
│   ├── routes/                   # API routes
│   ├── middleware/               # Auth middleware
│   ├── config/                   # Cloudinary config
│   └── scripts/                  # Utility scripts
└── public/
    ├── images/                   # Product images
    └── videos/                   # Product videos
```

## 🎨 Design Theme

**Brand:** See Mee - "Ethnic Elegance Redefined"

**Color Palette:**
- Primary Orange: #F96635
- Coral: #FF7F50
- Peach: #FFDAB9
- Warm Yellow: #FFD700
- Cream Background: #FFF8F0

## 📚 Documentation

- **[START-GUIDE.md](START-GUIDE.md)** - Complete setup and usage guide
- **[CLOUDINARY-SETUP.md](CLOUDINARY-SETUP.md)** - Cloudinary integration guide (5 min setup)
- **[ADMIN-PANEL-GUIDE.md](ADMIN-PANEL-GUIDE.md)** - Admin panel documentation
- **[public/images/NAMING-GUIDE.md](public/images/NAMING-GUIDE.md)** - Image naming conventions

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get all orders (admin)
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update status (admin)

### New Arrivals
- `GET /api/new-arrivals` - Get arrivals
- `PUT /api/new-arrivals/:category` - Update arrival (admin)

### Upload
- `POST /api/upload/image` - Upload image (admin)
- `POST /api/upload/video` - Upload video (admin)

## ✅ Current Status

- ✅ Customer frontend fully functional (Port 3000)
- ✅ Admin panel separate app (Port 3001)
- ✅ Backend API complete (Port 5000)
- ✅ MongoDB connected
- ✅ **Cloudinary integrated** for image/video hosting
- ✅ Shopping cart implemented
- ✅ Image upload system working
- ✅ Automatic image optimization via Cloudinary

## 🎯 Next Steps

- Add product detail pages
- Implement checkout flow
- Add payment gateway
- Create customer accounts
- Add order tracking
- Implement search & filters

## 📄 License

Private project for See Mee brand.
