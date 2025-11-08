import AdminLogin from "../src/Pages/USER/AdminLogin";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../src/Pages/ADMIN/AdminDashboard";
import AdminProfile from "../src/Pages/ADMIN/AdminProfile";
import NotFoundPage from "../src/ui/NotFound";
import Students from "../src/Pages/ADMIN/Students";
import Tutors from "../src/Pages/ADMIN/Tutors";
import ProtectedRoute from "../src/components/RouteProtection/ProtectedRoute";
import GuestRoute from "../src/components/RouteProtection/GuestRoute";
import Categories from "../src/Pages/ADMIN/Categories";
import CategoryCourses from "../src/Pages/ADMIN/CategoryCourses";
import TutorDetail from "../src/Pages/ADMIN/TutorDetail";
import Courses from "../src/Pages/ADMIN/Courses";
import CourseDetail from "../src/Pages/ADMIN/CourseDetail";
import LessonView from "../src/Pages/ADMIN/LessonView";
import Orders from "../src/Pages/ADMIN/Orders";
import OrderDetail from "../src/Pages/ADMIN/OrderDetail";
import AdminWallet from "../src/Pages/ADMIN/AdminWallet";

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="login" element={
                <GuestRoute userType="admin">
                    <AdminLogin />
                </GuestRoute>
            } />

            <Route path="dashboard" element={
                <ProtectedRoute userType="admin">
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            <Route path="students" element={
                <ProtectedRoute userType="admin">
                    <Students />
                </ProtectedRoute>
            } />

            <Route path="tutors" element={
                <ProtectedRoute userType="admin">
                    <Tutors />
                </ProtectedRoute>
            } />

            <Route path="profile" element={
                <ProtectedRoute userType="admin">
                    <AdminProfile />
                </ProtectedRoute>
            } />
            <Route path="categories" element={
                <ProtectedRoute userType="admin">
                    <Categories />
                </ProtectedRoute>
            } />

            <Route path="categories/:categoryId/courses" element={
                <ProtectedRoute userType="admin">
                    <CategoryCourses />
                </ProtectedRoute>
            } />

            <Route path="tutors/:tutorId/details" element={
                <ProtectedRoute userType="admin">
                    <TutorDetail />
                </ProtectedRoute>
            } />

            <Route path="courses" element={
                <ProtectedRoute userType="admin">
                    <Courses />
                </ProtectedRoute>
            } />

            <Route path="courses/:courseId/details" element={
                <ProtectedRoute userType="admin">
                    <CourseDetail />
                </ProtectedRoute>
            } />

            <Route path="lessons/:lessonId/view/:courseId" element={
                <ProtectedRoute userType="admin">
                    <LessonView />
                </ProtectedRoute>
            } />

            <Route path="orders" element={
                <ProtectedRoute userType="admin">
                    <Orders />
                </ProtectedRoute>
            } />

            <Route path="orders/:orderId" element={
                <ProtectedRoute userType="admin">
                    <OrderDetail />
                </ProtectedRoute>
            } />

            <Route path="wallet" element={
                <ProtectedRoute userType="admin">
                    <AdminWallet />
                </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default AdminRoutes;