import TutorRegister from "../src/Pages/TUTOR/TutorRegister";
import { Routes, Route } from "react-router-dom";
import TutorLogin from "../src/Pages/TUTOR/TutorLogin";
import TutorForgotPassword from "../src/Pages/TUTOR/TutorForgotPassword";
import TutorResetPassword from "../src/Pages/TUTOR/TutorResetPassword";
import TutorHome from "../src/Pages/TUTOR/TutorHome";
const TutorRoutes = () => {
    return(
      <Routes>
        <Route path="register" element={<TutorRegister/>}/>
        <Route path="login" element={<TutorLogin/>}/>
         <Route path="forgot-password" element={<TutorForgotPassword />} />
          <Route path="reset-password/:token" element={<TutorResetPassword />} />
           <Route path="home" element={<TutorHome />} />
      </Routes>
    )
}

export default TutorRoutes;