import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosConfig';

const CertificateVerification = () => {
  const { verificationCode } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (verificationCode) {
      verifyCertificate();
    }
  }, [verificationCode]);

  const verifyCertificate = async () => {
    try {
      const response = await axiosInstance.get(`/api/certificates/${verificationCode}/verify`);
      setCertificate(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Certificate verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Certificate Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Possible reasons:</h3>
            <ul className="text-red-700 text-sm text-left space-y-1">
              <li>• Invalid verification code</li>
              <li>• Certificate has been revoked</li>
              <li>• Certificate has expired</li>
              <li>• Verification code was mistyped</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Verification Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Certificate Verified
          </h1>
          <p className="text-gray-600">
            This certificate is authentic and valid
          </p>
        </div>

        {/* Certificate Display */}
        <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
            <div className="text-blue-100">
              This certifies that
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-8 text-center">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {certificate.studentName}
              </h3>
              <p className="text-gray-600">
                has successfully completed the course
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-2xl font-semibold text-blue-600 mb-2">
                {certificate.courseName}
              </h4>
              <p className="text-gray-600">
                Instructed by <span className="font-medium">{certificate.tutorName}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {certificate.score}%
                </div>
                <div className="text-gray-600 text-sm">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">
                  {new Date(certificate.completionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-gray-600 text-sm">Completion Date</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">
                  {certificate.certificateId.slice(-8).toUpperCase()}
                </div>
                <div className="text-gray-600 text-sm">Certificate ID</div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h5 className="font-semibold text-gray-800 mb-4">Verification Details</h5>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Verification Code:</span>
                  <span className="font-mono font-medium">{certificate.verificationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium">
                    {new Date(certificate.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${certificate.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {certificate.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                {certificate.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">
                      {new Date(certificate.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Features */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">🔒</span>
                  Digitally Signed
                </div>
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">🛡️</span>
                  Tamper Proof
                </div>
                <div className="flex items-center">
                  <span className="text-purple-500 mr-2">✓</span>
                  Verified Authentic
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="bg-gray-100 px-8 py-4 text-center text-sm text-gray-600">
            <p>
              This certificate can be verified at any time by visiting this URL or 
              entering the verification code on our verification page.
            </p>
            <p className="mt-2">
              <strong>Verification URL:</strong> {window.location.href}
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">About This Certificate</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Course Information</h4>
              <p className="text-gray-600 text-sm mb-4">
                This certificate confirms that the recipient has successfully completed 
                the specified course and demonstrated proficiency by achieving a passing 
                score on the final examination.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Verification Process</h4>
              <p className="text-gray-600 text-sm">
                Our certificates use advanced digital verification technology to ensure 
                authenticity. Each certificate contains a unique verification code that 
                can be validated through our secure verification system.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print Certificate
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              toast.success('Verification URL copied to clipboard!');
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Copy Verification URL
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;