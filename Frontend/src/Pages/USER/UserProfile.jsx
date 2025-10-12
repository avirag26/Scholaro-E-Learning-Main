import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from 'lucide-react';
import Swal from 'sweetalert2';

export default function UserProfile() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '', profileImage: '' });

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/user/login');
      return;
    }
    if (storedUserInfo) {
      const user = JSON.parse(storedUserInfo);
      setUserInfo({
        name: user.name || user.full_name || 'Student',
        email: user.email || 'No email',
        profileImage: user.profileImage || ''
      });
    }
  }, [navigate]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure you want to log out?',
      text: "You will be returned to the login page.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        navigate('/user/login');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r shadow-sm h-auto md:h-screen flex flex-col">
        <div>
          <div className="p-6 border-b text-center">
            <div className="relative inline-block">
              {userInfo.profileImage ? (
                <img
                  src={userInfo.profileImage}
                  alt="User Profile"
                  className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-400"
                />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-gradient-to-br from-blue-400 to-blue-600">
                  <span className="text-white text-2xl font-bold">{userInfo.name.charAt(0) || 'U'}</span>
                </div>
              )}
            </div>
            <h3 className="mt-3 font-semibold text-gray-800">{userInfo.name}</h3>
            <p className="text-sm text-gray-500">{userInfo.email}</p>
          </div>
          <nav className="p-4">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 mt-4 bg-red-100 text-red-700 rounded-lg flex items-center justify-center hover:bg-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">Scholaro Student</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{userInfo.name.charAt(0) || 'U'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md p-8">
            <div className="bg-white shadow-md rounded-xl p-6 flex flex-col items-center">
              <div className="mb-4">
                {userInfo.profileImage ? (
                  <img
                    src={userInfo.profileImage}
                    alt="User Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                    <span className="text-white text-3xl font-bold">{userInfo.name.charAt(0) || 'U'}</span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{userInfo.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{userInfo.email}</p>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
