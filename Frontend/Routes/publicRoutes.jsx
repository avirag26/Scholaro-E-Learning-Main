import { Routes, Route } from 'react-router-dom';
import CourseListing from '../src/Pages/USER/CourseListing';
import CourseDetail from '../src/Pages/USER/CourseDetail';
import Teachers from '../src/Pages/USER/Teachers';
import TutorDetail from '../src/Pages/USER/TutorDetail';
import AboutUs from '../src/Pages/USER/AboutUs';
import Contact from '../src/Pages/USER/Contact';
import HomePage from '../src/Pages/USER/Home';
import NotFoundPage from '../src/ui/NotFound';

const PublicRoutes = () => {
    return (
        <Routes>
            {/* Public browsing routes - no authentication required */}
            <Route path="home" element={<HomePage />} />
            <Route path="courses" element={<CourseListing />} />
            <Route path="browse" element={<CourseListing />} />
            <Route path="course/:courseId" element={<CourseDetail />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="tutor/:tutorId" element={<TutorDetail />} />
            <Route path="aboutus" element={<AboutUs />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default PublicRoutes;