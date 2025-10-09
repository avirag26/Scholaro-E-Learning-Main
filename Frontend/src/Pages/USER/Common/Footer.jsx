import React from "react";

function Footer() {
  return (
    <div>
      {/* Footer */}
      <footer className="bg-white text-gray-800 py-12 border-t border-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <a href="#" className="text-2xl font-bold text-sky-500">
              Scholaro
            </a>
            <nav className="flex flex-wrap justify-center gap-6">
              <a href="#" className="hover:text-sky-500">
                Home
              </a>
              <a href="#" className="hover:text-sky-500">
                Features
              </a>
              <a href="#" className="hover:text-sky-500">
                Benefits
              </a>
              <a href="#" className="hover:text-sky-500">
                Courses
              </a>
              <a href="#" className="hover:text-sky-500">
                Blogs
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
