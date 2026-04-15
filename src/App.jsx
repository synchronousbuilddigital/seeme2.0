import { useState, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// Critical components - loaded immediately (above the fold)
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Footer from './components/Footer'
import NewArrivals from './components/NewArrivals'
import ScrollToTop from './components/ScrollToTop'
import Cart from './components/Cart'
import Wishlist from './components/Wishlist'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import './App.css'

// Lazy load below-the-fold components
const CategoriesSlider = lazy(() => import('./components/CategoriesSlider'))
const Fabrics = lazy(() => import('./components/Categories'))
const FeaturedCollection = lazy(() => import('./components/FeaturedCollection'))
const Magazine = lazy(() => import('./components/Magazine'))
const About = lazy(() => import('./components/About'))

// Lazy load route pages
const Auth = lazy(() => import('./pages/Auth'))
const Orders = lazy(() => import('./pages/Orders'))
const CartPage = lazy(() => import('./pages/CartPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const MagazinePage = lazy(() => import('./pages/MagazinePage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'))
const FabricsPage = lazy(() => import('./pages/FabricsPage'))
const AnarkaliPage = lazy(() => import('./pages/AnarkaliPage'))
const PalazzoPage = lazy(() => import('./pages/PalazzoPage'))
const StraightCutPage = lazy(() => import('./pages/StraightCutPage'))
const ShararaPage = lazy(() => import('./pages/ShararaPage'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)

  const HomePage = () => (
    <>
      <Navbar 
        onCartOpen={() => setIsCartOpen(true)} 
        onWishlistOpen={() => setIsWishlistOpen(true)}
      />
      <main>
        <Hero />
        <NewArrivals />
        <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
          <CategoriesSlider />
          <Fabrics />
          <FeaturedCollection />
          <Magazine />
          <About />
        </Suspense>
      </main>
      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Wishlist isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </>
  )

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
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <ScrollToTop />
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
                {/* Admin Routes */}
                <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                
                {/* Auth Page */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Orders Page */}
                <Route path="/orders" element={<Orders />} />

                {/* Cart Page */}
                <Route path="/cart" element={<PageWithNav><CartPage /></PageWithNav>} />

                {/* Checkout Page */}
                <Route path="/checkout" element={<PageWithNav><Checkout /></PageWithNav>} />

                {/* Magazine Page */}
                <Route path="/magazine" element={<PageWithNav><MagazinePage /></PageWithNav>} />

                {/* Collections Page */}
                <Route path="/collections" element={<PageWithNav><CollectionsPage /></PageWithNav>} />

                {/* New Arrivals Page */}
                <Route path="/new-arrivals" element={<PageWithNav><NewArrivalsPage /></PageWithNav>} />

                {/* Fabrics Page */}
                <Route path="/fabrics" element={<PageWithNav><FabricsPage /></PageWithNav>} />

                {/* Category Pages */}
                <Route path="/category/anarkali" element={<PageWithNav><AnarkaliPage /></PageWithNav>} />
                <Route path="/category/palazzo" element={<PageWithNav><PalazzoPage /></PageWithNav>} />
                <Route path="/category/straight-cut" element={<PageWithNav><StraightCutPage /></PageWithNav>} />
                <Route path="/category/sharara" element={<PageWithNav><ShararaPage /></PageWithNav>} />

                {/* Home Page */}
                <Route path="/*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
