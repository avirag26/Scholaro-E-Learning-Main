import { CheckCircle } from "lucide-react";
export default function AboutSection({ aboutImg, officeImg }) {
  const features = [
    "Expert instructors from top companies",
    "Lifetime access to course materials", 
    "24/7 student support",
    "Industry-recognized certificates",
    "Hands-on projects and assignments",
    "Global learning community"
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="text-teal-600 font-semibold text-lg">About Scholaro</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                We provide the best opportunities to students around the globe.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our platform connects passionate educators with eager learners worldwide, 
                creating opportunities for growth, skill development, and career advancement 
                through high-quality online education.
              </p>
            </div>
           <div className="space-y-4">
            {features.map((feature,index)=>(
                <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0" />
                    <span className="text-grey-700">{feature}</span>
                </div>
            ))}
           </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <img
                src={officeImg || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                alt="Learning environment"
                className="rounded-2xl shadow-lg"
              />
              <img
                src={aboutImg || "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                alt="Students collaborating"
                className="rounded-2xl shadow-lg mt-8"
              />
            </div>
            {}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
              <div className="text-2xl font-bold text-teal-600">98%</div>
              <div className="text-gray-600 text-sm">Student Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
