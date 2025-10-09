
import React from "react";
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';

export default function FeatureTabs() {
  const features = [
    { 
      label: "Interactive Learning", 
      icon: BookOpen,
      color: "bg-teal-100 text-teal-600",
      description: "Engage with hands-on projects and real-world scenarios"
    },
    { 
      label: "Expert Instructors", 
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      description: "Learn from industry professionals and thought leaders"
    },
    { 
      label: "Certified Courses", 
      icon: Award,
      color: "bg-green-100 text-green-600",
      description: "Earn recognized certificates upon completion"
    },
    { 
      label: "Career Growth", 
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      description: "Advance your career with in-demand skills"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Scholaro?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide everything you need to create, deliver, and scale your online education business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div key={feature.label} className="text-center p-6 rounded-2xl hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${feature.color}`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.label}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
