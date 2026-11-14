import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../utils/gtm'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      trackPageView(pathname, document.title)
    } catch {
      // safe fallback
    }
  }, [pathname])

  return null
}

export default ScrollToTop
