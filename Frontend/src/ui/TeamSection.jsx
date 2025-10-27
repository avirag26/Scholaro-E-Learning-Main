import React from "react";
import { Star, Users, BookOpen } from 'lucide-react';
import Card from "./Card";
export default function TeamSection({ instructors = [] }) {
  const defaultInstructors = [
    {
      name: "Dr. Sarah Wilson",
      role: "Full Stack Development Expert",
      img: "https://images.unsplash.com/photo-1494790108755-2616c9c0e0c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      experience: "10+ years",
      students: "15K+",
      courses: "25",
      rating: 4.9,
      specialties: ["React", "Node.js", "Python"]
    },
    {
      name: "Prof. Michael Rodriguez",
      role: "Data Science & AI Specialist",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      experience: "12+ years",
      students: "20K+",
      courses: "18",
      rating: 4.8,
      specialties: ["Machine Learning", "Python", "Statistics"]
    },
    {
      name: "Emily Chen",
      role: "UX/UI Design Mentor",
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      experience: "8+ years",
      students: "12K+",
      courses: "22",
      rating: 4.9,
      specialties: ["Figma", "Design Systems", "User Research"]
    }
  ];
  const instructorsToShow = instructors.length > 0 ? instructors : defaultInstructors;
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Meet Our Expert Instructors
          </h2>
          <p className="text-xl text-gray-600">
            Learn from industry professionals and thought leaders
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {instructorsToShow.map((instructor, index) => (
            <Card key={index} className="p-8 text-center hover:shadow-xl transition-shadow group">
              <div className="relative mb-6">
                <img
                  src={instructor.img}
                  alt={instructor.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-teal-100 group-hover:border-teal-300 transition-colors"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {instructor.experience || "Expert"}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{instructor.name}</h3>
              <p className="text-teal-600 font-medium mb-4">{instructor.role}</p>
              {instructor.specialties && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {instructor.specialties.map((specialty, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                {instructor.students && (
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{instructor.students}</span>
                  </div>
                )}
                {instructor.courses && (
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>{instructor.courses} courses</span>
                  </div>
                )}
                {instructor.rating && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                    <span>{instructor.rating}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
