import TutorRegister from "../src/Pages/TUTOR/TutorRegister";
import { Routes, Route } from "react-router-dom";
import TutorLogin from "../src/Pages/TUTOR/TutorLogin";
const TutorRoutes = () => {
    return(
      <Routes>
        <Route path="register" element={<TutorRegister/>}/>
        <Route path="login" element={<TutorLogin/>}/>
      </Routes>
    )
}

export default TutorRoutes;