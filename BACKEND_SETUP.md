# SeeMee Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/seemee?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-secret-key-min-32-chars-long-for-security

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Account (Created on first run)
ADMIN_EMAIL=admin@seemee.com
ADMIN_PASSWORD=admin123

# Cloudinary Configuration (for image upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Configuration (Payment Gateway)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Cloudinary Setup (Important for Image Upload)

#### Get Cloudinary Credentials:
1. Sign up at https://cloudinary.com (free tier available)
2. Navigate to Dashboard → Settings → API Keys
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Add to `.env` file

#### Future Image Uploads:
All product images will be stored in Cloudinary with:
- Automatic optimization (WebP, avif formats)
- CDN distribution for fast loading
- Automatic resizing based on device
- Version control for images

### 4. Database Initialization

#### Option A: MongoDB Atlas (Recommended)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and database user
3. Copy connection string
4. Add to `MONGODB_URI` in `.env`

#### Option B: Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod

# Use local connection
MONGODB_URI=mongodb://localhost:27017/seemee
```

### 5. Seed Initial Database
```bash
# Full reset with all test data
npm run seed

# Seed products only
npm run seed:products

# Alternative
node scripts/seedAll.js
```

### 6. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## Database Schema Overview

### Collections:
- **Products** - Clothing items with full details
- **Users** - Customer and admin accounts
- **Orders** - Purchase records and tracking
- **Reviews** - Product ratings and comments
- **HeroCarousel** - Homepage banner items
- **NewArrivals** - Featured new products
- **Magazine** - Blog/article content
- **SiteSettings** - Global configuration

See `DATABASE_SCHEMA.md` for detailed documentation.

---

## API Endpoints

### Authentication
```
POST   /api/auth/register    - Create new account
POST   /api/auth/login       - Login user
POST   /api/auth/logout      - Logout user
```

### Products
```
GET    /api/products         - Get all products
GET    /api/products/:id     - Get product details
POST   /api/products         - Create product (admin)
PUT    /api/products/:id     - Update product (admin)
DELETE /api/products/:id     - Delete product (admin)
```

### Image Upload
```
POST   /api/upload/image     - Upload single image (admin)
POST   /api/upload/images    - Upload multiple images (admin)
POST   /api/upload/video     - Upload video (admin)
DELETE /api/upload/delete/:id - Delete media (admin)
```

### Orders
```
GET    /api/orders           - Get user orders
POST   /api/orders           - Create order
GET    /api/orders/:id       - Get order details
PUT    /api/orders/:id       - Update order (admin)
```

### Reviews
```
GET    /api/reviews/product/:id  - Get product reviews
POST   /api/reviews             - Create review
PUT    /api/reviews/:id         - Update review
DELETE /api/reviews/:id         - Delete review
```

---

## Seeding Details

### Test Data Included:

**Products (10 items)**
- 2 Anarkali collections (₹18,500 - ₹22,000)
- 2 Palazzo sets (₹6,800 - ₹7,200)
- 2 Straight cuts (₹9,800 - ₹12,400)
- 2 Sharara (₹21,000 - ₹23,500)
- 2 Sarees (₹4,500 - ₹16,000)
- 2 Lehengas (₹22,000 - ₹25,000)

**Users (3 accounts)**
```
Admin:
  Email: admin@seemee.com
  Password: admin123

Customer 1:
  Email: customer@seemee.com
  Password: customer123

Customer 2:
  Email: test@seemee.com
  Password: test123
```

**Images**: Using Unsplash/Pexels URLs for now
- All products have 2-3 gallery images
- Hero carousel has 3 banners
- New arrivals: 5-8 items

---

## Common Issues & Solutions

### MongoDB Connection Error
```
Error: connect ENOTFOUND
```
**Solution**: Check `MONGODB_URI` is correct and cluster is active

### Cloudinary Upload Error
```
Error: Missing cloudinary configuration
```
**Solution**: Ensure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are set in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Change `PORT` in `.env` or kill existing process on port 5000

### Password Hashing Issues
```
Error: bcryptjs not installed
```
**Solution**: Run `npm install bcryptjs`

---

## File Structure
```
backend/
├── config/
│   ├── db.js              - MongoDB connection
│   ├── cloudinary.js      - Cloudinary setup
│   └── upload.js          - Upload configuration
├── controllers/
│   ├── productController.js
│   ├── authController.js
│   ├── uploadController.js
│   └── ...
├── models/
│   ├── Product.js
│   ├── User.js
│   ├── Order.js
│   └── ...
├── routes/
│   ├── products.js
│   ├── auth.js
│   ├── upload.js
│   └── ...
├── middleware/
│   ├── auth.js            - JWT verification
│   ├── upload.js          - Multer configuration
│   └── validator.js       - Input validation
├── scripts/
│   ├── seedAll.js         - Complete database seed
│   ├── seedProducts.js    - Products only
│   └── createAdmin.js     - Admin account creation
├── .env                   - Environment variables
├── server.js              - Express server entry point
├── DATABASE_SCHEMA.md     - Schema documentation
└── package.json
```

---

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Use production MongoDB URI (Atlas)
- [ ] Configure Cloudinary for production
- [ ] Set up environment variables securely
- [ ] Enable rate limiting
- [ ] Set up logging
- [ ] Configure backup strategy
- [ ] Test all API endpoints
- [ ] Verify image uploads
- [ ] Test payment gateway (Razorpay)

---

## Useful Commands

```bash
# Development
npm run dev              - Start with auto-reload (nodemon)

# Production
npm start               - Start server normally

# Database
npm run seed            - Reset and seed database
npm run seed:products   - Seed products only

# Admin
node scripts/createAdmin.js  - Create new admin account
```

---

## Frontend Configuration

See `frontend/README.md` and image configuration files for frontend setup.

Image paths should use:
- Absolute paths for static images: `/images/logo.png`
- Cloudinary URLs for product images: `https://res.cloudinary.com/...`

---

## Support & Debugging

1. Check server logs: `npm run dev` shows real-time logs
2. Test API: Use Postman or curl commands
3. Database: Use MongoDB Compass for visual browsing
4. Images: Verify Cloudinary credentials in dashboard

---

## Next Steps

1. ✅ Database schema designed
2. ✅ Test data seeded
3. ✅ Cloudinary configured
4. 📝 Frontend image handling (see frontend setup)
5. 📝 Payment integration
6. 📝 Email notifications
7. 📝 Admin dashboard

---

Generated: May 2026
Last Updated: May 2026
