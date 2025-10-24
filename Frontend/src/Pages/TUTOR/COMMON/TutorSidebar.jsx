import { useState, useEffect } from "react";
import { FaPlus, FaUser, FaBook, FaChartBar, FaComments, FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const TutorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tutorName, setTutorName] = useState("Tutor");
  const profileImage = "https://randomuser.me/api/portraits/men/75.jpg";

  const [tutorProfileImage, setTutorProfileImage] = useState(profileImage);

  useEffect(() => {
    const loadTutorInfo = () => {
      const tutorInfo = localStorage.getItem('tutorInfo');
      if (tutorInfo) {
        try {
          const parsedTutorInfo = JSON.parse(tutorInfo);
          setTutorName(parsedTutorInfo.name || 'Tutor');
          setTutorProfileImage(parsedTutorInfo.profileImage || profileImage);
        } catch (error) {
          setTutorName('Tutor');
        }
      }
    };

    loadTutorInfo();

    
    const handleStorageChange = (e) => {
      if (e.key === 'tutorInfo') {
        loadTutorInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    

    const handleTutorInfoUpdate = () => {
      loadTutorInfo();
    };
    
    window.addEventListener('tutorInfoUpdated', handleTutorInfoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tutorInfoUpdated', handleTutorInfoUpdate);
    };
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("tutorAuthToken");
        localStorage.removeItem("tutorInfo");

        Swal.fire({
          icon: "success",
          title: "Logged out!",
          text: "You have successfully logged out.",
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate("/tutor/login");
        }, 1500);
      }
    });
  };

  const menuItems = [
    { path: '/tutor/home', icon: FaChartBar, label: 'Dashboard' },
    { path: '/tutor/profile', icon: FaUser, label: 'Profile' },
    { path: '/tutor/courses', icon: FaBook, label: 'Courses' },
    { path: '/tutor/revenues', icon: FaChartBar, label: 'Revenues' },
    { path: '/tutor/chat', icon: FaComments, label: 'Chat & video' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-white mx-4 my-6 rounded-2xl shadow-md flex flex-col items-center py-8">
      <img src={tutorProfileImage} className="w-24 h-24 rounded-full shadow object-cover" alt="profile" />
      <div className="mt-4 text-sky-500 font-semibold text-lg">{tutorName}</div>
      <button className="mt-2 px-4 py-1 bg-sky-50 rounded-full text-sky-600 text-sm border flex items-center gap-1 hover:bg-sky-100 transition">
        Share Profile
      </button>
      
      <ul className="w-full mt-6">
        {menuItems.map((item) => (
          <li
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center px-8 py-2 rounded-l-full cursor-pointer mb-1 ${
              isActive(item.path)
                ? 'bg-sky-500 text-white font-semibold'
                : 'text-sky-500 hover:bg-sky-50'
            }`}
          >
            <item.icon className="mr-3" /> {item.label}
          </li>
        ))}
        
        <li 
          className="flex items-center px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer" 
          onClick={handleLogout}
        >
          <FaSignOutAlt className="mr-3" /> LogOut
        </li>
      </ul>
      
      <button className="mt-8 bg-sky-500 text-white px-8 py-3 rounded-full flex items-center gap-2 text-lg font-semibold shadow hover:bg-sky-600 transition">
        <FaPlus /> Add New Course
      </button>
    </aside>
  );
};

export default TutorSidebar;