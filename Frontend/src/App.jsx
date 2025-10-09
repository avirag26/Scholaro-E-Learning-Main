
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserRoutes from "../Routes/userRoutes"
import TutorRoutes from "../Routes/tutorRoutes";
import LandingPage from "./Landing/LandingPage"
import NotFoundPage from "./ui/NotFound";
function App() {


  return (
    <> 
    <Router>
      <Routes>
        
       <Route path="/" element={<LandingPage/>}/>

       <Route path="/user/*" element={<UserRoutes/>}/>
       <Route path ='/tutor/*' element={<TutorRoutes/>}/>
        <Route path="*" element={<NotFoundPage/>}/>
       
      </Routes>
    </Router>
  
    </>
  )
}

export default App
