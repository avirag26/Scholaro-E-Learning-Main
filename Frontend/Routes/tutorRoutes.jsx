 import TutorRegister from "../src/Pages/TUTOR/TutorRegister";
import { Routes, Route } from "react-router-dom";
import TutorLogin from "../src/Pages/TUTOR/TutorLogin";
import TutorForgotPassword from "../src/Pages/TUTOR/TutorForgotPassword";
import TutorResetPassword from "../src/Pages/TUTOR/TutorResetPassword";
import TutorHome from "../src/Pages/TUTOR/TutorHome";
import NotFoundPage from '../src/ui/NotFound';
import TutorProfile from "../src/Pages/TUTOR/TutorProfile";
import TutorCourses from "../src/Pages/TUTOR/TutorCourses";
import AddCourse from "../src/Pages/TUTOR/AddCourse";
import AddLesson from "../src/Pages/TUTOR/AddLesson";
import EditCourse from "../src/Pages/TUTOR/EditCourse";
import EditLesson from "../src/Pages/TUTOR/EditLesson";
import TutorOrders from "../src/Pages/TUTOR/Orders";
import TutorOrderDetail from "../src/Pages/TUTOR/OrderDetail";
import TutorChat from "../src/Pages/TUTOR/Chat";
import TutorWallet from "../src/Pages/TUTOR/TutorWallet";
import ExamManagement from "../src/Pages/TUTOR/ExamManagement";
import ExamSettings from "../src/Pages/TUTOR/ExamSettings";
import CouponManagement from "../src/Pages/TUTOR/CouponManagement";

import ProtectedRoute from "../src/components/RouteProtection/ProtectedRoute";
import GuestRoute from "../src/components/RouteProtection/GuestRoute";



const TutorRoutes = () => {
  return (
    <Routes>
      <Route path="register" element={<GuestRoute userType="tutor"><TutorRegister /></GuestRoute>} />
      <Route path="login" element={<GuestRoute userType="tutor"><TutorLogin /></GuestRoute>} />
      <Route path="forgot-password" element={<GuestRoute userType="tutor"><TutorForgotPassword /></GuestRoute>} />
      <Route path="reset-password/:token" element={<GuestRoute userType="tutor"><TutorResetPassword /></GuestRoute>} />
      <Route path="home" element={<ProtectedRoute userType="tutor"><TutorHome /></ProtectedRoute>} />
      <Route path="profile" element={<ProtectedRoute userType="tutor"><TutorProfile /></ProtectedRoute>} />
      <Route path="courses" element={<ProtectedRoute userType="tutor"><TutorCourses /></ProtectedRoute>} />
      <Route path="add-course" element={<ProtectedRoute userType="tutor"><AddCourse /></ProtectedRoute>} />
      <Route path="edit-course/:courseId" element={<ProtectedRoute userType="tutor"><EditCourse /></ProtectedRoute>} />
      <Route path="add-lesson/:courseId" element={<ProtectedRoute userType="tutor"><AddLesson /></ProtectedRoute>} />
      <Route path="edit-lesson/:lessonId" element={<ProtectedRoute userType="tutor"><EditLesson /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute userType="tutor"><TutorOrders /></ProtectedRoute>} />
      <Route path="orders/:orderId" element={<ProtectedRoute userType="tutor"><TutorOrderDetail /></ProtectedRoute>} />
      <Route path="chat" element={<ProtectedRoute userType="tutor"><TutorChat /></ProtectedRoute>} />
      <Route path="wallet" element={<ProtectedRoute userType="tutor"><TutorWallet /></ProtectedRoute>} />
      <Route path="coupons" element={<ProtectedRoute userType="tutor"><CouponManagement /></ProtectedRoute>} />
      <Route path="course/:courseId/exam" element={<ProtectedRoute userType="tutor"><ExamManagement /></ProtectedRoute>} />
      <Route path="course/:courseId/final-lesson" element={<ProtectedRoute userType="tutor"><ExamSettings /></ProtectedRoute>} />
 


      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  )
}

export default TutorRoutes;