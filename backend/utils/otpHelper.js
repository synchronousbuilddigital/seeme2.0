import crypto from 'crypto'

/**
 * Generate a cryptographically secure 6-digit random OTP
 */
export const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString()
}

/**
 * Hash an OTP using HMAC-SHA256 bound to email and secret salt
 * Stored securely in database to ensure plaintext OTP is never persisted
 */
export const hashOtp = (email, otp) => {
  const secret = process.env.JWT_SECRET || 'seemee_secure_otp_salt_key_2026'
  const normalizedEmail = String(email || '').toLowerCase().trim()
  const cleanOtp = String(otp || '').trim()
  return crypto
    .createHmac('sha256', secret)
    .update(`${normalizedEmail}:${cleanOtp}`)
    .digest('hex')
}

/**
 * Verify a plaintext candidate OTP against a stored cryptographic hash in constant time
 */
export const verifyOtpHash = (email, candidateOtp, storedHash) => {
  if (!email || !candidateOtp || !storedHash) return false
  const candidateHash = hashOtp(email, candidateOtp)

  try {
    const bufCandidate = Buffer.from(candidateHash, 'hex')
    const bufStored = Buffer.from(storedHash, 'hex')

    if (bufCandidate.length !== bufStored.length) return false
    return crypto.timingSafeEqual(bufCandidate, bufStored)
  } catch (err) {
    return false
  }
}

