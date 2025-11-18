import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, BookOpen } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-teal-400" />
              <span className="text-xl sm:text-2xl font-bold">Scholaro</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Empowering learners worldwide with quality education. Join thousands of students and expert tutors in our learning community.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors p-1" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors p-1" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors p-1" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors p-1" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          {/* For Educators */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">For Educators</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/tutor/register" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Become a Tutor
                </Link>
              </li>
              <li>
                <Link to="/tutor/login" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Tutor Login
                </Link>
              </li>
              <li>
                <Link to="/teaching-guide" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Teaching Guide
                </Link>
              </li>
              <li>
                <Link to="/tutor-resources" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/tutor-support" className="text-gray-300 hover:text-teal-400 transition-colors text-sm block py-1">
                  Tutor Support
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact Us */}
          <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:scholaro@gmail.com" className="text-gray-300 text-sm hover:text-teal-400 transition-colors break-all">
                  scholaro@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <a href="tel:7012334610" className="text-gray-300 text-sm hover:text-teal-400 transition-colors">
                  7012334610
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm leading-relaxed">
                  123 Education Street<br />
                  Learning City, LC 12345
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2024 Scholaro. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
              <Link to="/privacy" className="text-gray-400 hover:text-teal-400 transition-colors text-xs sm:text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-teal-400 transition-colors text-xs sm:text-sm">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-teal-400 transition-colors text-xs sm:text-sm">
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
