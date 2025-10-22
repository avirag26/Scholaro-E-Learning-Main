import AdminLogin from "../src/Pages/ADMIN/TutorLogin";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../src/Pages/ADMIN/AdminDashboard";
import AdminProfile from "../src/Pages/ADMIN/AdminProfile";
import NotFoundPage from "../src/ui/NotFound";
import Students from "../src/Pages/ADMIN/Students";
import Tutors from "../src/Pages/ADMIN/Tutors";
import ProtectedRoute from "../src/components/RouteProtection/ProtectedRoute";
import GuestRoute from "../src/components/RouteProtection/GuestRoute";
import Categories from "../src/Pages/ADMIN/Categories";

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
            <Route path="category" element={
                <ProtectedRoute userType="admin">
                    <Categories />
                </ProtectedRoute>
            }/>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default AdminRoutes;