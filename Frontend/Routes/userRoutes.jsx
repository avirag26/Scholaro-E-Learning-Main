import {Routes, Route} from 'react-router-dom';
import Register from '../src/Pages/USER/Register';
import Login from '../src/Pages/USER/Login';
import HomePage from '../src/Pages/USER/Home'
import UserForgotPassword from '../src/Pages/USER/UserForgotPassword';
import UserResetPassword from '../src/Pages/USER/UserResetPassword';
import NotFoundPage from '../src/ui/NotFound';
import UserProfile from '../src/Pages/USER/UserProfile';

const UserRoutes = ()=>{

    return(
        <Routes>
        
        <Route path="forgot-password" element={<UserForgotPassword />} />
        <Route path="reset-password/:token" element={<UserResetPassword />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />

       
          <Route path="home" element={<HomePage />} />
           <Route path="profile" element={<UserProfile/>}/>
         
            <Route path='*' element={<NotFoundPage/>}/>
        </Routes>
    )
}

export default UserRoutes