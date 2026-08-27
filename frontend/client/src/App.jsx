import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
// Critical components - loaded immediately (above the fold)
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CategoryTabs from './components/CategoryTabs'
import Footer from './components/Footer'
import NewArrivals from './components/NewArrivals'
import BrandsThatLead from './components/BrandsThatLead'
import ScrollToTop from './components/ScrollToTop'
import InstallAppWidget from './components/InstallAppWidget'
import Cart from './components/Cart'
import Wishlist from './components/Wishlist'
import ProductPage from './pages/ProductPage'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import GlobalLoader from './components/GlobalLoader'
import { getAdminUrl } from './config/api'
import './App.css'

// Lazy load below-the-fold components
const CategoriesSlider = lazy(() => import('./components/CategoriesSlider'))
const About = lazy(() => import('./components/About'))
const ShopSection = lazy(() => import('./components/ShopSection'))
const FabricSection = lazy(() => import('./components/FabricSection'))
const EthosBanner = lazy(() => import('./components/EthosBanner'))
const CatalogSection = lazy(() => import('./components/CatalogSection'))

// Lazy load route pages
const Auth = lazy(() => import('./pages/Auth'))
const Orders = lazy(() => import('./pages/Orders'))
const CartPage = lazy(() => import('./pages/CartPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const MagazinePage = lazy(() => import('./pages/MagazinePage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Search = lazy(() => import('./pages/Search'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const FabricsPage = lazy(() => import('./pages/FabricsPage'))
const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'))
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const AdminRedirect = () => {
  useEffect(() => {
    const cleanPath = window.location.pathname.replace(/^\/admin/, '') || '/dashboard'
    const token = localStorage.getItem('adminToken') || localStorage.getItem('seemee-token') || ''
    const userStr = localStorage.getItem('adminUser') || localStorage.getItem('seemee-user') || ''
    
    let targetUrl = `${getAdminUrl()}${cleanPath === '/' ? '/dashboard' : cleanPath}`
    const searchParams = new URLSearchParams(window.location.search)

    if (token && userStr) {
      searchParams.set('token', token)
      searchParams.set('user', userStr)
    }

    const queryString = searchParams.toString()
    if (queryString) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString
    }

    window.location.href = targetUrl
  }, [])
  return null
}

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)

  const HomePage = () => {
    const [activeAudience, setActiveAudience] = useState('all')

    useEffect(() => {
      const themeClass = `theme-${activeAudience || 'all'}`
      document.body.classList.remove('theme-all', 'theme-men', 'theme-women')
      document.body.classList.add(themeClass)

      return () => {
        document.body.classList.remove('theme-all', 'theme-men', 'theme-women')
      }
    }, [activeAudience])

    return (
      <div className={`store-theme-wrapper theme-${activeAudience || 'all'}`}>
        <Navbar
          onCartOpen={() => setIsCartOpen(true)}
          onWishlistOpen={() => setIsWishlistOpen(true)}
        />
        <main className={`homepage-main theme-${activeAudience || 'all'}`}>
          <Hero activeAudience={activeAudience} />
          <CategoryTabs onTabChange={(tab) => setActiveAudience(tab)} />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAudience === 'men' ? 'men-brands' : 'other-arrivals'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeAudience === 'men' ? (
                <BrandsThatLead activeAudience={activeAudience} />
              ) : (
                <NewArrivals activeAudience={activeAudience} />
              )}
            </motion.div>
          </AnimatePresence>
          <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
            <ShopSection activeAudience={activeAudience} />
            <CategoriesSlider activeAudience={activeAudience} />
            <CatalogSection activeAudience={activeAudience} />
            <EthosBanner />
            <About />
          </Suspense>
        </main>
        <Footer />
        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <Wishlist isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      </div>
    )
  }

  const PageWithNav = ({ children }) => (
    <>
      <Navbar
        onCartOpen={() => setIsCartOpen(true)}
        onWishlistOpen={() => setIsWishlistOpen(true)}
      />
      <main>
        <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Wishlist isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </>
  )

  return (
    <AuthProvider>
      <CartProvider>
        <GlobalLoader />
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <ScrollToTop />
          <InstallAppWidget />
          <div className="app">
            <Suspense fallback={
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                color: 'var(--charcoal)'
              }}>
                Loading...
              </div>
            }>
              <Routes>
                {/* Admin Redirects to Standalone App on Port 3001 */}
                <Route path="/admin" element={<AdminRedirect />} />
                <Route path="/admin/*" element={<AdminRedirect />} />

                {/* Auth Page */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Orders Page */}
                <Route path="/orders" element={<PageWithNav><Orders /></PageWithNav>} />

                {/* Account Page */}
                <Route path="/account" element={<PageWithNav><AccountPage /></PageWithNav>} />

                {/* Cart Page */}
                <Route path="/cart" element={<PageWithNav><CartPage /></PageWithNav>} />

                {/* Checkout Page */}
                <Route path="/checkout" element={<PageWithNav><Checkout /></PageWithNav>} />

                {/* Catalog Reels Page */}
                <Route path="/catalog" element={<PageWithNav><CatalogPage /></PageWithNav>} />

                {/* Magazine Page */}
                <Route path="/magazine" element={<PageWithNav><MagazinePage /></PageWithNav>} />

                {/* Categories & Collections Page */}
                <Route path="/categories" element={<PageWithNav><CategoriesPage /></PageWithNav>} />
                <Route path="/collections" element={<PageWithNav><CollectionsPage /></PageWithNav>} />

                {/* Redirect New Arrivals to Collections */}
                <Route path="/new-arrivals" element={<Navigate to="/collections" replace />} />

                {/* About & Contact Pages */}
                <Route path="/about" element={<PageWithNav><AboutPage /></PageWithNav>} />
                <Route path="/contact" element={<PageWithNav><ContactPage /></PageWithNav>} />
                <Route path="/contact-us" element={<PageWithNav><ContactPage /></PageWithNav>} />
				<Route path="/fabrics" element={<PageWithNav><FabricsPage /></PageWithNav>} />

                {/* Footer Policy Pages */}
                <Route path="/privacy" element={<PageWithNav><PrivacyPolicyPage /></PageWithNav>} />
                <Route path="/privacy-policy" element={<PageWithNav><PrivacyPolicyPage /></PageWithNav>} />
                <Route path="/terms" element={<PageWithNav><TermsConditionsPage /></PageWithNav>} />
                <Route path="/terms-conditions" element={<PageWithNav><TermsConditionsPage /></PageWithNav>} />
                <Route path="/terms-and-conditions" element={<PageWithNav><TermsConditionsPage /></PageWithNav>} />
                <Route path="/return-policy" element={<PageWithNav><ReturnPolicyPage /></PageWithNav>} />
                <Route path="/returns" element={<PageWithNav><ReturnPolicyPage /></PageWithNav>} />
                <Route path="/return-exchange-policy" element={<PageWithNav><ReturnPolicyPage /></PageWithNav>} />

                {/* Search Page */}
                <Route path="/search" element={<PageWithNav><Search /></PageWithNav>} />

                {/* Wishlist Page */}
                <Route path="/wishlist" element={<PageWithNav><WishlistPage /></PageWithNav>} />

                {/* Dynamic Category Page */}
                <Route path="/category/:categoryName" element={<PageWithNav><CategoryPage /></PageWithNav>} />

                {/* Dynamic Product Detail Page */}
                <Route path="/product/:id" element={<PageWithNav><ProductPage /></PageWithNav>} />

                {/* Home Page */}
                <Route path="/" element={<HomePage />} />

                {/* 404 Not Found Catch-All Route */}
                <Route path="*" element={<PageWithNav><NotFoundPage /></PageWithNav>} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}


export default App
