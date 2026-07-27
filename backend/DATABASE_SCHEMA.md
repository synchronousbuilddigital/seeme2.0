# SeeMee Database Schema Documentation

## Overview
This document outlines the complete MongoDB schema for the SeeMee ethnic clothing e-commerce platform.

---

## Collections

### 1. **Products**
Primary collection for all clothing items and merchandise.

```javascript
{
  // Basic Information
  name: String (required, unique),
  description: String (required, long form),
  shortDescription: String,
  slug: String (lowercase),
  sku: String (unique),
  
  // Categorization
  // category: String (required) ['anarkali', 'palazzo', 'straight-cut', 'sharara', 'saree', 'lehenga'],
  subcategory: String ['casual', 'formal', 'festive', 'wedding'],
  brand: String,
  tags: [String],
  
  // Pricing
  price: Number (required, min: 0),
  discountPrice: Number (min: 0),
  
  // Media
  images: [String] // Cloudinary/Web URLs
  gallery: [String],
  video: String,
  preview3dImages: [String],
  
  // Inventory
  stock: Number (required, min: 0),
  sizes: [String] ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  sizeStock: [{
    size: String,
    quantity: Number
  }],
  colors: [String],
  
  // Specifications
  materials: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String (default: 'cm')
  },
  weight: {
    value: Number,
    unit: String (default: 'kg')
  },
  
  // Customization
  customOptions: [{
    optionName: String,
    values: [String]
  }],
  
  // Product Details
  packagingType: String,
  templates: [String],
  seo: {
    title: String,
    description: String
  },
  
  // Status & Metadata
  status: String (enum: ['draft', 'published', 'archived']),
  isNewArrival: Boolean (default: false),
  featured: Boolean,
  inCollection: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2. **Users**
Customer and admin account information.

```javascript
{
  // Authentication
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  role: String (enum: ['admin', 'customer'], default: 'customer'),
  
  // Profile
  name: String (required),
  phone: String,
  
  // Addresses
  addresses: [{
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String (default: 'India'),
    isDefault: Boolean
  }],
  
  // Wishlist & Cart
  wishlist: [ObjectId] -> Product,
  cart: [{
    product: ObjectId -> Product,
    quantity: Number (default: 1),
    size: String,
    color: String
  }],
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Account Status
  isBlocked: Boolean (default: false),
  
  // Customer Data
  totalSpending: Number (default: 0),
  activity: [{
    action: String,
    timestamp: Date
  }],
  designFiles: [{
    url: String,
    name: String,
    timestamp: Date
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. **Orders**
Customer purchase records and order tracking.

```javascript
{
  // Order Identification
  orderNumber: String (unique),
  
  // Customer Information
  customer: {
    name: String (required),
    email: String (required),
    phone: String (required),
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String (default: 'India')
    }
  },
  
  // Order Items
  items: [{
    product: ObjectId -> Product (required),
    name: String,
    price: Number,
    quantity: Number (required, min: 1),
    size: String,
    color: String,
    image: String
  }],
  
  // Billing
  billingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  totalAmount: Number (required),
  
  // Payment
  paymentMethod: String (enum: ['cod', 'online'], default: 'cod'),
  paymentStatus: String (enum: ['pending', 'paid', 'failed', 'refunded']),
  
  // Shipping & Status
  status: String (enum: ['pending', 'confirmed', 'processing', 'printing', 'packaging', 'shipped', 'delivered', 'cancelled', 'refunded']),
  trackingNumber: String,
  estimatedDelivery: Date,
  
  // Design & Notes
  designFiles: [String],
  internalNotes: String,
  customerNotes: String,
  
  // Timeline
  timeline: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

---

### 4. **Reviews**
Product reviews and ratings from customers.

```javascript
{
  user: ObjectId -> User (required),
  name: String (required),
  product: ObjectId -> Product (required),
  
  rating: Number (required, min: 1, max: 5),
  comment: String (required),
  
  createdAt: Date,
  updatedAt: Date,
  
  // Index: Unique review per user per product
  unique_index: { user: 1, product: 1 }
}
```

---

### 5. **HeroCarousel**
Homepage hero section carousel items.

```javascript
{
  title: String (required),
  description: String,
  image: String (required),
  link: String,
  active: Boolean (default: true),
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 6. **NewArrivals**
Featured new product arrivals.

```javascript
{
  product: ObjectId -> Product (required),
  title: String,
  image: String,
  featured: Boolean (default: false),
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 7. **Magazine**
Magazine/blog content for promotional and educational articles.

```javascript
{
  title: String (required),
  slug: String (unique),
  description: String,
  content: String (required),
  image: String,
  author: String,
  featured: Boolean (default: false),
  published: Boolean (default: false),
  views: Number (default: 0),
  tags: [String],
  relatedProducts: [ObjectId -> Product],
  createdAt: Date,
  updatedAt: Date
}
```

---

### 8. **SiteSettings**
Global site configuration and settings.

```javascript
{
  siteName: String,
  logo: String,
  favicon: String,
  description: String,
  
  // Contact
  email: String,
  phone: String,
  address: String,
  
  // Social Media
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
    pinterest: String
  },
  
  // Policies
  privacyPolicy: String,
  termsOfService: String,
  refundPolicy: String,
  shippingPolicy: String,
  
  // SEO
  metaDescription: String,
  keywords: [String],
  
  // Settings
  maintenanceMode: Boolean (default: false),
  freeShippingThreshold: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Relationships

```
User (1) ────────→ (Many) Orders
User (1) ────────→ (Many) Reviews
User (1) ────────→ (Many) Products (Wishlist)
User (1) ────────→ (Many) Products (Cart)

Product (1) ────→ (Many) Orders (items)
Product (1) ────→ (Many) Reviews
Product (1) ────→ (1) NewArrival
Product (1) ────→ (Many) Magazine (relatedProducts)

Order (1) ──────→ (Many) Timeline entries
```

---

## Indexes

### Recommended Indexes for Performance

```javascript
// Products
db.products.createIndex({ name: 1 })
db.products.createIndex({ category: 1, subcategory: 1 })
db.products.createIndex({ sku: 1 })
db.products.createIndex({ status: 1, isNewArrival: 1 })
db.products.createIndex({ createdAt: -1 })

// Users
db.users.createIndex({ email: 1 })
db.users.createIndex({ role: 1 })

// Orders
db.orders.createIndex({ orderNumber: 1 })
db.orders.createIndex({ 'customer.email': 1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: -1 })

// Reviews
db.reviews.createIndex({ product: 1, rating: 1 })
db.reviews.createIndex({ user: 1, product: 1 }, { unique: true })

// Magazine
db.magazine.createIndex({ slug: 1 })
db.magazine.createIndex({ featured: 1, published: 1 })
```

---

## Data Types & Validation Rules

| Field | Type | Required | Unique | Validation |
|-------|------|----------|--------|-----------|
| Product.name | String | ✓ | ✓ | Non-empty, 3-200 chars |
| Product.price | Number | ✓ | | ≥ 0 |
| User.email | String | ✓ | ✓ | Valid email format |
| User.password | String | ✓ | | Min 6 chars (hashed) |
| Order.totalAmount | Number | ✓ | | ≥ 0 |
| Review.rating | Number | ✓ | | 1-5 |
| Review.comment | String | ✓ | | Min 10 chars |

---

## Best Practices

1. **Image URLs**: Use Cloudinary CDN for all images
2. **Passwords**: Always hash with bcryptjs before storing
3. **Dates**: Use ISO 8601 format with timezone
4. **References**: Use ObjectId for document references
5. **Validation**: Validate at schema level and application level
6. **Indexes**: Create indexes on frequently queried fields
7. **Backup**: Regular MongoDB Atlas backups

---

## Seeding

Run seeding script to populate test data:

```bash
npm run seed        # Full database reset and seed
npm run seed:products  # Seed products only
```

---

Generated: May 2026
Last Updated: May 2026
