import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, BookOpen, GraduationCap } from 'lucide-react'

const emojis = ['📚', '🎓', '✏️', '🖥️', '🧠', '💡', '🔍', '📖']

export default function NotFoundPage() {
  const [isDay, setIsDay] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const hour = new Date().getHours()
    setIsDay(hour >= 6 && hour < 18)
    document.documentElement.className = isDay ? 'light' : 'dark'
    return () => document.documentElement.classList.remove('light', 'dark')
  }, [isDay])



  // Sky Blue Gradient Background
  const GradientBackground = () => (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)'
      }}
    />
  )

  // Floating particles animation
  const FloatingParticles = () => (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-sky-200/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  )



  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground />
      <FloatingParticles />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Header with Logo */}
        <motion.div
          className="absolute left-8 top-8 px-6 py-3 rounded-2xl backdrop-blur-lg shadow-2xl font-bold text-3xl bg-white/10 text-white border border-white/20"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Scholaro
        </motion.div>

        {/* 404 Number with enhanced styling */}
        <motion.div
          className="mb-8 text-9xl font-black text-white drop-shadow-2xl relative"
          initial={{ scale: 0.5, rotate: 12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <span className="relative z-10">404</span>
          <motion.div
            className="absolute inset-0 text-9xl font-black text-white/20 blur-sm"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            404
          </motion.div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="mb-4 text-5xl md:text-6xl font-extrabold text-white text-center drop-shadow-lg"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Oops! Page Not Found
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p
          className="mb-8 text-xl md:text-2xl text-center px-4 text-white/90 max-w-2xl"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          It seems you've wandered off the learning path. Let's get you back on track!
        </motion.p>



        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-12"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold shadow-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold shadow-lg bg-white text-gray-800 hover:bg-white/90 transition-all duration-300"
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Home className="w-5 h-5" />
            Home Page
          </motion.button>
        </motion.div>



        {/* Animated Emojis */}
        <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-3 z-10 flex-wrap">
          {emojis.map((emoji, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              animate={{
                y: [0, -20, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
                delay: idx * 0.2,
              }}
              whileHover={{ 
                scale: 1.5, 
                rotate: [0, 15, -15, 0],
                transition: { duration: 0.3 }
              }}
              className="text-3xl md:text-4xl cursor-pointer hover:drop-shadow-lg"
              aria-label="Animated learning emoji"
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute right-8 top-1/2 transform -translate-y-1/2 z-0 pointer-events-none opacity-10"
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 10, scale: 1.2 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        >
          <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          className="absolute left-8 bottom-1/4 z-0 pointer-events-none opacity-10"
          initial={{ rotate: 10, scale: 0.8 }}
          animate={{ rotate: -10, scale: 1.2 }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        >
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}