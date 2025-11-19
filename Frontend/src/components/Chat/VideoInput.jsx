import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, ArrowRight, Lock } from 'lucide-react'

const VideoInput = () => {
  const [roomCode, setRoomCode] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleFormSubmit = (ev) => {
    ev.preventDefault()
    if (roomCode.trim()) {
      setIsLoading(true)
      // Simulate a brief loading state for polish
      setTimeout(() => {
        navigate(`/video/room/${roomCode}`)
      }, 300)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-xl shadow-blue-500/30">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Join a Room</h1>
          <p className="text-slate-300 text-lg">Connect with your team instantly</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleFormSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          {/* Input Container */}
          <div className="mb-8">
            <label htmlFor="roomCode" className="block text-sm font-semibold text-slate-300 mb-3">
              Room Code
            </label>
            <div
              className={`relative transition-all duration-300 ${
                isFocused ? 'ring-2 ring-blue-500/50' : ''
              } rounded-xl`}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="roomCode"
                type="text"
                required
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl py-4 pl-12 pr-4 text-lg font-semibold focus:outline-none focus:border-blue-500 transition-all duration-300 tracking-widest"
                maxLength="20"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Share this code with your participants</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!roomCode.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>Enter Room</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '🔒', label: 'Secure' },
            { icon: '⚡', label: 'Fast' },
            { icon: '🌐', label: 'Global' }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoInput