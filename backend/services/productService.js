import Product from '../models/Product.js'

export const getAllProducts = async (filters) => {
  const { category, featured, inCollection, minPrice, maxPrice, sortBy, page = 1, limit = 20 } = filters
  const filter = { isActive: true }
  
  if (category) filter.category = category
  if (featured) filter.featured = true
  if (inCollection) filter.inCollection = true
  if (filters.isNewArrival) filter.isNewArrival = true
  
  if (minPrice || maxPrice) {
    filter.price = {}
    if (minPrice) filter.price.$gte = Number(minPrice)
    if (maxPrice) filter.price.$lte = Number(maxPrice)
  }

  const skip = (page - 1) * limit
  
  let sortOptions = { createdAt: -1 }
  if (sortBy === 'price_asc') sortOptions = { price: 1 }
  if (sortBy === 'price_desc') sortOptions = { price: -1 }
  if (sortBy === 'newest') sortOptions = { createdAt: -1 }

  const products = await Product.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))

  const total = await Product.countDocuments(filter)

  return { products, total, pages: Math.ceil(total / limit), currentPage: Number(page) }
}

export const searchProducts = async (queryParams) => {
  const { q, category, minPrice, maxPrice, sortBy, page = 1, limit = 20 } = queryParams
  
  const filter = { isActive: true }
  
  if (q) {
    filter.$text = { $search: q }
  }

  if (category) filter.category = category
  
  if (minPrice || maxPrice) {
    filter.price = {}
    if (minPrice) filter.price.$gte = Number(minPrice)
    if (maxPrice) filter.price.$lte = Number(maxPrice)
  }

  const skip = (page - 1) * limit
  let sortOptions = { score: { $meta: 'textScore' } }
  
  if (sortBy === 'price_asc') sortOptions = { price: 1 }
  if (sortBy === 'price_desc') sortOptions = { price: -1 }
  if (sortBy === 'newest') sortOptions = { createdAt: -1 }

  const products = await Product.find(filter, { score: { $meta: 'textScore' } })
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))

  const total = await Product.countDocuments(filter)

  return { products, total, pages: Math.ceil(total / limit), currentPage: Number(page) }
}

export const getCollectionCount = async () => {
  return await Product.countDocuments({ inCollection: true, isActive: true })
}

export const getTopThreeProducts = async () => {
  // First try to get products marked as isNewArrival
  let products = await Product.find({ isNewArrival: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(3)
  
  // If not enough new arrivals, fill with collection products
  if (products.length < 3) {
    const remaining = 3 - products.length
    const collectionProducts = await Product.find({ 
      inCollection: true, 
      isActive: true,
      _id: { $nin: products.map(p => p._id) } 
    })
    .sort({ createdAt: -1 })
    .limit(remaining)
    
    products = [...products, ...collectionProducts]
  }

  return products
}

export const getUniqueCategories = async () => {
  return await Product.distinct('category', { isActive: true })
}

export const getProductById = async (id) => {
  const product = await Product.findById(id)
  if (!product) {
    throw new Error('Product not found')
  }
  return product
}

export const createProduct = async (productData) => {
  if (productData.inCollection) {
    const collectionCount = await getCollectionCount()
    if (collectionCount >= 15) {
      throw new Error('Collection is full. Maximum 15 products allowed in collection.')
    }
  }
  return await Product.create(productData)
}

export const updateProduct = async (id, productData) => {
  const existingProduct = await getProductById(id)
  
  if (productData.inCollection && !existingProduct.inCollection) {
    const collectionCount = await getCollectionCount()
    if (collectionCount >= 15) {
      throw new Error('Collection is full. Maximum 15 products allowed in collection.')
    }
  }
  
  return await Product.findByIdAndUpdate(
    id,
    productData,
    { new: true, runValidators: true }
  )
}

export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id)
  if (!product) {
    throw new Error('Product not found')
  }
  return product
}
