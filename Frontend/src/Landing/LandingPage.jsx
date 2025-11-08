import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"
import { Play, Award, Menu, X } from 'lucide-react';
import Button from "../ui/Button";
import FeatureTabs from "../ui/FeatureTabs";
import AboutSection from "../ui/AboutSection";
import CategoryCards from "../ui/CategoryCards";
import StatsSection from "../ui/StatsSection";
import TeamSection from "../ui/TeamSection";
import Testimonials from "../ui/Testimonials";
import BannerImg from '../assets/banner.png'
export default function LandingPage(){
    const navigate=useNavigate()
   const [isMenuOpen,setIsMenuOpen]=useState(false)
    return (
       <div className="main-h-screen bg-white">
        <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {}
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-teal-600">Scholaro</h1>
                        </div>
                        {}
                        <nav className="hidden md:flex space-x-8">
                            <Link to="/" className="text-gray-700 hover:text-teal-600 transition-colors">Home</Link>
                            <Link to="/courses" className="text-gray-700 hover:text-teal-600 transition-colors">Courses</Link>
                            <Link to="/about" className="text-gray-700 hover:text-teal-600 transition-colors">About</Link>
                            <Link to="/contact" className="text-gray-700 hover:text-teal-600 transition-colors">Contact</Link>
                        </nav>
                        {}
                        <div className="hidden md:flex items-center space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/user/login')}
                                className="border-teal-600 text-teal-600 hover:bg-teal-50"
                            >
                                Login
                            </Button>
                            <Button
                                onClick={() => navigate('/user/register')}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                Get Started
                            </Button>
                        </div>
                        {}
                        <button
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                    {}
                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t">
                            <div className="flex flex-col space-y-4">
                                <Link to="/" className="text-gray-700 hover:text-teal-600">Home</Link>
                                <Link to="/courses" className="text-gray-700 hover:text-teal-600">Courses</Link>
                                <Link to="/about" className="text-gray-700 hover:text-teal-600">About</Link>
                                <Link to="/contact" className="text-gray-700 hover:text-teal-600">Contact</Link>
                                <div className="flex flex-col space-y-2 pt-4">
                                    <Button variant="outline" onClick={() => navigate('/user/login')}>Login</Button>
                                    <Button onClick={() => navigate('/user/register')}>Get Started</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>
             <section className="relative bg-gradient-to-br from-teal-50 to-blue-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    You bring the{' '}
                                    <span className="text-teal-600">expertise</span>,{' '}
                                    we'll make it unforgettable.
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    Energize and motivate your students with personalized content as they progress on their learning journey.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    onClick={() => navigate('/user/register')}
                                    className="bg-teal-600 hover:bg-teal-700 px-8 py-4 text-lg"
                                >
                                    Get Started
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-4 text-lg flex items-center"
                                >
                                    <Play className="w-5 h-5 mr-2" />
                                    Watch Demo
                                </Button>
                            </div>
                            {}
                            <div className="flex flex-wrap gap-8 pt-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">10K+</div>
                                    <div className="text-gray-600">Students</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">500+</div>
                                    <div className="text-gray-600">Courses</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">100+</div>
                                    <div className="text-gray-600">Instructors</div>
                                </div>
                            </div>
                        </div>
                        {}
                        <div className="relative">
                            <div className="relative bg-white p-4 rounded-3xl shadow-lg">
                                <img
                                    src={BannerImg}
                                    alt="Scholaro Learning Platform"
                                    className="w-full max-w-lg mx-auto rounded-2xl"
                                />
                            </div>
                            {}
                            <div className="absolute top-10 left-10 bg-white p-4 rounded-lg shadow-lg">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium">Live Classes</span>
                                </div>
                            </div>
                            <div className="absolute bottom-10 right-10 bg-white p-4 rounded-lg shadow-lg">
                                <div className="flex items-center space-x-2">
                                    <Award className="w-5 h-5 text-yellow-500" />
                                    <span className="text-sm font-medium">Certified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
           {}
            <section className="py-16 bg-gradient-to-r from-teal-600 to-blue-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-left md:flex-1">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    Become a Tutor on Scholaro
                                </h2>
                                <p className="text-xl text-white/90 mb-6">
                                    Share your knowledge, inspire thousands of learners, and grow your career as a top educator.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => navigate('/tutor/register')}
                                        className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg transition-colors"
                                    >
                                        Start Teaching Today
                                    </button>
                                    <button
                                        className="border-2 border-white text-white hover:bg-white hover:text-teal-600 px-8 py-4 text-lg font-semibold rounded-lg transition-colors bg-transparent"
                                    >
                                        Learn More
                                    </button>
                                </div>
                            </div>
                            <div className="md:flex-1 flex justify-center">
                                <div className="relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                                        alt="Professional tutor"
                                        className="w-64 h-64 rounded-full object-cover border-8 border-white/20 shadow-2xl"
                                    />
                                    <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm">
                                        Earn ₹4000-16000/hr
                                    </div>
                                    <div className="absolute -bottom-4 -left-4 bg-white text-teal-600 px-4 py-2 rounded-full font-bold text-sm">
                                        Join 1000+ Tutors
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
             <FeatureTabs />
            {}
            <AboutSection />
            {}
            <StatsSection />
            {}
            <CategoryCards />
            {}
            <Testimonials />
            {}
            <TeamSection />
               <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Ready to Start Your Learning Journey?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands of students who are already learning with Scholaro
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => navigate('/user/register')}
                            className="bg-teal-600 hover:bg-teal-700 px-8 py-4 text-lg"
                        >
                            Start Learning Today
                        </Button>
                        <button
                            onClick={() => navigate('/tutor/register')}
                            className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-lg transition-colors bg-transparent"
                        >
                            Become an Instructor
                        </button>
                    </div>
                </div>
            </section>
          {}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold text-teal-400 mb-4">Scholaro</h3>
                            <p className="text-gray-400 mb-4">
                                Empowering learners through accessible and engaging online education.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                                <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">About Us</a></li>
                                <li><a href="#" className="hover:text-white">Careers</a></li>
                                <li><a href="#" className="hover:text-white">Press</a></li>
                                <li><a href="#" className="hover:text-white">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Help Center</a></li>
                                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact Info</h4>
                            <div className="text-gray-400 space-y-2">
                                <p>123 Main Street</p>
                                <p>Anytown, CA 12345</p>
                                <p>+1 (123) 456-7890</p>
                                <p>hello@scholaro.com</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Scholaro. All rights reserved.</p>
                    </div>
                </div>
            </footer>
       </div>
    )
}
