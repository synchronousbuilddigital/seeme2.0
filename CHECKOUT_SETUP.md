# Checkout & Payment Gateway Setup Guide

## Overview
Complete checkout system with Razorpay payment gateway integration and Cash on Delivery option.

## Features Implemented

### Frontend
- ✅ Checkout page with shipping information form
- ✅ Payment method selection (Razorpay Online Payment / Cash on Delivery)
- ✅ Order summary with cart items
- ✅ Subtotal, shipping cost calculation (free above ₹50,000)
- ✅ Form validation (email, phone, pincode)
- ✅ Razorpay SDK integration
- ✅ Payment verification flow
- ✅ Responsive design matching website theme (gold #D4AF37, charcoal)

### Backend
- ✅ Razorpay order creation endpoint
- ✅ Payment verification endpoint
- ✅ Order creation with customer details
- ✅ Support for both online and COD payments
- ✅ Signature verification for secure payments

## Setup Instructions

### 1. Install Dependencies

Server dependencies are already installed. If needed:
```bash
cd SEE_MEE-master/server
npm install razorpay
```

### 2. Configure Razorpay

#### Get Razorpay Credentials
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live API Keys
4. Copy Key ID and Key Secret

#### Update Environment Variables

**Server (.env):**
```env
# SEE_MEE-master/server/.env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Frontend (.env):**
```env
# SEE_MEE-master/.env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### 3. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd SEE_MEE-master/server
npm start
```

**Terminal 2 - Start Frontend:**
```bash
cd SEE_MEE-master
npm run dev
```

## File Structure

```
SEE_MEE-master/
├── src/
│   ├── pages/
│   │   ├── Checkout.jsx          # Checkout page component
│   │   └── Checkout.css          # Checkout page styles
│   ├── components/
│   │   └── Cart.jsx              # Updated with checkout button
│   ├── config/
│   │   └── api.js                # API endpoints configuration
│   └── App.jsx                   # Updated with checkout route
├── server/
│   ├── routes/
│   │   └── orders.js             # Updated with Razorpay endpoints
│   └── .env                      # Server environment variables
└── .env                          # Frontend environment variables
```

## API Endpoints

### Create Razorpay Order
```
POST /api/orders/create-razorpay-order
Body: { amount: number }
Response: { success: true, data: razorpayOrder }
```

### Verify Payment & Create Order
```
POST /api/orders/verify-payment
Body: {
  razorpay_order_id: string (for online payment),
  razorpay_payment_id: string (for online payment),
  razorpay_signature: string (for online payment),
  customer: {
    name: string,
    email: string,
    phone: string,
    address: {
      street: string,
      city: string,
      state: string,
      pincode: string,
      country: string
    }
  },
  items: [{
    productId: string,
    name: string,
    price: number,
    quantity: number,
    image: string
  }],
  totalAmount: number,
  paymentMethod: 'online' | 'cod'
}
Response: { success: true, data: order }
```

## User Flow

1. **Add to Cart**: User adds products to cart
2. **View Cart**: User opens cart sidebar
3. **Proceed to Checkout**: User clicks "Proceed to Checkout" button
4. **Fill Shipping Info**: User enters name, email, phone, address
5. **Select Payment Method**: 
   - Online Payment (Razorpay)
   - Cash on Delivery
6. **Place Order**:
   - **Online**: Razorpay modal opens → User completes payment → Order created
   - **COD**: Order created immediately
7. **Confirmation**: Cart cleared, user redirected to orders page

## Validation Rules

- **Email**: Valid email format (user@example.com)
- **Phone**: 10-digit number
- **Pincode**: 6-digit code
- **All fields**: Required

## Shipping Calculation

- **Free Shipping**: Orders ≥ ₹50,000
- **Standard Shipping**: ₹500 for orders < ₹50,000

## Security Features

- ✅ Razorpay signature verification
- ✅ Server-side payment validation
- ✅ HTTPS required for production
- ✅ Environment variables for sensitive data
- ✅ CORS configuration

## Testing

### Test Mode (Razorpay)
Use test credentials from Razorpay dashboard:
- Test cards: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- Example: 4111 1111 1111 1111 (any CVV, future expiry)

### Test Cash on Delivery
1. Add items to cart
2. Go to checkout
3. Fill shipping information
4. Select "Cash on Delivery"
5. Click "Place Order"
6. Order should be created with status "pending"

## Production Deployment

### Before Going Live:

1. **Switch to Live Keys**:
   - Replace `rzp_test_` with `rzp_live_` keys
   - Update both server and frontend .env files

2. **Update API URL**:
   ```env
   VITE_API_URL=https://your-production-domain.com
   ```

3. **Enable HTTPS**:
   - Razorpay requires HTTPS in production
   - Configure SSL certificate

4. **Environment Variables**:
   - Set all environment variables in hosting platform
   - Never commit .env files to git

5. **Test Thoroughly**:
   - Test complete checkout flow
   - Verify payment webhooks
   - Test order creation

## Troubleshooting

### Razorpay SDK Not Loading
- Check internet connection
- Verify script URL: `https://checkout.razorpay.com/v1/checkout.js`
- Check browser console for errors

### Payment Verification Failed
- Verify Razorpay Key Secret in server .env
- Check signature generation logic
- Ensure order_id matches

### Order Not Created
- Check MongoDB connection
- Verify Product model exists
- Check server logs for errors

### CORS Issues
- Verify CORS is enabled in server.js
- Check API_BASE_URL in frontend config
- Ensure correct origin in CORS settings

## Support

For Razorpay integration issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

## Next Steps (Optional Enhancements)

- [ ] Order confirmation page
- [ ] Email notifications
- [ ] Order tracking
- [ ] Payment webhooks for async updates
- [ ] Multiple shipping addresses
- [ ] Discount codes/coupons
- [ ] Invoice generation
- [ ] Order history page
