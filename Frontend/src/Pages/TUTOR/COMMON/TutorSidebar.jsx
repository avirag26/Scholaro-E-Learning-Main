import React from "react";
import { FaPlus, FaUser, FaBook, FaChartBar, FaComments, FaSignOutAlt, FaShoppingBag, FaWallet, FaDollarSign } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentTutor } from "../../../hooks/useCurrentTutor";
import { useLogout } from "../../../hooks/useLogout";
const TutorSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tutor } = useCurrentTutor();
  const { logout } = useLogout('tutor');
  const profileImage = "https://randomuser.me/api/portraits/men/75.jpg";
  const handleLogout = async () => {
    await logout();
  };
  const menuItems = [
    { path: '/tutor/home', icon: FaChartBar, label: 'Dashboard' },
    { path: '/tutor/profile', icon: FaUser, label: 'Profile' },
    { path: '/tutor/courses', icon: FaBook, label: 'Courses' },
    { path: '/tutor/orders', icon: FaShoppingBag, label: 'Orders' },
    { path: '/tutor/wallet', icon: FaWallet, label: 'Wallet' },
    {path:'/tutor/coupons',  icon:FaDollarSign, label: "Coupon"},
    { path: '/tutor/chat', icon: FaComments, label: 'Chat & video' },
  ];
  const isActive = (path) => location.pathname === path;
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white mx-4 my-6 rounded-2xl shadow-md flex-col items-center py-8 flex-shrink-0">
        <img src={tutor?.profileImage || profileImage} className="w-20 h-20 xl:w-24 xl:h-24 rounded-full shadow object-cover" alt="profile" />
        <div className="mt-4 text-sky-500 font-semibold text-base xl:text-lg text-center px-2">{tutor?.name || 'Tutor'}</div>
        <button className="mt-2 px-3 py-1 bg-sky-50 rounded-full text-sky-600 text-xs xl:text-sm border flex items-center gap-1 hover:bg-sky-100 transition">
          Share Profile
        </button>
        <ul className="w-full mt-6">
          {menuItems.map((item) => (
            <li
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center px-6 xl:px-8 py-2 rounded-l-full cursor-pointer mb-1 text-sm xl:text-base ${
                isActive(item.path)
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'text-sky-500 hover:bg-sky-50'
              }`}
            >
              <item.icon className="mr-2 xl:mr-3 text-sm xl:text-base" /> 
              <span className="truncate">{item.label}</span>
            </li>
          ))}
          <li 
            className="flex items-center px-6 xl:px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer text-sm xl:text-base" 
            onClick={handleLogout}
          >
            <FaSignOutAlt className="mr-2 xl:mr-3 text-sm xl:text-base" /> LogOut
          </li>
        </ul>
        {/* <button 
          onClick={() => navigate('/tutor/courses/create')}
          className="mt-6 xl:mt-8 bg-sky-500 text-white px-4 xl:px-8 py-2 xl:py-3 rounded-full flex items-center gap-2 text-sm xl:text-lg font-semibold shadow hover:bg-sky-600 transition"
        >
          <FaPlus className="text-xs xl:text-sm" /> 
          <span className="hidden xl:inline">Add New Course</span>
          <span className="xl:hidden">Add Course</span>
        </button> */}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg flex flex-col items-center py-8" onClick={(e) => e.stopPropagation()}>
            <img src={tutor?.profileImage || profileImage} className="w-20 h-20 rounded-full shadow object-cover" alt="profile" />
            <div className="mt-4 text-sky-500 font-semibold text-base text-center px-2">{tutor?.name || 'Tutor'}</div>
            <button className="mt-2 px-3 py-1 bg-sky-50 rounded-full text-sky-600 text-xs border flex items-center gap-1 hover:bg-sky-100 transition">
              Share Profile
            </button>
            <ul className="w-full mt-6">
              {menuItems.map((item) => (
                <li
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className={`flex items-center px-6 py-3 cursor-pointer mb-1 text-sm ${
                    isActive(item.path)
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-sky-500 hover:bg-sky-50'
                  }`}
                >
                  <item.icon className="mr-3 text-sm" /> 
                  <span>{item.label}</span>
                </li>
              ))}
              <li 
                className="flex items-center px-6 py-3 text-sky-500 hover:bg-sky-50 cursor-pointer text-sm" 
                onClick={() => {
                  handleLogout();
                  onClose();
                }}
              >
                <FaSignOutAlt className="mr-3 text-sm" /> LogOut
              </li>
            </ul>
            <button 
              onClick={() => {
                navigate('/tutor/courses/create');
                onClose();
              }}
              className="mt-6 bg-sky-500 text-white px-6 py-2 rounded-full flex items-center gap-2 text-sm font-semibold shadow hover:bg-sky-600 transition"
            >
              <FaPlus className="text-xs" /> Add Course
            </button>
          </aside>
        </div>
      )}
    </>
  );
};
export default TutorSidebar;
