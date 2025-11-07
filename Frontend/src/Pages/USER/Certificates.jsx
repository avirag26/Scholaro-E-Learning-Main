import React from 'react';
import Header from './Common/Header';
import CertificateList from '../../components/Student/Exam/CertificateList';

const Certificates = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <CertificateList />
      </div>
    </div>
  );
};

export default Certificates;