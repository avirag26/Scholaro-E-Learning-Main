import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI } from '../../../api/axiosConfig';

const ExamInterface = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Check exam eligibility on component mount
  useEffect(() => {
    checkEligibility();
  }, [courseId]);

  // Timer effect
  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStarted, timeLeft]);

  const checkEligibility = async () => {
    try {
      const response = await userAPI.get(`/api/users/courses/${courseId}/exam-eligibility`);
      setEligibility(response.data);
      
      if (response.data.eligible) {
        await loadExam();
      }
    } catch (error) {
      toast.error('Failed to check exam eligibility');
    } finally {
      setLoading(false);
    }
  };

  const loadExam = async () => {
    try {
      const response = await userAPI.get(`/api/users/courses/${courseId}/exam`);
      const examData = response.data.exam;
      setExam(examData);
      setTimeLeft(examData.settings.timeLimit * 60); // Convert minutes to seconds
    } catch (error) {
      toast.error('Failed to load exam');
    }
  };

  const startExam = async () => {
    try {
      const response = await userAPI.post(`/api/users/exams/${exam._id}/start`);
      setExamStarted(true);
      startTimeRef.current = Date.now();
      toast.success('Exam started! Good luck!');
    } catch (error) {
      toast.error('Failed to start exam');
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    
    toast.warning('Time is up! Submitting exam automatically...');
    await submitExam();
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      const submissionData = {
        answers: Object.entries(answers).map(([questionIndex, selectedOption]) => ({
          questionIndex: parseInt(questionIndex),
          selectedOption
        })),
        startedAt: startTimeRef.current,
        timeSpent
      };

      const response = await userAPI.post(
        `/api/users/exams/${exam._id}/submit`,
        submissionData
      );

      toast.success('Exam submitted successfully!');
      
      const attemptId = response.data.result?.attemptId;
      if (attemptId) {
        navigate(`/user/exam-result/${attemptId}`);
      } else {
        toast.error('Exam submitted but could not navigate to results');
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit exam';
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(answers).length;
    return exam ? (answeredQuestions / exam.questions.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!eligibility?.eligible) {
    // Handle attempts exhausted case
    if (eligibility?.attemptsExhausted) {
      const examInfo = eligibility.examInfo;
      const hasPassed = examInfo?.hasPassed;
      
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className={`${hasPassed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-8`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                hasPassed ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {hasPassed ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
              </div>
              
              <h2 className={`text-2xl font-bold mb-2 ${hasPassed ? 'text-green-800' : 'text-blue-800'}`}>
                {hasPassed ? 'Exam Completed Successfully!' : 'All Attempts Completed'}
              </h2>
              
              <p className={`text-lg mb-6 ${hasPassed ? 'text-green-700' : 'text-blue-700'}`}>
                {eligibility.message}
              </p>
            </div>

            {/* Exam Summary */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Exam Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Exam:</span>
                    <span>{examInfo?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Passing Score:</span>
                    <span>{examInfo?.passingScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Attempts:</span>
                    <span>{examInfo?.attemptsUsed}/{examInfo?.maxAttempts}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Best Score:</span>
                    <span className={`font-bold ${hasPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {examInfo?.bestScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`font-medium ${hasPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {hasPassed ? 'PASSED' : 'NOT PASSED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Attempts */}
            {examInfo?.allAttempts && examInfo.allAttempts.length > 0 && (
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Attempts</h3>
                <div className="space-y-3">
                  {examInfo.allAttempts.map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">Attempt {examInfo.allAttempts.length - index}</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.score}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasPassed && (
                <button
                  onClick={() => navigate(`/user/certificates`)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  View Certificate
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Handle other eligibility issues
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            Exam Not Available
          </h2>
          <p className="text-yellow-700 mb-4">
            {eligibility?.message || 'You are not eligible to take this exam yet.'}
          </p>
          {eligibility?.requirements && (
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-800">Requirements:</h3>
              <ul className="list-disc list-inside text-yellow-700">
                {eligibility.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-4">{exam?.title}</h1>
          <p className="text-gray-600 mb-6">{exam?.description}</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="font-medium">Questions:</span>
              <span>{exam?.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Time Limit:</span>
              <span>{exam?.settings.timeLimit} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Passing Score:</span>
              <span>{exam?.settings.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Attempts Remaining:</span>
              <span>{eligibility?.attemptsRemaining || 0}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Read each question carefully before answering</li>
              <li>• You can navigate between questions using the navigation buttons</li>
              <li>• Your progress is automatically saved</li>
              <li>• Submit your exam before time runs out</li>
              <li>• You need {exam?.settings.passingScore}% to pass and receive a certificate</li>

            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={startExam}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Exam
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = exam?.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with timer and progress */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{exam?.title}</h1>
            <p className="text-gray-600">
              Question {currentQuestion + 1} of {exam?.questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-gray-600">Time Remaining</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">
            {currentQ?.question}
          </h2>
          
          <div className="space-y-3">
            {currentQ?.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={index}
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswerSelect(currentQuestion, index)}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {exam?.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== undefined
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === exam?.questions.length - 1 ? (
            <button
              onClick={submitExam}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;