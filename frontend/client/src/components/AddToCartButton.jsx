import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './AddToCartButton.css'

const AddToCartButton = ({
  product,
  selectedSize = null,
  label = '+ Add',
  variant = 'mini',
  className = '',
  disabled = false,
  showIcon = false,
  showInBagLabel = false,
  onAddCallback = null
}) => {
  const { getItemQuantity, increaseQuantity, decreaseQuantity } = useCart()
  const navigate = useNavigate()

  if (!product) return null

  const productId = product._id || product.id
  const qty = getItemQuantity(productId, selectedSize)

  const handleAdd = (e) => {
    e.stopPropagation()
    if (disabled || product.stock === 0) return
    const success = increaseQuantity(product, selectedSize, navigate)
    if (success && onAddCallback) onAddCallback()
  }

  const handleDecrease = (e) => {
    e.stopPropagation()
    decreaseQuantity(productId, selectedSize)
  }

  const handleIncrease = (e) => {
    e.stopPropagation()
    increaseQuantity(product, selectedSize, navigate)
  }

  if (qty > 0) {
    return (
      <div 
        className={`add-to-cart-qty-control variant-${variant} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          className="qty-btn qty-btn-minus" 
          onClick={handleDecrease}
          aria-label="Decrease quantity"
          title="Decrease quantity"
        >
          &minus;
        </button>
        <div className="qty-val-badge">
          <span className="qty-count-val">{qty}</span>
          {showInBagLabel && <span className="qty-in-bag-label">in bag</span>}
        </div>
        <button 
          type="button"
          className="qty-btn qty-btn-plus" 
          onClick={handleIncrease}
          aria-label="Increase quantity"
          title="Increase quantity"
        >
          &#43;
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`add-to-cart-action-btn variant-${variant} ${className}`}
      onClick={handleAdd}
      disabled={disabled || product.stock === 0}
    >
      {showIcon && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '2px' }}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
      )}
      <span>{product.stock === 0 ? 'Sold Out' : label}</span>
    </button>
  )
}

export default AddToCartButton
