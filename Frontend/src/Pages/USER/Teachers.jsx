import { useState, useEffect } from 'react';
import { Search, Filter, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from "./Common/Header"; 
import Footer from '../../components/Common/Footer';
import { publicAPI } from '../../api/axiosConfig';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilter, setShowFilter] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState([]);


  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        console.log('Fetching teachers from API...');
        const response = await publicAPI.get('/api/users/tutors');
        console.log('API Response:', response.data);
        
        const tutorsData = response.data.tutors || [];
        console.log('Tutors data:', tutorsData);
        
        setTeachers(tutorsData);
        setFilteredTeachers(tutorsData);
        
        if (tutorsData.length === 0) {
          toast.info('No tutors found in the system');
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        console.error('Error details:', error.response?.data);
        toast.error(`Failed to load teachers: ${error.response?.data?.message || error.message}`);
        setTeachers([]);
        setFilteredTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);


  useEffect(() => {
    let filtered = teachers;


    if (searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subjects.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }


    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'students':
        filtered.sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
        break;
      default:

        break;
    }

    setFilteredTeachers(filtered);
  }, [teachers, searchTerm, sortBy]);

  const handleSendMessage = (teacher) => {

    console.log('Send message to:', teacher.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading teachers...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutors</h1>
          <p className="text-gray-600">Find the perfect tutor for your learning journey</p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tutors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Sort By */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="students">Students</option>
              </select>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTeachers.length} of {teachers.length} tutors
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
            >
              {/* Profile Image */}
              <div className="text-center mb-4">
                <img
                  src={teacher.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                  alt={teacher.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-gray-100"
                />
              </div>

              {/* Teacher Info */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {teacher.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {teacher.subjects}
                </p>
                
                {/* Rating and Students */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-3">
                  {teacher.rating && (
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      {teacher.rating}
                    </span>
                  )}
                  {teacher.totalStudents && (
                    <span>{teacher.totalStudents} students</span>
                  )}
                </div>

                {/* Bio */}
                {teacher.bio && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {teacher.bio}
                  </p>
                )}
              </div>

              {/* Send Message Button */}
              <button
                onClick={() => handleSendMessage(teacher)}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                Send Message
              </button>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredTeachers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No tutors found' : 'No tutors available'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms or filters to find more tutors.'
                : 'There are currently no verified tutors in the system. Please check back later.'
              }
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Teachers;