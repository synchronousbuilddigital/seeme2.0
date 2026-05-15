/**
 * Wraps an async route handler to catch errors and forward them to Express error middleware.
 * When a controller does: res.status(404); throw new Error('Not found')
 * This catches it and sends { success: false, message: 'Not found' } with status 404.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // If res.statusCode was set before the throw, use it; otherwise 500
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
    err.statusCode = statusCode
    next(err)
  })
}

export default asyncHandler
