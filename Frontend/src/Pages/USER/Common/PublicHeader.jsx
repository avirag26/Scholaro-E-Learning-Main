import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, User, LogIn } from "lucide-react";
import Button from "../../../ui/Button";

export default function PublicHeader({ onMenuClick }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <header className="border-b bg-white border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto flex h-14 sm:h-16 items-center px-3 sm:px-4 justify-between">
                    {/* Left side - Logo and Menu */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Hamburger Menu for Mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="sr-only">Toggle mobile menu</span>
                        </Button>

                        {/* Sidebar Menu for Desktop */}
                        {onMenuClick && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden lg:inline-block"
                                onClick={onMenuClick}
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle sidebar</span>
                            </Button>
                        )}

                        <Link
                            className="flex items-center gap-2 font-bold text-lg sm:text-xl md:text-2xl text-sky-500"
                            to="/browse/home"
                        >
                            Scholaro
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex gap-6 xl:gap-9 items-center">
                        <Link
                            to="/browse/home"
                            className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            to="/browse/aboutus"
                            className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
                        >
                            About Us
                        </Link>
                        <Link
                            to="/browse/contact"
                            className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
                        >
                            Contact
                        </Link>
                        <Link
                            to="/browse/courses"
                            className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
                        >
                            Courses
                        </Link>
                        <Link
                            to="/browse/teachers"
                            className="text-sm font-medium hover:text-sky-500 text-gray-900 transition-colors"
                        >
                            Tutors
                        </Link>
                    </nav>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                        {/* Search - Hidden on mobile */}
                        <Button variant="ghost" size="icon" className="hidden md:flex">
                            <Search className="h-5 w-5" />
                        </Button>

                        {/* Login Button */}
                        <Link
                            to="/user/login"
                            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-sky-600 hover:text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors text-sm sm:text-base"
                        >
                            <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Login</span>
                        </Link>

                        {/* Register Button */}
                        <Link
                            to="/user/register"
                            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base"
                        >
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Sign Up</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed top-14 sm:top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <nav className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                            <Link
                                to="/browse/home"
                                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                to="/browse/aboutus"
                                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                About Us
                            </Link>
                            <Link
                                to="/browse/contact"
                                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <Link
                                to="/browse/courses"
                                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Courses
                            </Link>
                            <Link
                                to="/browse/teachers"
                                className="block text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Tutors
                            </Link>

                            {/* Mobile Auth Section */}
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <Link
                                    to="/user/login"
                                    className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-sky-500 py-2 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LogIn className="h-5 w-5" />
                                    Login
                                </Link>

                                <Link
                                    to="/user/register"
                                    className="flex items-center gap-3 text-base font-medium text-white bg-sky-500 hover:bg-sky-600 py-2 px-3 rounded-lg transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <User className="h-5 w-5" />
                                    Sign Up
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}