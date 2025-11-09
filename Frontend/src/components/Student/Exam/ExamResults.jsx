import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI } from '../../../api/axiosConfig';

const ExamResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    loadExamResult();
  }, [attemptId]);

  const loadExamResult = async () => {
    try {
      const response = await userAPI.get(`/api/users/exam-attempts/${attemptId}/result`);
      const attemptData = response.data.attempt;
      setResult(attemptData);

      // Check if certificate already exists
      if (attemptData.passed) {
        checkExistingCertificate();
      }
    } catch (error) {
      toast.error('Failed to load exam results');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingCertificate = async () => {
    try {
      const response = await userAPI.get('/api/users/certificates');
      const certificates = response.data.certificates || [];
      const existingCert = certificates.find(cert =>
        cert.examAttemptId === attemptId
      );
      if (existingCert) {
        setCertificate(existingCert);
      }
    } catch (error) {
      // Certificate check failed, continue without existing certificate
    }
  };

  const generateCertificate = async () => {
    setGeneratingCertificate(true);
    try {
      const response = await userAPI.post('/api/users/certificates/generate', {
        examAttemptId: attemptId
      });

      // The response contains a nested certificate object
      setCertificate(response.data.certificate);
      toast.success('Certificate generated successfully!');
    } catch (error) {
      toast.error('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate || !certificate._id) {
      toast.error('Certificate not found. Please generate the certificate first.');
      return;
    }

    try {
      // First try to get the download URL
      const response = await userAPI.get(`/api/users/certificates/${certificate._id}/download`);
      
      // Check if response contains download URL (Cloudinary)
      if (response.data.success && response.data.downloadUrl) {
        // Create a temporary link to download from Cloudinary
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = response.data.fileName || `${certificate.courseName.replace(/\s+/g, '_')}_Certificate.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Certificate download started!');
        return;
      }
      
      // If no download URL, try blob download
      throw new Error('No download URL provided');
      
    } catch (error) {
      // Check if it's a 500 error, suggest regeneration
      if (error.response?.status === 500) {
        toast.error('Certificate file not ready. Please try regenerating the certificate.');
        // Reset certificate state to allow regeneration
        setCertificate(null);
        return;
      }
      
      // Fallback to blob download for legacy certificates or errors
      try {
        const blobResponse = await userAPI.get(
          `/api/users/certificates/${certificate._id}/download`,
          { 
            responseType: 'blob',
            timeout: 30000 // 30 second timeout
          }
        );
        
        // Check if we got a valid blob
        if (blobResponse.data && blobResponse.data.size > 0) {
          // Check if it's HTML content
          const contentType = blobResponse.headers['content-type'];
          let fileExtension = '.pdf';
          let mimeType = 'application/pdf';
          
          if (contentType && contentType.includes('text/html')) {
            fileExtension = '.html';
            mimeType = 'text/html';
          }
          
          const blob = new Blob([blobResponse.data], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${certificate.courseName.replace(/\s+/g, '_')}_Certificate${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success('Certificate downloaded successfully!');
        } else {
          throw new Error('Empty or invalid certificate file');
        }
      } catch (blobError) {
        // Show specific error message and allow regeneration
        let errorMessage = 'Failed to download certificate. Please try regenerating it.';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (blobError.response?.data?.message) {
          errorMessage = blobError.response.data.message;
        }
        
        toast.error(errorMessage);
        // Reset certificate state to allow regeneration
        setCertificate(null);
      }
    }
  };

  const getScoreColor = (score, passingScore) => {
    if (score >= passingScore) return 'text-green-600';
    if (score >= passingScore * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score, passingScore) => {
    if (score >= passingScore) return 'bg-green-50 border-green-200';
    if (score >= passingScore * 0.8) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Results Not Found
          </h2>
          <p className="text-red-700 mb-4">
            Unable to load your exam results. Please try again.
          </p>
          <p className="text-sm text-red-600 mb-4">
            Attempt ID: {attemptId}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Results Header */}
      <div className={`rounded-lg border-2 p-8 mb-6 ${getScoreBgColor(result.score, result.exam?.passingScore || 90)}`}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            {result.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}
          </h1>
          <h2 className="text-xl font-semibold mb-2">{result.exam?.title || 'Exam'}</h2>
          <p className="text-gray-600 mb-6">{result.course?.title || 'Course'}</p>

          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(result.score, result.exam?.passingScore || 90)}`}>
                {result.score}%
              </div>
              <p className="text-gray-600">Your Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-700">
                {result.exam?.passingScore || 90}%
              </div>
              <p className="text-gray-600">Required to Pass</p>
            </div>
          </div>

          <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium ${result.passed
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
            }`}>
            {result.passed ? '✅ PASSED' : '❌ NOT PASSED'}
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Exam Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Questions:</span>
              <span className="font-medium">{result.detailedResults?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Correct Answers:</span>
              <span className="font-medium text-green-600">
                {result.detailedResults?.filter(a => a.isCorrect).length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Incorrect Answers:</span>
              <span className="font-medium text-red-600">
                {result.detailedResults?.filter(a => !a.isCorrect).length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Spent:</span>
              <span className="font-medium">
                {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Points Earned:</span>
              <span className="font-medium">
                {result.earnedPoints} / {result.totalPoints}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-medium">{result.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${result.score >= (result.exam?.passingScore || 90)
                    ? 'bg-green-500'
                    : 'bg-red-500'
                    }`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Time Efficiency</span>
                <span className="font-medium">
                  {Math.round((result.timeSpent / ((result.exam?.timeLimit || 60) * 60)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (result.timeSpent / ((result.exam?.timeLimit || 60) * 60)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Section */}
      {result.passed && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">🏆 Certificate of Completion</h3>
          <p className="text-gray-600 mb-4">
            Congratulations! You've successfully completed this course with a passing score.
            You can now generate and download your certificate.
          </p>

          {certificate ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">Certificate Ready!</h4>
                  <p className="text-green-600 text-sm">
                    Generated on {new Date(certificate.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                  <p className="text-green-600 text-sm">
                    Verification Code: {certificate.verificationCode}
                  </p>
                 
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={downloadCertificate}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Download Certificate
                  </button>
                  <button
                    onClick={() => {
                      setCertificate(null);
                      toast.info('You can now generate a new certificate');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={generateCertificate}
              disabled={generatingCertificate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingCertificate ? 'Generating Certificate...' : 'Generate Certificate'}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => navigate(`/course/${result.course._id}`)}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Course
        </button>

        {!result.passed && result.attemptsRemaining > 0 && (
          <button
            onClick={() => navigate(`/course/${result.course._id}/exam`)}
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retake Exam ({result.attemptsRemaining} attempts left)
          </button>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Dashboard
        </button>
      </div>

      {/* Feedback Section */}
      {!result.passed && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            💡 Study Recommendations
          </h3>
          <p className="text-blue-700 mb-4">
            Don't worry! Here are some tips to help you improve:
          </p>
          <ul className="text-blue-700 space-y-2">
            <li>• Review the course materials, especially topics you found challenging</li>
            <li>• Take notes on key concepts and practice problems</li>
            <li>• Consider reaching out to your instructor for additional help</li>
            <li>• You have {result.attemptsRemaining} more attempts to pass this exam</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExamResults;