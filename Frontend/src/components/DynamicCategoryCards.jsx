import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from "../ui/Card";
import { userAPI } from '../api/axiosConfig';

export default function DynamicCategoryCards() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await userAPI.get('/api/users/popular-categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      // Fallback to static categories if API fails
      setCategories([
        { 
          name: 'Design', 
          icon: '🎨', 
          courses: '120+ Courses', 
          color: 'bg-pink-100 text-pink-600',
          description: 'UI/UX, Graphic Design, Web Design'
        },
        { 
          name: 'Development', 
          icon: '💻', 
          courses: '200+ Courses', 
          color: 'bg-sky-100 text-sky-600',
          description: 'Web, Mobile, Software Development'
        },
        { 
          name: 'Marketing', 
          icon: '📈', 
          courses: '80+ Courses', 
          color: 'bg-green-100 text-green-600',
          description: 'Digital Marketing, SEO, Social Media'
        },
        { 
          name: 'Business', 
          icon: '💼', 
          courses: '150+ Courses', 
          color: 'bg-purple-100 text-purple-600',
          description: 'Management, Finance, Entrepreneurship'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/user/courses?category=${encodeURIComponent(category.name)}`);
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Explore our most popular course categories
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Popular Categories
          </h2>
          <p className="text-xl text-gray-600">
            Explore our most popular course categories
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.slice(0, 4).map((category) => (
            <Card 
              key={category._id || category.name} 
              className="p-8 hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => handleCategoryClick(category)}
            >
              <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-teal-600 font-medium mb-2">{category.courses}</p>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </Card>
          ))}
        </div>
        
        {categories.length > 4 && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/user/courses')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 transition-colors"
            >
              View All Categories
            </button>
          </div>
        )}
      </div>
    </section>
  );
}