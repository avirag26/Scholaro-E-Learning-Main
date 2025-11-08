import React from "react";
import { Star } from 'lucide-react';
import Card from "./Card";

export default function Testimonials({ testimonials = [] }) {
  const defaultTestimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Web Developer',
      img: 'https://images.unsplash.com/photo-1494790108755-2616c9c0e0c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      quote: 'Scholaro transformed my career. The courses are practical and the instructors are world-class.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Data Scientist',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      quote: 'The best investment I made for my professional development. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'UX Designer',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      quote: 'Amazing platform with incredible support. I learned more here than in my college years.',
      rating: 5
    }
  ];
  
  const testimonialsToShow = testimonials.length > 0 ? testimonials : defaultTestimonials;
  
  return (
    <section className="py-20 bg-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Students Say
          </h2>
          <p className="text-xl text-gray-600">
            Real feedback from our learning community
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsToShow.map((testimonial, index) => (
            <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic text-lg">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <img
                  src={testimonial.img}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}