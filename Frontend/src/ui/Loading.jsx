import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LoadingPage() {
  const name = 'Scholaro';
  const [progress, setProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex flex-col items-center justify-center px-4">

      {/* Brand Name */}
      <div className="text-center mb-16">
        <motion.h1
          className="text-6xl md:text-7xl font-bold text-sky-600 mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {name.split('').map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              className="inline-block"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: "easeOut"
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-xl text-sky-700 font-medium"
        >
          Your Learning Journey Starts Here
        </motion.p>
      </div>

      {/* Loading Spinner */}
      <div className="relative mb-12">
        {/* Outer Ring */}
        <motion.div
          className="w-20 h-20 border-4 border-sky-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner Ring */}
        <motion.div
          className="absolute inset-2 border-4 border-sky-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Center Dot */}
        <div className="absolute inset-6 bg-sky-500 rounded-full"></div>
      </div>

      {/* Progress Bar */}
      <div className="w-80 max-w-sm mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sky-700 font-medium">Loading</span>
          <span className="text-sky-600 font-semibold">{Math.round(progress)}%</span>
        </div>

        <div className="h-2 bg-sky-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Loading Dots */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-sky-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}
