import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function Splash() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    // Small delay so the splash animation has time to play
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate("/chat", { replace: true })
      } else {
        navigate("/login", { replace: true })
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#111B21]">
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.6; }
          50%  { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-bar {
          from { transform: translateX(-100%); }
          to   { transform: translateX(400%); }
        }
        .pulse-ring  { animation: pulse-ring 2s ease-in-out infinite; }
        .fade-up-1   { animation: fade-up 0.5s ease-out 0.3s both; }
        .fade-up-2   { animation: fade-up 0.5s ease-out 0.5s both; }
        .fade-up-3   { animation: fade-up 0.5s ease-out 0.75s both; }
        .shimmer     { animation: spin-bar 1.6s ease-in-out 1s infinite; }
      `}</style>

      {/* Pulsing ring behind icon */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="pulse-ring absolute h-28 w-28 rounded-full bg-[#00A884] opacity-20" />

        {/* Icon container */}
        <div className="fade-up-1 relative flex h-20 w-20 items-center justify-center rounded-full bg-[#00A884] shadow-lg shadow-[#00A884]/30">
          <svg
            className="h-10 w-10 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 8c2 0 6 1 6 3v1H6v-1c0-2 4-3 6-3z" />
          </svg>
        </div>
      </div>

      {/* App name */}
      <p className="fade-up-2 text-2xl font-bold tracking-wide text-[#E9EDEF]">
        WhisperBox
      </p>

      {/* Tagline */}
      <p className="fade-up-3 mt-1 text-sm text-[#8696A0]">
        End-to-end encrypted messaging
      </p>

      {/* Loading bar */}
      <div className="fade-up-3 relative mt-12 h-0.5 w-32 overflow-hidden rounded-full bg-[#2A3942]">
        <div className="shimmer absolute inset-y-0 left-0 w-1/4 rounded-full bg-[#00A884]" />
      </div>
    </div>
  )
}
