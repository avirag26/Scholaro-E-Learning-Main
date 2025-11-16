import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Clock, Target, RotateCcw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { tutorAPI } from '../../../api/axiosConfig';

const ExamCreator = ({ courseId, onExamCreated, onExamUpdated, existingExam = null }) => {

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1,
        explanation: ''
      }
    ],
    settings: {
      passingScore: 90,
      timeLimit: 60,
      maxAttempts: 3,
      shuffleQuestions: false,
      shuffleOptions: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);



  useEffect(() => {
    if (existingExam && existingExam._id) {
      // Ensure the existing exam has the proper structure
      setExamData({
        title: existingExam.title || '',
        description: existingExam.description || '',
        questions: Array.isArray(existingExam.questions) ? existingExam.questions : [
          {
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            points: 1,
            explanation: ''
          }
        ],
        settings: {
          passingScore: existingExam.settings?.passingScore || 90,
          timeLimit: existingExam.settings?.timeLimit || 60,
          maxAttempts: existingExam.settings?.maxAttempts || 3,
          shuffleQuestions: existingExam.settings?.shuffleQuestions || false,
          shuffleOptions: existingExam.settings?.shuffleOptions || false
        }
      });
    }
  }, [existingExam]);

  const addQuestion = () => {
    setExamData(prev => ({
      ...prev,
      questions: [
        ...(Array.isArray(prev.questions) ? prev.questions : []),
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          points: 1,
          explanation: ''
        }
      ]
    }));
    // Navigate to the new question
    setCurrentQuestionIndex(examData.questions.length);
    setCurrentStep(2);
  };

  const removeQuestion = (index) => {
    if (examData?.questions?.length > 1) {
      setExamData(prev => ({
        ...prev,
        questions: Array.isArray(prev.questions) ? prev.questions.filter((_, i) => i !== index) : []
      }));
      // Adjust current question index if needed
      if (currentQuestionIndex >= examData.questions.length - 1) {
        setCurrentQuestionIndex(Math.max(0, examData.questions.length - 2));
      }
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate basic info before proceeding
      if (!examData?.title?.trim()) {
        toast.error('Please enter an exam title');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setCurrentStep(2);
  };

  const updateQuestion = (questionIndex, field, value) => {
    setExamData(prev => ({
      ...prev,
      questions: Array.isArray(prev.questions) ? prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, [field]: value } : q
      ) : []
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setExamData(prev => ({
      ...prev,
      questions: Array.isArray(prev.questions) ? prev.questions.map((q, i) =>
        i === questionIndex
          ? {
            ...q,
            options: Array.isArray(q.options) ? q.options.map((opt, j) => j === optionIndex ? value : opt) : ['', '', '', '']
          }
          : q
      ) : []
    }));
  };

  const validateExam = () => {
    try {
      const newErrors = {};

      if (!examData?.title?.trim()) {
        newErrors.title = 'Exam title is required';
      }

      if (!Array.isArray(examData?.questions)) {
        newErrors.general = 'Invalid exam data structure';
        setErrors(newErrors);
        return false;
      }

      examData.questions.forEach((question, qIndex) => {
        if (!question?.question?.trim()) {
          newErrors[`question_${qIndex}`] = 'Question text is required';
        }

        if (!Array.isArray(question?.options)) {
          newErrors[`options_${qIndex}`] = 'Invalid question options';
          return;
        }

        const filledOptions = question.options.filter(opt => opt?.trim());
        if (filledOptions.length < 2) {
          newErrors[`options_${qIndex}`] = 'At least 2 options are required';
        }

        if (!question.options[question.correctAnswer]?.trim()) {
          newErrors[`correct_${qIndex}`] = 'Correct answer cannot be empty';
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateExam()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      let response;
      const isUpdate = existingExam && existingExam._id;

      if (isUpdate) {
        response = await tutorAPI.put(`/api/tutors/exams/${existingExam._id}`, examData);
      } else {
        response = await tutorAPI.post(`/api/tutors/courses/${courseId}/exam`, examData);
      }

      toast.success(isUpdate ? 'Exam updated successfully!' : 'Exam created successfully!');

      if (isUpdate) {
        onExamUpdated?.(response.data.exam || response.data);
      } else {
        onExamCreated?.(response.data.exam || response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to save exam';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };





  // Safety check - ensure examData is properly initialized
  if (!examData) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Loading...</h3>
        <p className="text-yellow-700">Initializing exam creator...</p>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Step 1 */}
        <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Basic Info</span>
        </div>
        
        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        
        {/* Step 2 */}
        <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Questions</span>
        </div>
        
        <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        
        {/* Step 3 */}
        <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Review</span>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              value={examData?.title || ''}
              onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Final Assessment"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={examData?.description || ''}
              onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Brief description of the exam"
            />
          </div>
        </div>
      </div>

      {/* Exam Settings */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Exam Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={examData?.settings?.passingScore || 90}
              onChange={(e) => setExamData(prev => ({
                ...prev,
                settings: { ...prev.settings, passingScore: parseInt(e.target.value) || 90 }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={examData?.settings?.timeLimit || 60}
              onChange={(e) => setExamData(prev => ({
                ...prev,
                settings: { ...prev.settings, timeLimit: parseInt(e.target.value) || 60 }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <RotateCcw className="h-4 w-4 mr-1" />
              Max Attempts
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={examData?.settings?.maxAttempts || 3}
              onChange={(e) => setExamData(prev => ({
                ...prev,
                settings: { ...prev.settings, maxAttempts: parseInt(e.target.value) || 3 }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Shuffle Settings */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Randomization Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="shuffleQuestions"
                checked={examData?.settings?.shuffleQuestions || false}
                onChange={(e) => setExamData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, shuffleQuestions: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="shuffleQuestions" className="text-sm font-medium text-gray-700">
                Shuffle Questions Order
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="shuffleOptions"
                checked={examData?.settings?.shuffleOptions || false}
                onChange={(e) => setExamData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, shuffleOptions: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="shuffleOptions" className="text-sm font-medium text-gray-700">
                Shuffle Answer Options
              </label>
            </div>
          </div>
        </div>


      
      </div>
    </div>
  );

  const renderStep2 = () => {
    const question = examData?.questions?.[currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="space-y-6">
        {/* Question Navigation */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {examData.questions.length}
            </h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </button>
          </div>
          
          {/* Question Pills */}
          <div className="flex flex-wrap gap-2">
            {examData.questions.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-100'
                }`}
              >
                Q{index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-medium">Question {currentQuestionIndex + 1}</h4>
            {examData.questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(currentQuestionIndex)}
                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={question.question}
                onChange={(e) => updateQuestion(currentQuestionIndex, 'question', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`question_${currentQuestionIndex}`] ? 'border-red-300' : 'border-gray-300'
                }`}
                rows="4"
                placeholder="Enter your question here..."
              />
              {errors[`question_${currentQuestionIndex}`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`question_${currentQuestionIndex}`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Answer Options *
              </label>
              <div className="space-y-3">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name={`correct_${currentQuestionIndex}`}
                      checked={question.correctAnswer === oIndex}
                      onChange={() => updateQuestion(currentQuestionIndex, 'correctAnswer', oIndex)}
                      className="text-green-600 w-4 h-4"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(currentQuestionIndex, oIndex, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {errors[`options_${currentQuestionIndex}`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`options_${currentQuestionIndex}`]}</p>
              )}
              {errors[`correct_${currentQuestionIndex}`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`correct_${currentQuestionIndex}`]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={question.points}
                  onChange={(e) => updateQuestion(currentQuestionIndex, 'points', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation (Optional)
                </label>
                <input
                  type="text"
                  value={question.explanation}
                  onChange={(e) => updateQuestion(currentQuestionIndex, 'explanation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why this is the correct answer"
                />
              </div> */}
            </div>
          </div>

          {/* Question Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Question
            </button>
            <button
              type="button"
              onClick={nextQuestion}
              disabled={currentQuestionIndex === examData.questions.length - 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Question
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Review Your Exam
        </h3>
        <p className="text-gray-600">
          Please review all the details before creating your exam.
        </p>
      </div>

      {/* Basic Info Review */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Title:</span>
            <p className="text-gray-900">{examData.title}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Description:</span>
            <p className="text-gray-900">{examData.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* Settings Review */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold mb-3">Exam Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Passing Score:</span>
            <p className="text-gray-900">{examData.settings.passingScore}%</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Time Limit:</span>
            <p className="text-gray-900">{examData.settings.timeLimit} minutes</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Max Attempts:</span>
            <p className="text-gray-900">{examData.settings.maxAttempts}</p>
          </div>
        </div>
      </div>

      {/* Questions Review */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold mb-4">Questions ({examData.questions.length})</h4>
        <div className="space-y-4">
          {examData.questions.map((question, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">Question {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
              </div>
              <p className="text-gray-700 mb-2">{question.question}</p>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Correct Answer:</span> {question.options[question.correctAnswer]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {existingExam ? 'Edit Exam' : 'Create New Exam'}
        </h2>
        <p className="text-gray-600">
          Create a comprehensive exam to test your students' knowledge
        </p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          <div className="flex space-x-3">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : (existingExam ? 'Update Exam' : 'Create Exam')}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExamCreator;