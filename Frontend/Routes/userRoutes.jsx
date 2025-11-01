import { Routes, Route } from 'react-router-dom';
import Register from '../src/Pages/USER/Register';
import Login from '../src/Pages/USER/Login';
import HomePage from '../src/Pages/USER/Home'
import UserForgotPassword from '../src/Pages/USER/UserForgotPassword';
import UserResetPassword from '../src/Pages/USER/UserResetPassword';
import NotFoundPage from '../src/ui/NotFound';
import UserProfile from '../src/Pages/USER/UserProfile';
import CourseListing from '../src/Pages/USER/CourseListing';
import CourseDetail from '../src/Pages/USER/CourseDetail';
import Teachers from '../src/Pages/USER/Teachers';
import TutorDetail from '../src/Pages/USER/TutorDetail';
import AboutUs from '../src/Pages/USER/AboutUs';
import Contact from '../src/Pages/USER/Contact';
import Cart from '../src/Pages/USER/Cart';
import Wishlist from '../src/Pages/USER/Wishlist';
import Checkout from '../src/Pages/USER/Checkout';
import OrderSuccess from '../src/Pages/USER/OrderSuccess';
import MyOrders from '../src/Pages/USER/MyOrders';
import ProtectedRoute from '../src/components/RouteProtection/ProtectedRoute';
import GuestRoute from '../src/components/RouteProtection/GuestRoute';

const UserRoutes = () => {

    return (
        <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="forgot-password" element={
                <GuestRoute userType="user">
                    <UserForgotPassword />
                </GuestRoute>
            } />
            <Route path="reset-password/:token" element={
                <GuestRoute userType="user">
                    <UserResetPassword />
                </GuestRoute>
            } />
            <Route path="register" element={
                <GuestRoute userType="user">
                    <Register />
                </GuestRoute>
            } />
            <Route path="login" element={
                <GuestRoute userType="user">
                    <Login />
                </GuestRoute>
            } />

            {/* Protected routes - require user authentication */}
            <Route path="home" element={
                <ProtectedRoute userType="user">
                    <HomePage />
                </ProtectedRoute>
            } />
            <Route path="profile" element={
                <ProtectedRoute userType="user">
                    <UserProfile />
                </ProtectedRoute>
            } />
            <Route path="courses" element={
                <ProtectedRoute userType="user">
                    <CourseListing />
                </ProtectedRoute>
            } />
            <Route path="browse" element={
                <ProtectedRoute userType="user">
                    <CourseListing />
                </ProtectedRoute>
            } />
            <Route path="course/:courseId" element={
                <ProtectedRoute userType="user">
                    <CourseDetail />
                </ProtectedRoute>
            } />
            <Route path="teachers" element={
                <ProtectedRoute userType="user">
                    <Teachers />
                </ProtectedRoute>
            } />
            <Route path="tutor/:tutorId" element={
                <ProtectedRoute userType="user">
                    <TutorDetail />
                </ProtectedRoute>
            } />
            <Route path='aboutus' element={
                <ProtectedRoute userType="user">
                    <AboutUs />
                </ProtectedRoute>
            } />
            <Route path='contact' element={
                <ProtectedRoute userType="user">
                    <Contact />
                </ProtectedRoute>
            } />
            <Route path='cart' element={
                <ProtectedRoute userType="user">
                    <Cart />
                </ProtectedRoute>
            } />
            <Route path='wishlist' element={
                <ProtectedRoute userType="user">
                    <Wishlist />
                </ProtectedRoute>
            } />
            <Route path='checkout' element={
                <ProtectedRoute userType="user">
                    <Checkout />
                </ProtectedRoute>
            } />
            <Route path='order-success/:orderId' element={
                <ProtectedRoute userType="user">
                    <OrderSuccess />
                </ProtectedRoute>
            } />
            <Route path='orders' element={
                <ProtectedRoute userType="user">
                    <MyOrders />
                </ProtectedRoute>
            } />

            <Route path='*' element={<NotFoundPage />} />
        </Routes>
    )
}

export default UserRoutes