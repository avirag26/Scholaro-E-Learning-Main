import AdminLogin from "../src/Pages/ADMIN/TutorLogin";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../src/Pages/ADMIN/AdminDashboard";
import NotFoundPage from "../src/ui/NotFound";
import Students from "../src/Pages/ADMIN/Students";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="students" element={<Students />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;
