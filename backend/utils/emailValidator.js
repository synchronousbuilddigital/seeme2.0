import dns from 'dns'
import validator from 'validator'

/**
 * Common typo mapping for Gmail domains
 */
export const GMAIL_DOMAIN_TYPOS = {
  'hmail.com': 'gmail.com',
  'hmail.co': 'gmail.com',
  'hmail.in': 'gmail.com',
  'hmsil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmaul.com': 'gmail.com',
  'gmaol.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'fmail.com': 'gmail.com',
  'tmail.com': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmaii.com': 'gmail.com',
  'gimail.com': 'gmail.com',
  'googlemail.con': 'googlemail.com'
}

/**
 * Normalize an email address reliably
 */
export const normalizeEmailAddress = (email) => {
  if (!email || typeof email !== 'string') return ''
  const trimmed = email.trim().toLowerCase()
  const normalized = validator.normalizeEmail(trimmed, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    all_lowercase: true
  })
  return normalized || trimmed
}

/**
 * Perform DNS MX check with a hard timeout and graceful fallback
 */
export const checkDomainHasMx = async (domain = 'gmail.com', timeoutMs = 3000) => {
  const cleanDomain = String(domain || '').trim().toLowerCase()
  if (cleanDomain === 'gmail.com' || cleanDomain === 'googlemail.com') {
    return { ok: true }
  }

  return new Promise((resolve) => {
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve({ ok: true, timedOut: true })
      }
    }, timeoutMs)

    dns.promises.resolveMx(cleanDomain)
      .then((records) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          if (Array.isArray(records) && records.length > 0) {
            resolve({ ok: true })
          } else {
            resolve({ ok: false, reason: 'No MX mail records configured for domain' })
          }
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve({ ok: false, reason: err.code || err.message })
        }
      })
  })
}

/**
 * Synchronous email syntax & strict Gmail validation
 * Enforces ONLY @gmail.com (or @googlemail.com)
 */
export const validateEmailSyntax = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, error: 'Email address is required.' }
  }

  const clean = email.trim().toLowerCase()

  if (clean.length < 5 || clean.length > 254) {
    return { isValid: false, error: 'Email address length is invalid (must be between 5 and 254 characters).' }
  }

  // Reject illegal characters like =, spaces, quotes, etc.
  if (clean.includes('=') || /\s/.test(clean) || /[<>()\[\]\\;:",]/.test(clean)) {
    return { isValid: false, error: 'Email contains invalid characters (e.g. spaces or "=").' }
  }

  // Validate general format using standard validator library
  if (!validator.isEmail(clean, { allow_utf8_local_part: false, require_tld: true })) {
    return { isValid: false, error: 'Please enter a valid Gmail address (e.g. user@gmail.com).' }
  }

  const atParts = clean.split('@')
  if (atParts.length !== 2 || !atParts[0] || !atParts[1]) {
    return { isValid: false, error: 'Please enter a valid Gmail address with exactly one "@" symbol.' }
  }

  const [localPart, domainPart] = atParts

  // Typo check for common Gmail misspellings
  if (GMAIL_DOMAIN_TYPOS[domainPart]) {
    return {
      isValid: false,
      error: `Invalid email domain "@${domainPart}". Did you mean "@gmail.com"?`,
      suggestion: `${localPart}@gmail.com`
    }
  }

  // STRICT REQUIREMENT: Only @gmail.com or @googlemail.com is valid
  if (domainPart !== 'gmail.com' && domainPart !== 'googlemail.com') {
    return {
      isValid: false,
      error: 'Only @gmail.com email addresses are allowed. Please enter your Gmail address.'
    }
  }

  // Gmail-specific local part (username) rules
  const baseLocal = localPart.split('+')[0]

  if (baseLocal.length < 6) {
    return {
      isValid: false,
      error: `Gmail username must be at least 6 characters long (currently ${baseLocal.length}).`
    }
  }

  if (baseLocal.length > 30) {
    return {
      isValid: false,
      error: `Gmail username cannot exceed 30 characters (currently ${baseLocal.length}).`
    }
  }

  if (baseLocal.startsWith('.') || baseLocal.endsWith('.')) {
    return {
      isValid: false,
      error: 'Gmail username cannot start or end with a period (.).'
    }
  }

  if (baseLocal.includes('..')) {
    return {
      isValid: false,
      error: 'Gmail username cannot contain consecutive periods (..).'
    }
  }

  if (!/^[a-z0-9.]+$/i.test(baseLocal)) {
    return {
      isValid: false,
      error: 'Gmail addresses only allow letters (a-z), numbers (0-9), and periods (.).'
    }
  }

  if (/^\d+$/.test(baseLocal.replace(/\./g, ''))) {
    return {
      isValid: false,
      error: 'Gmail username cannot consist only of numbers.'
    }
  }

  return { isValid: true, cleanEmail: clean, domainPart, localPart }
}

/**
 * Full asynchronous email validator with syntax, strict Gmail check, and MX verification
 */
export const validateEmail = async (email) => {
  const syntaxCheck = validateEmailSyntax(email)
  if (!syntaxCheck.isValid) {
    return syntaxCheck
  }

  const { cleanEmail, domainPart } = syntaxCheck

  // DNS MX check
  const mxCheck = await checkDomainHasMx(domainPart)
  if (!mxCheck.ok) {
    return {
      isValid: false,
      error: `The email domain "${domainPart}" cannot receive emails. Please check for typos.`
    }
  }

  return {
    isValid: true,
    cleanEmail: normalizeEmailAddress(cleanEmail)
  }
}

