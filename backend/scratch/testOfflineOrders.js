import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') })
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })
}

import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { createOrder, verifyPayment, approveCodOrder, rejectCodOrder } from '../controllers/orderController.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee'

// Mock req, res, next for testing express controllers directly
function mockReqRes(body = {}, params = {}, user = {}, query = {}) {
  let caughtError = null
  let resolvePromise = null
  const donePromise = new Promise(resolve => { resolvePromise = resolve })

  const req = { body, params, user, query }
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.jsonData = data
      if (resolvePromise) resolvePromise(this)
      return this
    }
  }
  const next = (err) => {
    if (err) {
      caughtError = err
      if (res.statusCode === 200) res.statusCode = 400
      res.jsonData = { success: false, message: err.message }
    }
    if (resolvePromise) resolvePromise(res)
  }
  return { req, res, next, donePromise, getCaughtError: () => caughtError }
}

async function runOfflineStoreTests() {
  console.log('🧪 Starting Offline Store Order Feature Verification Matrix (CASE 1 - CASE 5)...\n')

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clean test artifacts
    await Order.deleteMany({ orderNumber: { $regex: /^TEST_OFFLINE_/ } })

    // Ensure dummy product exists
    let dummyProduct = await Product.findOne({ name: 'Test Offline Product' })
    if (!dummyProduct) {
      dummyProduct = await Product.create({
        name: 'Test Offline Product',
        description: 'Test product for offline orders',
        price: 1200,
        category: 'Kurti',
        stock: 50
      })
    }

    // Ensure dummy admin user exists
    let adminUser = await User.findOne({ role: 'admin' })
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Atelier Admin',
        email: 'admin_test@seemee.com',
        password: 'password123',
        role: 'admin'
      })
    }

    let passedCount = 0
    let failedCount = 0

    const assert = (condition, testName, detail = '') => {
      if (condition) {
        console.log(`  ✅ [PASS] ${testName}: ${detail}`)
        passedCount++
      } else {
        console.error(`  ❌ [FAIL] ${testName}: ${detail}`)
        failedCount++
      }
    }

    // -------------------------------------------------------------
    // CASE 1: Online Store -> Online Payment -> Existing flow works
    // -------------------------------------------------------------
    console.log('\n--- CASE 1: Online Store -> Online Payment ---')
    const case1ReqRes = mockReqRes({
      razorpay_order_id: 'order_mock_case1_' + Date.now(),
      razorpay_payment_id: 'pay_mock_case1_' + Date.now(),
      razorpay_signature: 'sig_mock',
      orderType: 'ONLINE',
      customer: { name: 'Customer Case 1', email: 'c1@test.com', phone: '9999999901', address: { street: 'Main St', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      items: [{ product: dummyProduct._id, name: dummyProduct.name, price: dummyProduct.price, quantity: 1 }],
      totalAmount: 1200
    })

    verifyPayment(case1ReqRes.req, case1ReqRes.res, case1ReqRes.next)
    await case1ReqRes.donePromise
    const order1 = case1ReqRes.res.jsonData?.data
    assert(
      case1ReqRes.res.statusCode === 200 &&
      order1?.orderType === 'ONLINE' &&
      order1?.paymentMethod === 'online' &&
      order1?.paymentStatus === 'paid',
      'CASE 1',
      `Online Store + Online Payment created successfully (Order #${order1?.orderNumber}, Payment: ${order1?.paymentStatus})`
    )

    // -------------------------------------------------------------
    // CASE 2: Online Store -> COD -> MUST BE REJECTED by backend
    // -------------------------------------------------------------
    console.log('\n--- CASE 2: Online Store -> COD (Security Violation) ---')
    const case2ReqRes = mockReqRes({
      orderType: 'ONLINE',
      paymentMethod: 'cod',
      customer: { name: 'Customer Case 2', email: 'c2@test.com', phone: '9999999902', address: { street: 'Main St', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      items: [{ product: dummyProduct._id, quantity: 1 }]
    })

    let case2Rejected = false
    let case2ErrorMsg = ''
    try {
      createOrder(case2ReqRes.req, case2ReqRes.res, case2ReqRes.next)
      await case2ReqRes.donePromise
    } catch (err) {
      case2Rejected = true
      case2ErrorMsg = err.message
    }
    if (case2ReqRes.res.statusCode === 400 || case2ReqRes.getCaughtError()) {
      case2Rejected = true
      case2ErrorMsg = case2ReqRes.res.jsonData?.message || case2ReqRes.getCaughtError()?.message || case2ErrorMsg
    }

    assert(
      case2Rejected && (case2ErrorMsg.includes('COD payment method is not allowed') || case2ReqRes.res.statusCode === 400),
      'CASE 2',
      `Backend correctly rejected Online Store + COD with error: "${case2ErrorMsg}"`
    )

    // -------------------------------------------------------------
    // CASE 3: Offline Store -> COD -> Order created (Pending) -> Admin Approves -> Paid
    // -------------------------------------------------------------
    console.log('\n--- CASE 3: Offline Store -> COD -> Admin Approves ---')
    const case3ReqRes = mockReqRes({
      orderType: 'OFFLINE',
      paymentMethod: 'cod',
      customer: { name: 'Customer Case 3', email: 'c3@test.com', phone: '9999999903', address: { street: 'Offline Shop St', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      items: [{ product: dummyProduct._id, quantity: 1 }]
    })

    createOrder(case3ReqRes.req, case3ReqRes.res, case3ReqRes.next)
    await case3ReqRes.donePromise
    const order3Created = case3ReqRes.res.jsonData?.data

    assert(
      case3ReqRes.res.statusCode === 201 &&
      order3Created?.orderType === 'OFFLINE' &&
      order3Created?.paymentMethod === 'cod' &&
      order3Created?.paymentStatus === 'pending',
      'CASE 3 (Creation)',
      `Offline Store COD order created with status Pending (Order #${order3Created?.orderNumber})`
    )

    // Admin approves COD for order 3
    const case3ApproveReqRes = mockReqRes(
      {},
      { id: order3Created?._id },
      adminUser
    )
    approveCodOrder(case3ApproveReqRes.req, case3ApproveReqRes.res, case3ApproveReqRes.next)
    await case3ApproveReqRes.donePromise
    const order3Approved = case3ApproveReqRes.res.jsonData?.data

    assert(
      case3ApproveReqRes.res.statusCode === 200 &&
      order3Approved?.paymentStatus === 'paid' &&
      String(order3Approved?.approvedBy?._id || order3Approved?.approvedBy) === String(adminUser._id) &&
      Boolean(order3Approved?.approvedAt),
      'CASE 3 (Admin Approval)',
      `Admin approved COD. Payment status updated to PAID (approvedBy: ${order3Approved?.approvedBy?.name || 'Admin'}, approvedAt: ${order3Approved?.approvedAt})`
    )

    // -------------------------------------------------------------
    // CASE 4: Offline Store -> COD -> Admin Rejects -> Rejected
    // -------------------------------------------------------------
    console.log('\n--- CASE 4: Offline Store -> COD -> Admin Rejects ---')
    const case4ReqRes = mockReqRes({
      orderType: 'OFFLINE',
      paymentMethod: 'cod',
      customer: { name: 'Customer Case 4', email: 'c4@test.com', phone: '9999999904', address: { street: 'Offline Shop St', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      items: [{ product: dummyProduct._id, quantity: 1 }]
    })

    createOrder(case4ReqRes.req, case4ReqRes.res, case4ReqRes.next)
    await case4ReqRes.donePromise
    const order4Created = case4ReqRes.res.jsonData?.data

    // Admin rejects COD for order 4
    const case4RejectReqRes = mockReqRes(
      {},
      { id: order4Created?._id },
      adminUser
    )
    rejectCodOrder(case4RejectReqRes.req, case4RejectReqRes.res, case4RejectReqRes.next)
    await case4RejectReqRes.donePromise
    const order4Rejected = case4RejectReqRes.res.jsonData?.data

    // Verify order is NOT deleted
    const order4InDb = await Order.findById(order4Created?._id)

    assert(
      case4RejectReqRes.res.statusCode === 200 &&
      order4Rejected?.paymentStatus === 'rejected' &&
      Boolean(order4InDb),
      'CASE 4',
      `Admin rejected COD. Payment status updated to REJECTED and order preserved in DB (Order #${order4Created?.orderNumber})`
    )

    // -------------------------------------------------------------
    // CASE 5: Offline Store -> Online Payment -> Successful payment -> Paid
    // -------------------------------------------------------------
    console.log('\n--- CASE 5: Offline Store -> Online Payment ---')
    const case5ReqRes = mockReqRes({
      razorpay_order_id: 'order_mock_case5_' + Date.now(),
      razorpay_payment_id: 'pay_mock_case5_' + Date.now(),
      razorpay_signature: 'sig_mock',
      orderType: 'OFFLINE',
      customer: { name: 'Customer Case 5', email: 'c5@test.com', phone: '9999999905', address: { street: 'Offline Shop St', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      items: [{ product: dummyProduct._id, name: dummyProduct.name, price: dummyProduct.price, quantity: 1 }],
      totalAmount: 1200
    })

    verifyPayment(case5ReqRes.req, case5ReqRes.res, case5ReqRes.next)
    await case5ReqRes.donePromise
    const order5 = case5ReqRes.res.jsonData?.data
    assert(
      case5ReqRes.res.statusCode === 200 &&
      order5?.orderType === 'OFFLINE' &&
      order5?.paymentMethod === 'online' &&
      order5?.paymentStatus === 'paid',
      'CASE 5',
      `Offline Store + Online Payment created & verified as PAID (Order #${order5?.orderNumber})`
    )

    // Cleanup test orders
    await Order.deleteMany({ _id: { $in: [order1?._id, order3Created?._id, order4Created?._id, order5?._id] } })

    console.log(`\n==================================================`)
    console.log(`🏆 ALL 5 VERIFICATION TEST CASES EXECUTED`)
    console.log(`Passed: ${passedCount}, Failed: ${failedCount}`)
    console.log(`==================================================\n`)

  } catch (err) {
    console.error('❌ Test Suite Execution Error:', err)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

runOfflineStoreTests()
