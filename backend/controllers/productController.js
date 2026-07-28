import * as productService from '../services/productService.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts(req.query)
  res.json({ success: true, data: result.products, ...result })
})

export const searchProducts = asyncHandler(async (req, res) => {
  const result = await productService.searchProducts(req.query)
  res.json({ success: true, data: result.products, ...result })
})

export const getTopThreeProducts = asyncHandler(async (req, res) => {
  const products = await productService.getTopThreeProducts()
  res.json({ success: true, data: products })
})

export const getCollectionCount = asyncHandler(async (req, res) => {
  const count = await productService.getCollectionCount()
  res.json({ success: true, count })
})

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getUniqueCategories()
  res.json({ success: true, data: categories })
})

export const getProduct = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true' || req.query.includeInactive === true
  const product = await productService.getProductById(req.params.id)
  
  if (!includeInactive && product.isActive === false) {
    res.status(404)
    throw new Error('Product not found or currently unavailable')
  }

  res.json({ success: true, data: product })
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body)
  res.status(201).json({ success: true, data: product })
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body)
  res.json({ success: true, data: product })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id)
  res.json({ success: true, message: 'Product deleted' })
})
