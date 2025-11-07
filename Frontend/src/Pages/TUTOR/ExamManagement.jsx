import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Users, BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';
import TutorLayout from './COMMON/TutorLayout';
import ExamCreator from '../../components/Tutor/Exam/ExamCreator';
import { tutorAPI } from '../../api/axiosConfig';



const ExamManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();


  
  const [course, setCourse] = useState(null);
  const [exam, setExam] = useState(null);
  const [examAttempts, setExamAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exam');

  useEffect(() => {
    loadCourseData();
    loadExamData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const response = await tutorAPI.get(`/api/tutors/courses/${courseId}`);
      // Backend might return course directly or in a wrapper
      setCourse(response.data?.course || response.data);
    } catch (error) {
      toast.error(`Failed to load course data: ${error.response?.data?.message || error.message}`);
    }
  };

  const loadExamData = async () => {
    try {
      setLoading(true);
      const response = await tutorAPI.get(`/api/tutors/courses/${courseId}/exam`);
      
      // Backend returns exam in response.data.exam
      const examData = response.data?.exam;
      setExam(examData);
      
      if (examData && examData._id) {
        loadExamAttempts(examData._id);
      }
    } catch (error) {
      // No exam exists yet, which is fine
      if (error.response?.status !== 404) {
        toast.error('Error loading exam data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadExamAttempts = async (examId) => {
    if (!examId) {
      return;
    }
    
    try {
      const response = await tutorAPI.get(`/api/tutors/exams/${examId}/attempts`);
      const attempts = response.data?.attempts || [];
      setExamAttempts(Array.isArray(attempts) ? attempts : []);
    } catch (error) {
      setExamAttempts([]); // Set empty array on error
    }
  };

  const handleExamCreated = (newExam) => {
    setExam(newExam);
    if (newExam?._id) {
      loadExamAttempts(newExam._id);
    }
  };

  const handleExamUpdated = (updatedExam) => {
    setExam(updatedExam);
  };

  const deleteExam = async () => {
    if (!exam) return;
    
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        await tutorAPI.delete(`/api/tutors/exams/${exam._id}`);
        setExam(null);
        setExamAttempts([]);
        toast.success('Exam deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete exam');
      }
    }
  };

  const getAttemptStats = () => {
    try {
      if (!Array.isArray(examAttempts) || examAttempts.length === 0) {
        return { total: 0, passed: 0, failed: 0, averageScore: 0 };
      }
      
      const passed = examAttempts.filter(attempt => attempt?.passed === true).length;
      const failed = examAttempts.length - passed;
      const averageScore = examAttempts.reduce((sum, attempt) => {
        const score = attempt?.score || 0;
        return sum + score;
      }, 0) / examAttempts.length;
      
      return {
        total: examAttempts.length,
        passed,
        failed,
        averageScore: Math.round(averageScore) || 0
      };
    } catch (error) {
      return { total: 0, passed: 0, failed: 0, averageScore: 0 };
    }
  };

  const stats = getAttemptStats();

  if (loading) {
    return (
      <TutorLayout title="Exam Management" subtitle="Create and manage course exams">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout title="Exam Management" subtitle={course?.title || 'Course Exam'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/tutor/courses')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </button>
            
            {exam && (
              <button
                onClick={deleteExam}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Exam
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {exam && exam._id ? 'Edit Exam' : 'Create Exam'}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              exam && exam._id 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {exam && exam._id ? '✅ Exam Exists' : '➕ No Exam Yet'}
            </span>
          </div>
          <p className="text-gray-600">
            {course?.title}
          </p>
          

        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('exam')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exam'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                Exam Setup
              </button>
              
              {exam && (
                <>
                  <button
                    onClick={() => setActiveTab('attempts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'attempts'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Student Attempts ({Array.isArray(examAttempts) ? examAttempts.length : 0})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'analytics'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Analytics
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'exam' && (
              <div>
                {!exam && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Create Your First Exam</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Set up an exam for your course to provide certificates to students who pass with 90% or higher.
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Add multiple-choice questions with 4 options each</li>
                      <li>• Set time limits and attempt restrictions</li>
                      <li>• Configure passing score (default: 90%)</li>
                      <li>• Students must complete the final lesson before taking the exam</li>
                    </ul>
                  </div>
                )}
                
                <ExamCreator
                  courseId={courseId}
                  existingExam={exam && exam._id ? exam : null}
                  onExamCreated={handleExamCreated}
                  onExamUpdated={handleExamUpdated}
                />
              </div>
            )}

            {activeTab === 'attempts' && exam && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Student Attempts</h3>
                
                {!Array.isArray(examAttempts) || examAttempts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No student attempts yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Spent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(examAttempts) && examAttempts.map((attempt) => (
                          <tr key={attempt._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.user?.full_name || 'Unknown Student'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {attempt.user?.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.score}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                attempt.passed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(attempt.completedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && exam && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Exam Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                    <div className="text-sm text-blue-600">Total Attempts</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{stats?.passed || 0}</div>
                    <div className="text-sm text-green-600">Passed</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats?.averageScore || 0}%</div>
                    <div className="text-sm text-purple-600">Average Score</div>
                  </div>
                </div>

                {stats?.total > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Pass Rate</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${((stats?.passed || 0) / (stats?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Math.round(((stats?.passed || 0) / (stats?.total || 1)) * 100)}% pass rate
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TutorLayout>
  );
};

export default ExamManagement;