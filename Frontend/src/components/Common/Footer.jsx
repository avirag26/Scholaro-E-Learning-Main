import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, BookOpen } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-teal-400" />
              <span className="text-2xl font-bold">Scholaro</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Empowering learners worldwide with quality education. Join thousands of students and expert tutors in our learning community.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          {}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          {}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Educators</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/tutor/register" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Become a Tutor
                </Link>
              </li>
              <li>
                <Link to="/tutor/login" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Tutor Login
                </Link>
              </li>
              <li>
                <Link to="/teaching-guide" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Teaching Guide
                </Link>
              </li>
              <li>
                <Link to="/tutor-resources" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/tutor-support" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Tutor Support
                </Link>
              </li>
            </ul>
          </div>
          {}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">support@scholaro.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  123 Education Street<br />
                  Learning City, LC 12345
                </span>
              </div>
            </div>
          </div>
        </div>
        {}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Scholaro. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-400 hover:text-teal-400 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-teal-400 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-teal-400 transition-colors text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
