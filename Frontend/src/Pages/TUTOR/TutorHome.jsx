import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FaPlus, FaUser, FaBook, FaChartBar, FaComments, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "./COMMON/Header";
import Footer from "./COMMON/Footer";
import Swal from "sweetalert2";
import { tutorAPI } from "../../api/axiosConfig";



const profileImage = "https://randomuser.me/api/portraits/men/75.jpg"; 

const chartData = [
  { name: 'Sun', uv: 400000, pv: 200000 },
  { name: 'Mon', uv: 600000, pv: 350000 },
  { name: 'Tue', uv: 800000, pv: 450000 },
  { name: 'Wed', uv: 750000, pv: 420000 },
  { name: 'Thu', uv: 950000, pv: 400000 },
  { name: 'Fri', uv: 700000, pv: 480000 },
  { name: 'Sat', uv: 500000, pv: 380000 },
];

const coursesData = [
  {
    name: "Web Development",
    students: 120,
    enrolled: 80,
    drafts: 5,
    lessons: 11,
    rating: "4.5 stars",
    notice: "₹2000",
    status: "Published"
  },
  {
    name: "Data Science",
    students: 95,
    enrolled: 60,
    drafts: 2,
    lessons: 14,
    rating: "4.2 stars",
    notice: "₹1800",
    status: "Published"
  },
  {
    name: "Graphic Design",
    students: 70,
    enrolled: 0,
    drafts: 3,
    lessons: 13,
    rating: "3.9 stars",
    notice: "₹2500",
    status: "Inactive"
  },
];

export default function TutorDashboard() {
  const navigate = useNavigate();
  const [tutorName, setTutorName] = useState("Tutor");



useEffect(() => {
  async function verifyAndLoadTutor() {
    try {
      const token = localStorage.getItem('tutorAuthToken');
      const tutorInfo = localStorage.getItem('tutorInfo');

      if (!token) {
        navigate('/tutor/login');
        return;
      }

      const response = await tutorAPI.get('/api/tutors/check-status');
      const data = response.data;

      if (data.isBlocked) {
        localStorage.removeItem('tutorAuthToken');
        localStorage.removeItem('tutorInfo');
        navigate('/tutor/login');
        return;
      }

      if (tutorInfo) {
        try {
          const parsedTutorInfo = JSON.parse(tutorInfo);
          setTutorName(parsedTutorInfo.name || 'Tutor');
        } catch (error) {
          console.error('Error parsing tutorInfo:', error);
          setTutorName('Tutor');
        }
      } else {
        setTutorName('Tutor');
      }

    } catch (error) {
      console.error('Error verifying tutor:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('tutorAuthToken');
        localStorage.removeItem('tutorInfo');
        navigate('/tutor/login');
      }
    }
  }

  verifyAndLoadTutor();
}, [navigate]);


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
  return (

    <div className="min-h-screen bg-[#f2fbf6] w-full flex flex-col">
      <Header />

      <div className="flex flex-1 w-full">
        <aside className="w-64 bg-white mx-4 my-6 rounded-2xl shadow-md flex flex-col items-center py-8">
          <img src={profileImage} className="w-24 h-24 rounded-full shadow" alt="profile" />
          <div className="mt-4 text-sky-500 font-semibold text-lg">{tutorName}</div>
          <button className="mt-2 px-4 py-1 bg-sky-50 rounded-full text-sky-600 text-sm border flex items-center gap-1 hover:bg-sky-100 transition">
            Share Profile
          </button>
          <ul className="w-full mt-6">
            <li className="flex items-center px-8 py-2 bg-sky-500 text-white rounded-l-full font-semibold mb-1">
              <FaChartBar className="mr-3" /> Dashboard
            </li>
            <li
              onClick={() => navigate('/tutor/profile')}
              className="flex items-center px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer mb-1"
            >
              <FaUser className="mr-3" /> Profile
            </li>
            <li 
              onClick={() => navigate('/tutor/courses')}
              className="flex items-center px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer mb-1"
            >
              <FaBook className="mr-3" /> Courses
            </li>
            <li className="flex items-center px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer mb-1">
              <FaChartBar className="mr-3" /> Revenues
            </li>
            <li className="flex items-center px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer mb-1">
              <FaComments className="mr-3" /> Chat & video
            </li>
            <li className="flex items-center px-8 py-2 text-sky-500 hover:bg-sky-50 rounded-l-full cursor-pointer" onClick={handleLogout}>
              <FaSignOutAlt className="mr-3" /> LogOut
            </li>
          </ul>
          <button className="mt-8 bg-sky-500 text-white px-8 py-3 rounded-full flex items-center gap-2 text-lg font-semibold shadow hover:bg-sky-600 transition">
            <FaPlus /> Add New Course
          </button>
        </aside>
        <main className="flex-1 my-6 mr-4">
          <div className="rounded-2xl shadow-md px-8 py-6 bg-white border-4 border-[#b8eec4]/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-sky-600">Dashboard</div>
              <div>
                <button className="bg-sky-500 text-white px-4 py-2 rounded mr-3 hover:bg-sky-600 transition">Download PDF</button>
                <button className="bg-[#efefef] text-sky-600 px-4 py-2 rounded hover:bg-[#e4eaea] transition">Download Excel</button>
              </div>
            </div>
            <div className="flex items-center mt-6 mb-4 gap-8">
              <div className="flex flex-col items-center justify-center text-sky-600 text-lg font-semibold">
                <span className="text-2xl font-bold">1,674,767</span>
                <span className="mt-1 text-[#666] font-normal text-base">Students</span>
              </div>
              <div className="flex flex-col items-center justify-center text-sky-600 text-lg font-semibold">
                <span className="text-2xl font-bold">957</span>
                <span className="mt-1 text-[#666] font-normal text-base">Total Courses</span>
              </div>
              <div className="flex flex-col items-center justify-center text-sky-600 text-lg font-semibold">
                <span className="text-2xl font-bold">$7,461,767</span>
                <span className="mt-1 text-[#666] font-normal text-base">Total Revenue</span>
              </div>
            </div>
            <div className="bg-[#f0f9f5] p-4 rounded-xl mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-[#4e9b8f]">Market Overview</span>
                <span className="text-sm text-gray-400">This week</span>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `${(val / 1000)}K`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="uv" stroke="#2ebeb6" strokeWidth={3} dot={false} isAnimationActive={true} />
                  <Line type="monotone" dataKey="pv" stroke="#fd5d7e" strokeWidth={3} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl p-4 mt-6 border border-[#e3eae2]">
              <table className="w-full text-center">
                <thead>
                  <tr className="text-[#666] border-b">
                    <th className="py-2">Course Name</th>
                    <th>Students</th>
                    <th>Enrolled</th>
                    <th>Drafts</th>
                    <th>Rating</th>
                    <th>Notice</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesData.map((course) => (
                    <tr key={course.name} className="text-[#222] border-b last:border-none">
                      <td className="py-3">{course.name}</td>
                      <td>{course.students}</td>
                      <td>{course.enrolled}</td>
                      <td>{course.drafts}</td>
                      <td>{course.rating}</td>
                      <td>{course.notice}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold 
                          ${course.status === "Published" ? "bg-sky-50 text-sky-600" : "bg-gray-200 text-gray-500"}`}>
                          {course.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
