import Card from "./Card";
export default function CategoryCards() {
  const categories = [
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
      color: 'bg-sky-100 text-sky-600',
      description: 'Management, Finance, Entrepreneurship'
    },
  ];
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
          {categories.map((category) => (
            <Card key={category.name} className="p-8 hover:shadow-xl transition-shadow cursor-pointer group">
              <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-teal-600 font-medium mb-2">{category.courses}</p>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
