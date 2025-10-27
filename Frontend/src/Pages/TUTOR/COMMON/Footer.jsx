import React from "react";
export default function Footer() {
  return (
    <footer className="w-full bg-black text-white rounded-t-3xl py-12 px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {}
      <div>
        <div className="font-normal text-gray-300 mb-2">
          Empowering learners through accessible and engaging online education.<br />
          Byway is a leading online learning platform dedicated to providing high-quality, flexible, and affordable educational experiences.
        </div>
      </div>
      {}
      <div>
        <div className="font-bold mb-2 text-white">Get Help</div>
        <ul className="text-gray-300 space-y-1">
          <li>Contact Us</li>
          <li>Latest Articles</li>
          <li>FAQ</li>
        </ul>
      </div>
      {}
      <div>
        <div className="font-bold mb-2 text-white">Programs</div>
        <ul className="text-gray-300 space-y-1">
          <li>Art & Design</li>
          <li>Business</li>
          <li>IT & Software</li>
          <li>Languages</li>
          <li>Programming</li>
        </ul>
      </div>
      {}
      <div>
        <div className="font-bold mb-2 text-white">Contact Us</div>
        <div className="text-gray-300 text-sm mb-1">Address: 123 Main Street, Anytown, CA 12345</div>
        <div className="text-gray-300 text-sm mb-1">Tel: +(123) 456-7890</div>
        <div className="text-gray-300 text-sm mb-1">Mail: bywayedu@webkul.in</div>
        <div className="mt-4 flex gap-5">
          {}
          <SocialIcon>
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
              <circle cx="16" cy="16" r="16" fill="#fff"/>
              <path d="M20.94 14.5h-2.003v-1.126c0-.428.314-.528.537-.528H20.94V10.64L18.972 10c-2.176-.579-3.986 1.03-3.986 3.207v1.293H13v2.967h1.986V22h3.132v-4.733h2.003L20.94 14.5z" fill="#1976d2"/>
            </svg>
          </SocialIcon>
          <SocialIcon>
            <svg className="w-8 h-8" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="#fff"/>
              <path fill="#4285f4" d="M16 24c2.7 0 4.96-.9 6.62-2.44l-3.08-2.36c-.86.57-1.97.93-3.54.93-2.71 0-5.03-1.83-5.85-4.38h-3.13v2.47A8.04 8.04 0 0 0 16 24z"/>
              <path fill="#34a853" d="M10.15 15.75A6.04 6.04 0 0 1 9.89 14c0-.61.1-1.2.26-1.75V9.77h-3.13a8.04 8.04 0 0 0 0 7.46l3.13-2.48z"/>
              <path fill="#fbbc05" d="M16 10.36c1.47 0 2.79.51 3.82 1.49l2.85-2.84C21.96 7.51 19.7 6.62 16 6.62a8.03 8.03 0 0 0-6.85 3.15l3.13 2.48c.66-1.25 2-2.62 3.72-2.62z"/>
              <path fill="#ea4335" d="M28 16c0-.87-.08-1.53-.25-2.21h-12v4.36h6.97c-.31 1.47-1.26 2.83-2.97 3.73l3.08 2.36A8.07 8.07 0 0 0 28 16z"/>
            </svg>
          </SocialIcon>
          <SocialIcon>
            <svg className="w-8 h-8" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="#fff"/>
              <path fill="#333" d="M21.5 9c-.8.5-1.6 1-2.5 1.3C18.2 10 17.6 9.8 17 9.8c-1.9 0-3.6 1.7-3.6 3.7 0 1.3.6 2.5 2 3.1-.1 0-.5.2-1.1 0-.8-.3-1.2-1.1-1.2-2.1v-.2c.1 0 .5.2 1.1 0 .8-.3 1.3-1.2.9-2.1-.3-.7-.9-1.2-1.7-1.2-.4 0-.7.1-1 .2-.3-.6-.7-1.1-1.2-1.5C11.7 13 14.2 12 17 12c.6 0 1.2.1 1.7.2z"/>
            </svg>
          </SocialIcon>
          <SocialIcon>
            <svg className="w-8 h-8" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="#fff"/>
              <path fill="#6cc644" d="M25 11.6c0-1.7-1.4-3.1-3.1-3.1-1 0-1.8.6-2.3 1.4C18.3 8.7 17.2 8 16 8c-1.2 0-2.3.7-2.9 1.9-.4-.7-1.3-1.4-2.3-1.4C8.4 8.5 7 9.8 7 11.6c0 .7.3 1.3.8 1.8l6.8 9 6.8-9c.5-.5.8-1.1.8-1.8z"/>
            </svg>
          </SocialIcon>
          <SocialIcon>
            <svg className="w-8 h-8" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="#fff"/>
              <rect x="8" y="8" width="16" height="16" fill="#F3F3F3" />
              <circle cx="16" cy="16" r="6" fill="#F25022" />
              <circle cx="16" cy="16" r="3" fill="#00A4EF" />
            </svg>
          </SocialIcon>
        </div>
      </div>
    </footer>
  );
}
function SocialIcon({ children }) {
  return (
    <span className="inline-flex items-center justify-center">
      {children}
    </span>
  );
}
