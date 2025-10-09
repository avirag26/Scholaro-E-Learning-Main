import {Routes, Route} from 'react-router-dom';
import Register from '../src/Pages/USER/Register';
import Login from '../src/Pages/USER/Login';
import HomePage from '../src/Pages/USER/Home'

const UserRoutes = ()=>{

    return(
        <Routes>
           <Route path="register" element={<Register/>}/>   
           <Route path="login" element={<Login/>}/>
           <Route path="home" element={<HomePage/>}/>
        </Routes>
    )
}

export default UserRoutes