# Quick Start - Checkout System

## 🚀 Get Started in 3 Steps

### Step 1: Get Razorpay Keys
1. Go to https://dashboard.razorpay.com/
2. Sign up / Login
3. Settings → API Keys → Generate Test Keys
4. Copy Key ID and Key Secret

### Step 2: Update Environment Files

**Server:** `SEE_MEE-master/server/.env`
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

**Frontend:** `SEE_MEE-master/.env`
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Step 3: Run the App

**Terminal 1:**
```bash
cd SEE_MEE-master/server
npm start
```

**Terminal 2:**
```bash
cd SEE_MEE-master
npm run dev
```

## ✅ Test It

1. Add products to cart
2. Click cart icon → "Proceed to Checkout"
3. Fill shipping info
4. Choose payment method:
   - **Online**: Use test card `4111 1111 1111 1111`
   - **COD**: Just click "Place Order"
5. Done! 🎉

## 📁 What Was Added

- ✅ Checkout page (`src/pages/Checkout.jsx`)
- ✅ Checkout styles (`src/pages/Checkout.css`)
- ✅ Payment routes (`server/routes/orders.js`)
- ✅ API config (`src/config/api.js`)
- ✅ Cart checkout button (`src/components/Cart.jsx`)
- ✅ Checkout route (`src/App.jsx`)

## 🎨 Features

- Shipping information form
- Online payment (Razorpay)
- Cash on Delivery
- Free shipping over ₹50,000
- Order summary
- Form validation
- Responsive design

## 🔧 Need Help?

See `CHECKOUT_SETUP.md` for detailed documentation.
