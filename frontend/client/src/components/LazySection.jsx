import { useState, useEffect, useRef } from 'react'

/**
 * High-performance viewport intersection wrapper for below-the-fold homepage sections.
 * Prevents unnecessary simultaneous network requests on page load until user scrolls nearby.
 * Uses a generous 450px rootMargin so sections load and paint seamlessly before entering the viewport.
 */
const LazySection = ({ children, minHeight = '320px', rootMargin = '450px' }) => {
  const [shouldRender, setShouldRender] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (shouldRender) return

    // Fallback if IntersectionObserver is unavailable
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldRender(true)
      return
    }

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold: 0
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [shouldRender, rootMargin])

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: shouldRender ? 'auto' : minHeight,
        width: '100%',
        contentVisibility: shouldRender ? 'visible' : 'auto'
      }}
    >
      {shouldRender ? children : null}
    </div>
  )
}

export default LazySection
