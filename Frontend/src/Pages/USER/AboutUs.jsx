import { Users, Target, Award, BookOpen, Heart, Globe } from 'lucide-react';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
const AboutUs = () => {
  const stats = [
    { number: '10,000+', label: 'Students Enrolled' },
    { number: '500+', label: 'Expert Tutors' },
    { number: '1,000+', label: 'Courses Available' },
    { number: '95%', label: 'Success Rate' }
  ];
  const values = [
    {
      icon: <BookOpen className="w-8 h-8 text-teal-600" />,
      title: 'Quality Education',
      description: 'We provide high-quality, accessible education that empowers learners to achieve their goals.'
    },
    {
      icon: <Users className="w-8 h-8 text-teal-600" />,
      title: 'Expert Tutors',
      description: 'Our platform connects students with verified, experienced tutors from around the world.'
    },
    {
      icon: <Heart className="w-8 h-8 text-teal-600" />,
      title: 'Personalized Learning',
      description: 'Every student is unique. We offer personalized learning experiences tailored to individual needs.'
    },
    {
      icon: <Globe className="w-8 h-8 text-teal-600" />,
      title: 'Global Community',
      description: 'Join a diverse, global community of learners and educators passionate about knowledge sharing.'
    }
  ];
  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      description: 'Former educator with 15+ years in online learning platforms.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      description: 'Tech innovator specializing in educational technology solutions.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Education',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      description: 'Curriculum expert with a passion for personalized learning experiences.'
    }
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About Scholaro
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Empowering learners worldwide through personalized education and expert tutoring
          </p>
          <div className="flex justify-center">
            <Award className="w-16 h-16 text-yellow-300" />
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Scholaro, we believe that quality education should be accessible to everyone, everywhere. 
                Our mission is to bridge the gap between learners and expert educators through innovative 
                technology and personalized learning experiences.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We're committed to creating a platform where knowledge flows freely, where students can 
                find the perfect tutor for their needs, and where educators can share their expertise 
                with a global audience.
              </p>
              <div className="flex items-center gap-4">
                <Target className="w-8 h-8 text-teal-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Making quality education accessible worldwide
                </span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                alt="Students learning together"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600">Numbers that reflect our commitment to education</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-teal-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">The passionate people behind Scholaro</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-teal-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8">Join thousands of students who are already learning with Scholaro</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Browse Courses
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-teal-600 transition-colors">
              Find a Tutor
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
export default AboutUs;
