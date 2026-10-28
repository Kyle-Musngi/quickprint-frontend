import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import ShopDiscovery from './pages/ShopDiscovery/ShopDiscovery';
import ShopDetails from './pages/ShopDetails/ShopDetails';
import UploadPrint from './pages/UploadPrint/UploadPrint';
import OrderReview from './pages/OrderReview/OrderReview';
import OrderSummary from './pages/OrderSummary/OrderSummary';
import PaymentPickup from './pages/PaymentPickup/PaymentPickup';
import PaymentResult from './pages/PaymentResult/PaymentResult';
import OrderTracking from './pages/OrderTracking/OrderTracking';
import CustomerDashboard from './pages/CustomerDashboard/CustomerDashboard';
import CustomerOrders from './pages/CustomerOrders/CustomerOrders';
import CustomerNotifications from './pages/CustomerNotifications/CustomerNotifications';
import CustomerProfile from './pages/CustomerProfile/CustomerProfile';
import ShopRegistration from './pages/ShopRegistration/ShopRegistration';
import ShopDashboard from './pages/ShopDashboard/ShopDashboard';
import ShopOrders from './pages/ShopOrders/ShopOrders';
import ShopServices from './pages/ShopServices/ShopServices';
import ShopSettings from './pages/ShopSettings/ShopSettings';
import ShopAnalytics from './pages/ShopAnalytics/ShopAnalytics';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminShopApprovals from './pages/AdminShopApprovals/AdminShopApprovals';
import AdminSupportQuestions from './pages/AdminSupportQuestions/AdminSupportQuestions';
import CustomerSupportQuestions from './pages/CustomerSupportQuestions/CustomerSupportQuestions';
import NotFound from './pages/NotFound/NotFound';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/shops" element={<ShopDiscovery />} />
                <Route path="/shops/:id" element={<ShopDetails />} />

                {/* Customer Workflow */}
                <Route
                  path="/upload-print"
                  element={
                    <ProtectedRoute>
                      <UploadPrint />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-review"
                  element={
                    <ProtectedRoute>
                      <OrderReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-summary/:id"
                  element={
                    <ProtectedRoute>
                      <OrderSummary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/:id"
                  element={
                    <ProtectedRoute>
                      <PaymentPickup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-result"
                  element={
                    <ProtectedRoute>
                      <PaymentResult />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tracking/:id"
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  }
                />

                {/* Customer Account & Dashboard */}
                <Route
                  path="/customer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/orders"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <CustomerOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/notifications"
                  element={
                    <ProtectedRoute>
                      <CustomerNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/profile"
                  element={
                    <ProtectedRoute>
                      <CustomerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/questions"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <CustomerSupportQuestions />
                    </ProtectedRoute>
                  }
                />

                {/* Shop Partner Portal */}
                <Route
                  path="/shop-registration"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'shop_owner', 'admin']}>
                      <ShopRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'shop_staff', 'admin']}>
                      <ShopDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/reviews"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'admin']}>
                      <ShopDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/orders"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'shop_staff', 'admin']}>
                      <ShopOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'shop_staff', 'admin']}>
                      <ShopOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/services"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'admin']}>
                      <ShopServices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/settings"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'admin']}>
                      <ShopSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['shop_owner', 'admin']}>
                      <ShopAnalytics />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Panel */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/approvals"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminShopApprovals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSupportQuestions />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
