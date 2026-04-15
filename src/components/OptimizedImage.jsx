import { useState } from 'react'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './OptimizedImage.css'

const OptimizedImage = ({ 
  src, 
  alt, 
  size = 'card',
  className = '',
  loading = 'lazy',
  priority = false // Set true for above-fold images
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  // Generate blur placeholder (tiny, heavily blurred version)
  const blurUrl = getOptimizedImageUrl(src, 'thumbnail', { 
    width: 20, 
    quality: 10,
    blur: 2000 
  })

  // Generate responsive image URLs
  const thumbnailUrl = getOptimizedImageUrl(src, 'thumbnail')
  const cardUrl = getOptimizedImageUrl(src, 'card')
  const heroUrl = getOptimizedImageUrl(src, 'hero')

  // Determine main src based on size prop
  const mainSrc = size === 'hero' ? heroUrl : size === 'thumbnail' ? thumbnailUrl : cardUrl

  return (
    <div className={`optimized-image-wrapper ${className}`}>
      {/* Blur placeholder - shows while loading */}
      <img
        src={blurUrl}
        alt=""
        className={`optimized-image-blur ${isLoaded ? 'loaded' : ''}`}
        aria-hidden="true"
      />
      
      {/* Main image with responsive srcset */}
      <img
        src={mainSrc}
        srcSet={`
          ${thumbnailUrl} 400w,
          ${cardUrl} 800w,
          ${heroUrl} 1200w
        `}
        sizes="(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px"
        alt={alt}
        loading={priority ? 'eager' : loading}
        className={`optimized-image-main ${isLoaded ? 'loaded' : ''}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  )
}

export default OptimizedImage
