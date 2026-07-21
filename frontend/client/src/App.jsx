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
import GlobalLoader from './components/GlobalLoader'
import './App.css'

// Lazy load below-the-fold components
const CategoriesSlider = lazy(() => import('./components/CategoriesSlider'))
const About = lazy(() => import('./components/About'))
const ShopSection = lazy(() => import('./components/ShopSection'))
const FabricSection = lazy(() => import('./components/FabricSection'))

// Lazy load route pages
const Auth = lazy(() => import('./pages/Auth'))
const Orders = lazy(() => import('./pages/Orders'))
const CartPage = lazy(() => import('./pages/CartPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const MagazinePage = lazy(() => import('./pages/MagazinePage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Search = lazy(() => import('./pages/Search'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const FabricsPage = lazy(() => import('./pages/FabricsPage'))

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
          <ShopSection />
          <FabricSection />
          <CategoriesSlider />
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
        <GlobalLoader />
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
                {/* Auth Page */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Orders Page */}
                <Route path="/orders" element={<PageWithNav><Orders /></PageWithNav>} />

                {/* Account Page */}
                <Route path="/account" element={<PageWithNav><AccountPage /></PageWithNav>} />

                {/* Cart Page */}
                <Route path="/cart" element={<PageWithNav><CartPage /></PageWithNav>} />

                {/* Checkout Page */}
                <Route path="/checkout" element={<PageWithNav><Checkout /></PageWithNav>} />

                {/* Magazine Page */}
                <Route path="/magazine" element={
                  <>
                    <Navbar
                      onCartOpen={() => setIsCartOpen(true)}
                      onWishlistOpen={() => setIsWishlistOpen(true)}
                    />
                    <main>
                      <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
                        <MagazinePage />
                      </Suspense>
                    </main>
                    <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                    <Wishlist isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
                  </>
                } />

                {/* Collections Page */}
                <Route path="/collections" element={<PageWithNav><CollectionsPage /></PageWithNav>} />

                {/* Redirect New Arrivals to Collections */}
                <Route path="/new-arrivals" element={<Navigate to="/collections" replace />} />

                {/* About Page */}
                <Route path="/about" element={<PageWithNav><AboutPage /></PageWithNav>} />
				<Route path="/fabrics" element={<PageWithNav><FabricsPage /></PageWithNav>} />

                {/* Search Page */}
                <Route path="/search" element={<PageWithNav><Search /></PageWithNav>} />

                {/* Wishlist Page */}
                <Route path="/wishlist" element={<PageWithNav><WishlistPage /></PageWithNav>} />

                {/* Dynamic Category Page */}
                <Route path="/category/:categoryName" element={<PageWithNav><CategoryPage /></PageWithNav>} />

                {/* Dynamic Product Detail Page */}
                <Route path="/product/:id" element={<PageWithNav><ProductPage /></PageWithNav>} />

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
