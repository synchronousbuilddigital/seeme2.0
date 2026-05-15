import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook for detecting when an element is in viewport
 * Replaces Framer Motion's whileInView to avoid React key warnings
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isInView] - Ref to attach to element and visibility state
 */
export const useInView = (options = {}) => {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger once if 'once' option is true
        if (entry.isIntersecting) {
          setIsInView(true)
          if (options.once) {
            observer.unobserve(element)
          }
        } else if (!options.once) {
          setIsInView(false)
        }
      },
      {
        threshold: options.threshold || 0.3,
        rootMargin: options.rootMargin || '0px',
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [options.threshold, options.rootMargin, options.once])

  return [ref, isInView]
}
