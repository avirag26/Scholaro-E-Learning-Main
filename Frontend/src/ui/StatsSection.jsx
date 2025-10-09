import React from "react";

export default function StatsSection() {
  const stats = [
    { value: "25K+", label: "Active Students", description: "Learning worldwide" },
    { value: "1.2K+", label: "Expert Tutors", description: "Industry professionals" },
    { value: "5K+", label: "Online Courses", description: "Across all categories" },
    { value: "98%", label: "Success Rate", description: "Student satisfaction" },
  ];

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Growing Community
          </h2>
          <p className="text-xl text-gray-300">
            Thousands of students and instructors trust Scholaro
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">
                {stat.value}
              </div>
              <div className="text-xl font-semibold text-white mb-2">
                {stat.label}
              </div>
              <div className="text-gray-300">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}