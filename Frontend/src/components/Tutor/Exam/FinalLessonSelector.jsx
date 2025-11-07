import { useState, useEffect } from 'react';
import { CheckCircle, BookOpen, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import { tutorAPI } from '../../../api/axiosConfig';

const FinalLessonSelector = ({ courseId, lessons = [], currentFinalLessonId = null }) => {
  const [selectedLessonId, setSelectedLessonId] = useState(currentFinalLessonId || '');
  const [examSettings, setExamSettings] = useState({
    isEnabled: false,
    autoEnableAfterAllLessons: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedLessonId(currentFinalLessonId || '');
  }, [currentFinalLessonId]);

  const handleLessonSelect = (lessonId) => {
    setSelectedLessonId(lessonId);
  };

  const handleSetFinalLesson = async () => {
    if (!selectedLessonId) {
      toast.error('Please select a lesson');
      return;
    }

    setLoading(true);
    try {
      const response = await tutorAPI.put(`/api/tutors/courses/${courseId}/final-lesson`, {
        lessonId: selectedLessonId
      });

      toast.success('Final lesson set successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to set final lesson';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExamSettings = async () => {
    setLoading(true);
    try {
      await tutorAPI.put(`/api/tutors/courses/${courseId}/exam-settings`, examSettings);
      toast.success('Exam settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update exam settings');
    } finally {
      setLoading(false);
    }
  };

  const availableLessons = Array.isArray(lessons) ? lessons : [];



  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Exam Configuration
        </h3>
        <p className="text-gray-600">
          Configure when students can take the final exam
        </p>
      </div>

      {/* Exam Settings */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Exam Availability</h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={examSettings.isEnabled}
              onChange={(e) => setExamSettings(prev => ({
                ...prev,
                isEnabled: e.target.checked
              }))}
              className="mr-3 h-4 w-4 text-blue-600"
            />
            <span className="text-sm">Enable exam for this course</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={examSettings.autoEnableAfterAllLessons}
              onChange={(e) => setExamSettings(prev => ({
                ...prev,
                autoEnableAfterAllLessons: e.target.checked
              }))}
              className="mr-3 h-4 w-4 text-blue-600"
            />
            <span className="text-sm">Auto-enable exam after all lessons are completed</span>
          </label>
        </div>

        <button
          onClick={handleUpdateExamSettings}
          disabled={loading}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
        >
          Update Settings
        </button>
      </div>

      {/* Final Lesson Selection */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <BookOpen className="h-4 w-4 mr-2" />
          Final Lesson Selection
        </h4>

        {availableLessons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No lessons found</p>
            <p className="text-sm">Create some lessons first to set a final lesson</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Select which lesson students must complete before they can take the exam
            </p>



            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableLessons
                .sort((a, b) => a.order - b.order)
                .map((lesson) => (
                  <label
                    key={lesson.id || lesson._id}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedLessonId === (lesson.id || lesson._id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="finalLesson"
                      value={lesson.id || lesson._id}
                      checked={selectedLessonId === (lesson.id || lesson._id)}
                      onChange={(e) => handleLessonSelect(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${selectedLessonId === (lesson.id || lesson._id) ? 'text-blue-900' : 'text-gray-900'}`}>
                          {lesson.order}. {lesson.title}
                        </span>
                        <div className="flex items-center space-x-2">
                          {selectedLessonId === (lesson.id || lesson._id) && (
                            <span className="text-blue-600 text-sm font-medium">Selected</span>
                          )}
                          {lesson.isFinalLesson && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {lesson.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </label>
                ))}
            </div>

            <button
              onClick={handleSetFinalLesson}
              disabled={loading || !selectedLessonId}
              className="mt-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Setting...' : 'Set as Final Lesson'}
            </button>
          </>
        )}
      </div>

      {/* Current Status */}
      {currentFinalLessonId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-green-800 font-medium">Final lesson is configured</p>
              <p className="text-green-700 text-sm">
                Students must complete the selected lesson to unlock the exam
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalLessonSelector;