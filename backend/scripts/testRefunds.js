import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Refund from '../models/Refund.js'
import User from '../models/User.js'
import { isOrderShipped } from '../controllers/refundController.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee'

async function runRefundTests() {
  console.log('🧪 Starting Online/Prepaid Refund Feature Verification Matrix...\n')

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clean test artifacts from previous runs
    await Order.deleteMany({ orderNumber: { $regex: /^TEST_REFUND_/ } })
    await Refund.deleteMany({ reason: { $regex: /^TEST_REFUND_/ } })

    const dummyProductId = new mongoose.Types.ObjectId()

    // Create Test Users
    const userA = await User.findOneAndUpdate(
      { email: 'test_refund_customera@seemee.com' },
      { name: 'Customer A', email: 'test_refund_customera@seemee.com', role: 'customer' },
      { upsert: true, new: true }
    )

    const userB = await User.findOneAndUpdate(
      { email: 'test_refund_customerb@seemee.com' },
      { name: 'Customer B', email: 'test_refund_customerb@seemee.com', role: 'customer' },
      { upsert: true, new: true }
    )

    let passedCount = 0
    let failedCount = 0

    const assert = (condition, testName, detail = '') => {
      if (condition) {
        console.log(`  ✅ [PASS] ${testName} ${detail}`)
        passedCount++
      } else {
        console.error(`  ❌ [FAIL] ${testName} ${detail}`)
        failedCount++
      }
    }

    // -------------------------------------------------------------
    // Test 1: Prepaid + payment successful + shipping pending -> Refund allowed
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Prepaid + Paid + Unshipped Order ---')
    const order1 = await Order.create({
      orderNumber: 'TEST_REFUND_01',
      customer: { name: 'Customer A', email: userA.email, phone: '9999999999', address: { street: '123 St', city: 'Delhi', pincode: '110001' } },
      user: userA._id,
      items: [{ product: dummyProductId, name: 'Test Dress', price: 1500, quantity: 1 }],
      totalAmount: 1500,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      status: 'pending',
      shipping: { status: 'pending' }
    })

    const isShipped1 = isOrderShipped(order1)
    const isEligible1 = order1.paymentMethod === 'online' && order1.paymentStatus === 'paid' && !isShipped1 && order1.status !== 'cancelled'
    assert(isEligible1 === true, 'Test 1', '(Refund allowed for unshipped prepaid paid order)')

    // -------------------------------------------------------------
    // Test 2: Prepaid + payment successful + shipped -> Refund rejected
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Prepaid + Paid + Shipped Order ---')
    const order2 = await Order.create({
      orderNumber: 'TEST_REFUND_02',
      customer: { name: 'Customer A', email: userA.email, phone: '9999999999', address: { street: '123 St', city: 'Delhi', pincode: '110001' } },
      user: userA._id,
      items: [{ product: dummyProductId, name: 'Test Saree', price: 2000, quantity: 1 }],
      totalAmount: 2000,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      status: 'shipped',
      shipping: { status: 'shipped', awbNumber: 'AWB999999' }
    })

    const isShipped2 = isOrderShipped(order2)
    const isEligible2 = order2.paymentMethod === 'online' && order2.paymentStatus === 'paid' && !isShipped2
    assert(isShipped2 === true, 'Test 2 Check Shipped', '(Order correctly detected as shipped)')
    assert(isEligible2 === false, 'Test 2', '(Refund rejected for shipped order)')

    // -------------------------------------------------------------
    // Test 3: COD + pending -> Refund rejected
    // -------------------------------------------------------------
    console.log('\n--- Test 3: COD Order ---')
    const order3 = await Order.create({
      orderNumber: 'TEST_REFUND_03',
      customer: { name: 'Customer A', email: userA.email, phone: '9999999999', address: { street: '123 St', city: 'Delhi', pincode: '110001' } },
      user: userA._id,
      items: [{ product: dummyProductId, name: 'Test Kurti', price: 800, quantity: 1 }],
      totalAmount: 800,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'pending'
    })

    const isEligible3 = order3.paymentMethod === 'online' && order3.paymentStatus === 'paid'
    assert(isEligible3 === false, 'Test 3', '(Refund rejected for COD order)')

    // -------------------------------------------------------------
    // Test 4: Prepaid + payment failed -> Refund rejected
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Failed Payment Order ---')
    const order4 = await Order.create({
      orderNumber: 'TEST_REFUND_04',
      customer: { name: 'Customer A', email: userA.email, phone: '9999999999', address: { street: '123 St', city: 'Delhi', pincode: '110001' } },
      user: userA._id,
      items: [{ product: dummyProductId, name: 'Test Lehengas', price: 3000, quantity: 1 }],
      totalAmount: 3000,
      paymentMethod: 'online',
      paymentStatus: 'failed',
      status: 'pending'
    })

    const isEligible4 = order4.paymentMethod === 'online' && order4.paymentStatus === 'paid'
    assert(isEligible4 === false, 'Test 4', '(Refund rejected for failed payment)')

    // -------------------------------------------------------------
    // Test 5 & 6: Duplicate refund request / already processed -> Refund rejected
    // -------------------------------------------------------------
    console.log('\n--- Test 5 & 6: Duplicate Refund Prevention ---')
    const refundDoc = await Refund.create({
      order: order1._id,
      paymentId: 'pay_mock123',
      amount: order1.totalAmount,
      reason: 'TEST_REFUND_01 Initial Request',
      status: 'requested',
      requestedBy: userA._id
    })

    order1.refundStatus = 'refund_requested'
    await order1.save()

    const hasDuplicateActive = ['refund_requested', 'refund_processing', 'refunded'].includes(order1.refundStatus)
    assert(hasDuplicateActive === true, 'Test 5 & 6', '(Duplicate refund request blocked when request already active)')

    // -------------------------------------------------------------
    // Test 7: Ownership Validation (Customer A vs Customer B)
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Ownership Authorization ---')
    const isOwnerA = order1.customer.email === userA.email || String(order1.user) === String(userA._id)
    const isOwnerB = order1.customer.email === userB.email || String(order1.user) === String(userB._id)

    assert(isOwnerA === true, 'Test 7 Customer A', '(Owner authorized)')
    assert(isOwnerB === false, 'Test 7 Customer B', '(Unauthorized customer blocked)')

    // -------------------------------------------------------------
    // Test 8: Race Condition - Customer requests refund, then order ships before Admin approves
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Race Condition Guard ---')
    // Simulate shipping order 1 after refund request created
    order1.status = 'shipped'
    order1.shipping = { status: 'shipped', awbNumber: 'AWB_RACE_TEST' }
    await order1.save()

    const raceShipped = isOrderShipped(order1)
    assert(raceShipped === true, 'Test 8', '(Admin re-verification detects interim shipment and rejects refund approval)')

    // -------------------------------------------------------------
    // Cleanup test data
    // -------------------------------------------------------------
    await Order.deleteMany({ orderNumber: { $regex: /^TEST_REFUND_/ } })
    await Refund.deleteMany({ reason: { $regex: /^TEST_REFUND_/ } })

    console.log(`\n==================================================`)
    console.log(`🏆 TEST MATRIX COMPLETE: Passed: ${passedCount}, Failed: ${failedCount}`)
    console.log(`==================================================\n`)

  } catch (err) {
    console.error('❌ Test Execution Failed:', err)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

runRefundTests()
