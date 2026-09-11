import express from 'express'
import * as orderController from '../controllers/orderController.js'
import orderRoutes from '../routes/orders.js'

async function runDirectTests() {
  console.log('🧪 Starting Direct Pincode Validation Controller Test...\n')

  const app = express()
  app.use(express.json())
  app.use('/api/orders', orderRoutes)

  const server = app.listen(5099, async () => {
    console.log('Test server running on port 5099')

    try {
      // Test 1: Pincode 122103
      const res1 = await fetch('http://localhost:5099/api/orders/verify-offline-pincode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: '122103' })
      })
      const data1 = await res1.json()
      console.log('\n--- TEST 1: Pincode 122103 ---')
      console.log('Status:', res1.status)
      console.log('Response:', data1)

      // Test 2: Pincode 110001
      const res2 = await fetch('http://localhost:5099/api/orders/verify-offline-pincode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: '110001' })
      })
      const data2 = await res2.json()
      console.log('\n--- TEST 2: Pincode 110001 ---')
      console.log('Status:', res2.status)
      console.log('Response:', data2)

      if (
        res1.status === 200 && data1.allowed === true &&
        res2.status === 400 && data2.message === 'Offline store is not available in your area.'
      ) {
        console.log('\n✅ ALL BACKEND PINCODE VALIDATION TESTS PASSED!')
      } else {
        console.error('\n❌ TESTS FAILED!')
      }
    } catch (e) {
      console.error('Test error:', e)
    } finally {
      server.close()
    }
  })
}

runDirectTests()
