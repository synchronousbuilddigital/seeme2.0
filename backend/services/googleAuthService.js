/**
 * Google OAuth 2.0 Integration Service
 * Uses native fetch and URLSearchParams for clean, lightweight token exchange and profile retrieval.
 */

export const getGoogleAuthUrl = (state) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is missing')
  }

  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  const scope = ['openid', 'email', 'profile'].join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    state: state,
    prompt: 'select_account',
    access_type: 'offline'
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export const getGoogleUserFromCode = async (code) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are missing')
  }

  // 1. Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const tokenData = await tokenResponse.json()

  if (!tokenResponse.ok) {
    console.error('❌ Google Token Exchange Error:', tokenData)
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google')
  }

  const { access_token } = tokenData

  // 2. Retrieve Google user profile via UserInfo endpoint
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })

  const profile = await userResponse.json()

  if (!userResponse.ok) {
    console.error('❌ Google UserInfo Fetch Error:', profile)
    throw new Error('Failed to fetch user profile from Google')
  }

  return {
    googleId: profile.sub,
    email: profile.email,
    emailVerified: profile.email_verified,
    name: profile.name || profile.given_name || 'Google User',
    avatar: profile.picture
  }
}
