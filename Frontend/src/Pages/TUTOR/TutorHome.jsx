import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import TutorLayout from "./COMMON/TutorLayout"; 
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
  return (
    <TutorLayout>
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
            <span className="text-2xl font-bold">₹6,15,78,345</span>
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
    </TutorLayout>
  );
}
