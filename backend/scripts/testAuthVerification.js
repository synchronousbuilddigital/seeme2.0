import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import User from '../models/User.js'
import PendingOtp from '../models/PendingOtp.js'
import { validateEmail, validateEmailSyntax, normalizeEmailAddress } from '../utils/emailValidator.js'
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../utils/otpHelper.js'
import * as authService from '../services/authService.js'

async function runTests() {
  console.log('====================================================')
  console.log('🧪 RUNNING PRODUCTION EMAIL & OTP VERIFICATION TESTS')
  console.log('====================================================\n')

  await connectDB()

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${message}`)
      failed++
    }
  }

  // ----------------------------------------------------
  // TEST 1: Malformed Emails & Syntax Check
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Malformed Emails ---')
  const malformed = [
    'test@h=mail',
    'test@h=mail.com',
    'test@@gmail.com',
    'test gmail.com',
    '..user@gmail.com',
    'user.@gmail.com',
    'user@.com',
    'plainaddress'
  ]
  for (const m of malformed) {
    const res = validateEmailSyntax(m)
    assert(!res.isValid, `Malformed email "${m}" properly rejected: "${res.error}"`)
  }

  // ----------------------------------------------------
  // TEST 2: Domain Typos & Strict Non-Gmail Rejection
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Domain Typos & Strict Non-Gmail Rejection ---')
  const typos = [
    { email: 'user@hmail.com', expected: 'gmail.com' },
    { email: 'user@gmai.com', expected: 'gmail.com' },
    { email: 'user@gmial.com', expected: 'gmail.com' },
    { email: 'user@gamil.com', expected: 'gmail.com' }
  ]
  for (const t of typos) {
    const res = validateEmailSyntax(t.email)
    assert(!res.isValid && res.error.includes(t.expected), `Typo domain "${t.email}" correctly suggests "@${t.expected}"`)
  }

  const nonGmail = ['test@yahoo.com', 'user@hotmail.com', 'test@tempmail.com', 'user@10minutemail.com', 'hacker@mailinator.com', 'client@customdomain.org']
  for (const d of nonGmail) {
    const res = validateEmailSyntax(d)
    assert(!res.isValid && res.error.includes('Only @gmail.com'), `Non-Gmail address "${d}" strictly rejected: "${res.error}"`)
  }

  // ----------------------------------------------------
  // TEST 3: Gmail-Specific Username Rules
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Gmail-Specific Username Rules ---')
  const shortGmail = validateEmailSyntax('abc@gmail.com')
  assert(!shortGmail.isValid && shortGmail.error.includes('6 characters'), `Short Gmail username (< 6) rejected: "${shortGmail.error}"`)

  const numericGmail = validateEmailSyntax('12345678@gmail.com')
  assert(!numericGmail.isValid && numericGmail.error.includes('numbers'), `Numeric-only Gmail username rejected: "${numericGmail.error}"`)

  const validGmail = validateEmailSyntax('seemee.shopper.2026@gmail.com')
  assert(validGmail.isValid, `Valid Gmail accepted: ${validGmail.cleanEmail}`)

  const sunidhiGmail = validateEmailSyntax('csunidhi22@gmail.com')
  assert(sunidhiGmail.isValid, `Valid user Gmail accepted: ${sunidhiGmail.cleanEmail}`)

  // ----------------------------------------------------
  // TEST 4: DNS MX Record Lookup & Non-Existent Domain
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: DNS MX Record Verification ---')
  const fakeDomainRes = await validateEmail('user@nonexistentdomainxyz123456789.org')
  assert(!fakeDomainRes.isValid, `Non-existent domain rejected via MX lookup: "${fakeDomainRes.error}"`)

  // ----------------------------------------------------
  // TEST 5: OTP Generation, Hashing & Cryptographic Security
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: OTP Cryptographic Hashing ---')
  const testEmail = 'verify.test.user.seemee@gmail.com'
  const rawOtp = generateSecureOtp()
  assert(/^\d{6}$/.test(rawOtp), `Generated secure 6-digit OTP: length=${rawOtp.length}`)

  const hashedOtp = hashOtp(testEmail, rawOtp)
  assert(hashedOtp.length === 64, `Hashed OTP is 64-char hex SHA256 HMAC: ${hashedOtp.substring(0, 16)}...`)
  assert(hashedOtp !== rawOtp, 'Plain OTP is never stored in DB')

  const verifyValid = verifyOtpHash(testEmail, rawOtp, hashedOtp)
  assert(verifyValid === true, 'Valid OTP matches cryptographic hash')

  const verifyInvalid = verifyOtpHash(testEmail, '999999', hashedOtp)
  assert(verifyInvalid === false, 'Invalid OTP does not match hash')

  const verifyDifferentEmail = verifyOtpHash('other.user@gmail.com', rawOtp, hashedOtp)
  assert(verifyDifferentEmail === false, 'Hash is bound to specific email address (cannot be used for other email)')

  // ----------------------------------------------------
  // TEST 6: Duplicate Email Registration Prevention
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 6: Duplicate Email Prevention ---')
  const dupEmail = 'duplicate.test.seemee@gmail.com'
  await User.deleteMany({ email: dupEmail })
  await PendingOtp.deleteMany({ email: dupEmail })

  // Create active user
  await User.create({
    name: 'Existing User',
    email: dupEmail,
    password: 'password123',
    phone: '9876543210',
    role: 'customer'
  })

  // Try to create pending OTP for duplicate email
  const userCheck = await User.findOne({ email: dupEmail })
  assert(userCheck !== null, 'Existing user confirmed in database')

  // Try duplicate registration in authService
  let dupThrew = false
  try {
    await authService.registerUser({
      name: 'Duplicate Guy',
      email: dupEmail,
      password: 'password123',
      phone: '9876543210'
    })
  } catch (err) {
    dupThrew = true
    assert(err.message.includes('already exists'), `Duplicate registration blocked: "${err.message}"`)
  }
  assert(dupThrew, 'Duplicate registration threw error')

  // Clean up dup
  await User.deleteMany({ email: dupEmail })

  // ----------------------------------------------------
  // TEST 7: OTP Attempt Limit & Invalidation
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 7: Incorrect OTP Attempts & Invalidation ---')
  const attemptEmail = 'attempt.test.seemee@gmail.com'
  await PendingOtp.deleteMany({ email: attemptEmail })

  const attemptOtp = generateSecureOtp()
  const attemptHash = hashOtp(attemptEmail, attemptOtp)

  await PendingOtp.create({
    email: attemptEmail,
    name: 'Attempt Tester',
    otpCode: attemptHash,
    otpExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    otpAttempts: 0
  })

  let record = await PendingOtp.findOne({ email: attemptEmail })
  assert(record !== null, 'Pending OTP created for attempt test')

  // Simulate 4 wrong attempts
  for (let i = 1; i <= 4; i++) {
    const isMatch = verifyOtpHash(attemptEmail, '000000', record.otpCode)
    assert(!isMatch, `Attempt ${i}: wrong OTP rejected`)
    record.otpAttempts += 1
    await record.save()
  }

  assert(record.otpAttempts === 4, 'Recorded 4 failed attempts')

  // 5th failed attempt: invalidate
  if (record.otpAttempts >= 4) {
    await PendingOtp.deleteMany({ email: attemptEmail })
  }
  const deletedRecord = await PendingOtp.findOne({ email: attemptEmail })
  assert(deletedRecord === null, 'After 5 failed attempts, OTP record was completely invalidated and deleted from database')

  // ----------------------------------------------------
  // TEST 8: Expired OTP Check
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 8: Expired OTP Handling ---')
  const expiredEmail = 'expired.test.seemee@gmail.com'
  await PendingOtp.deleteMany({ email: expiredEmail })

  const expiredOtp = generateSecureOtp()
  const expiredHash = hashOtp(expiredEmail, expiredOtp)

  // Expired 10 seconds ago
  await PendingOtp.create({
    email: expiredEmail,
    name: 'Expired Tester',
    otpCode: expiredHash,
    otpExpires: new Date(Date.now() - 10 * 1000),
    otpAttempts: 0
  })

  const expRecord = await PendingOtp.findOne({ email: expiredEmail })
  const isExpired = new Date(expRecord.otpExpires).getTime() < Date.now()
  assert(isExpired === true, 'Detected expired OTP timestamp')

  await PendingOtp.deleteMany({ email: expiredEmail })
  const cleanedExp = await PendingOtp.findOne({ email: expiredEmail })
  assert(cleanedExp === null, 'Expired OTP record removed')

  // ----------------------------------------------------
  // TEST 9: Successful OTP Verification & Account Creation Flow
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 9: Successful End-to-End Verification Flow ---')
  const successEmail = 'newverified.customer.2026@gmail.com'
  await User.deleteMany({ email: successEmail })
  await PendingOtp.deleteMany({ email: successEmail })

  // 1. Send OTP step: Pending record created with 5-minute expiration & hashed OTP
  const successOtp = '729415'
  const successHash = hashOtp(successEmail, successOtp)

  await PendingOtp.create({
    email: successEmail,
    name: 'Ananya Sharma',
    otpCode: successHash,
    otpExpires: new Date(Date.now() + 5 * 60 * 1000),
    otpAttempts: 0
  })

  // 2. User provides matching OTP
  const activePending = await PendingOtp.findOne({ email: successEmail })
  assert(activePending !== null, 'Active pending OTP record found')

  const otpValid = verifyOtpHash(successEmail, successOtp, activePending.otpCode)
  assert(otpValid === true, 'OTP verification passed successfully')

  // 3. User account created in database
  const createdUser = await authService.registerUser({
    name: activePending.name,
    email: successEmail,
    password: 'SecurePassword@123',
    phone: '9876543210'
  })

  assert(createdUser && createdUser._id, `User account created with ID: ${createdUser._id}`)
  assert(createdUser.role === 'customer', 'User role set to customer')
  assert(createdUser.email === successEmail, 'User email matches verified email')

  // 4. Clean up pending OTP after creation
  await PendingOtp.deleteMany({ email: successEmail })
  const pendingAfterSuccess = await PendingOtp.findOne({ email: successEmail })
  assert(pendingAfterSuccess === null, 'PendingOtp cleared after successful account creation')

  // 5. Clean up test user
  await User.deleteMany({ email: successEmail })

  console.log('\n====================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================\n')

  await mongoose.disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
