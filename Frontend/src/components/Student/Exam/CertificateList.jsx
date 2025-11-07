import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { userAPI } from '../../../api/axiosConfig';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const response = await userAPI.get('/api/users/certificates');
      // Backend returns certificates in response.data.certificates
      setCertificates(response.data.certificates || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load certificates';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId, courseName) => {
    try {
      const response = await userAPI.get(
        `/api/users/certificates/${certificateId}/download`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${courseName}_Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  const copyVerificationLink = (verificationCode) => {
    const verificationUrl = `${window.location.origin}/verify-certificate/${verificationCode}`;
    navigator.clipboard.writeText(verificationUrl);
    toast.success('Verification link copied to clipboard!');
  };

  const shareOnLinkedIn = (courseName, verificationCode) => {
    const verificationUrl = `${window.location.origin}/verify-certificate/${verificationCode}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}&title=${encodeURIComponent(`I just completed ${courseName}!`)}&summary=${encodeURIComponent(`I'm excited to share that I've successfully completed ${courseName} and earned a certificate!`)}`;
    window.open(linkedInUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Certificates Yet
        </h3>
        <p className="text-gray-500 mb-6">
          Complete courses and pass exams to earn certificates!
        </p>
        <button
          onClick={() => window.location.href = '/courses'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Certificates</h2>
        <div className="text-sm text-gray-600">
          {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <div
            key={certificate._id}
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="text-2xl">🏆</div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Score</div>
                  <div className="text-lg font-bold">{certificate.score}%</div>
                </div>
              </div>
            </div>

            {/* Certificate Content */}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {certificate.courseName}
              </h3>
              
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Instructor:</span>
                  <span className="font-medium">{certificate.tutorName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium">
                    {new Date(certificate.completionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Downloads:</span>
                  <span className="font-medium">{certificate.downloadCount}</span>
                </div>
              </div>

              {/* Verification Code */}
              <div className="bg-gray-50 rounded p-2 mb-4">
                <div className="text-xs text-gray-500 mb-1">Verification Code</div>
                <div className="font-mono text-sm text-gray-800">
                  {certificate.verificationCode}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => downloadCertificate(certificate._id, certificate.courseName)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Download PDF
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyVerificationLink(certificate.verificationCode)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-xs"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => shareOnLinkedIn(certificate.courseName, certificate.verificationCode)}
                    className="flex-1 px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs"
                  >
                    Share on LinkedIn
                  </button>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {certificate.isValid ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      ✗ Invalid
                    </span>
                  )}
                </div>
                
                {certificate.expiresAt && (
                  <div className="text-xs text-gray-500">
                    Expires: {new Date(certificate.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Certificate Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {certificates.length}
            </div>
            <div className="text-sm text-gray-600">Total Certificates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {certificates.reduce((sum, cert) => sum + cert.downloadCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(certificates.reduce((sum, cert) => sum + cert.score, 0) / certificates.length) || 0}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {certificates.filter(cert => cert.isValid).length}
            </div>
            <div className="text-sm text-gray-600">Valid Certificates</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateList;