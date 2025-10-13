import React, { useState } from 'react';
import { axiosPublic } from '../../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import DotDotDotSpinner from '../../ui/Spinner/DotSpinner';

export default function TutorForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axiosPublic.post('/api/tutors/forgot-password', { email });
      toast.success(response.data.message);
    } catch (err) {
      toast.success('If an account with that email exists, a password reset link has been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">

      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-sky-800 mb-6">Forgot Your Password?</h2>
        <p className="text-center text-sky-700 mb-6">
          No problem! Enter your email address below and we'll send you a link to reset it.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-sky-700 mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" className="w-full bg-sky-500 text-white py-3 rounded-lg hover:bg-sky-600 transition disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? <DotDotDotSpinner /> : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center text-sm text-sky-600 mt-4">
          Remembered your password? <Link to="/tutor/login" className="text-sky-500 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}