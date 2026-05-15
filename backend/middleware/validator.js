import { body, validationResult } from 'express-validator'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }))

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors
  })
}

// Auth Validations
export const registerValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ]
}

export const loginValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ]
}

// Product Validations
export const productValidationRules = () => {
  return [
    body('name').optional().notEmpty().withMessage('Product name is required').trim(),
    body('description').optional().notEmpty().withMessage('Description is required'),
    body('price').optional().isNumeric().withMessage('Price must be a number'),
    body('category').optional().notEmpty().withMessage('Category is required'),
    body('stock').optional().isNumeric().withMessage('Stock must be a number'),
  ]
}

// Order Validations
export const orderValidationRules = () => {
  return [
    body('customer.name').notEmpty().withMessage('Customer name is required'),
    body('customer.email').isEmail().withMessage('Valid customer email is required'),
    body('customer.phone').notEmpty().withMessage('Phone number is required'),
    body('customer.address.street').notEmpty().withMessage('Street address is required'),
    body('customer.address.city').notEmpty().withMessage('City is required'),
    body('customer.address.state').notEmpty().withMessage('State is required'),
    body('customer.address.pincode').notEmpty().withMessage('Pincode is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('paymentMethod').isIn(['cod', 'online']).withMessage('Invalid payment method'),
  ]
}
