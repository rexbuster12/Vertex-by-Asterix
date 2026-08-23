import { useEffect, useState } from "react"

export default function IntroAnimation() {
  const [stage, setStage] = useState<"enter" | "active" | "exit" | "hidden">("enter")

  useEffect(() => {
    // Only run on fresh page load/open
    const hasSeenIntro = sessionStorage.getItem("vertex_intro_played")
    if (hasSeenIntro) {
      setStage("hidden")
      return
    }

    // Step 1: Blur in and Zoom in
    const enterTimer = setTimeout(() => {
      setStage("active")
    }, 50)

    // Step 2: Begin smooth Blur out and Zoom out
    const exitTimer = setTimeout(() => {
      setStage("exit")
      sessionStorage.setItem("vertex_intro_played", "true")
    }, 1400)

    // Step 3: Remove from DOM
    const finishTimer = setTimeout(() => {
      setStage("hidden")
    }, 2000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(finishTimer)
    }
  }, [])

  if (stage === "hidden") return null

  const handleSkip = () => {
    setStage("hidden")
    sessionStorage.setItem("vertex_intro_played", "true")
  }

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f5f1ea] cursor-pointer transition-all duration-700 ease-out ${
        stage === "enter"
          ? "opacity-0 backdrop-blur-xl scale-90"
          : stage === "active"
          ? "opacity-100 backdrop-blur-none scale-100"
          : "opacity-0 backdrop-blur-2xl scale-110 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center space-y-6 text-center px-4">
        {/* Animated Emblem with transparent PNG matching background */}
        <div className="relative group">
          <img
            src="/image.png"
            alt="Vertex TechStorm Logo"
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_8px_16px_rgba(20,28,43,0.15)] transition-transform duration-1000 ease-out transform group-hover:scale-105"
          />
        </div>

        {/* Brand Name */}
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#141c2b] uppercase">
            VERTEX
          </h1>
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#d84c23] uppercase">
            CONNECT AND INTERACT // WHERE PATHS CONVERGE
          </p>
        </div>

        {/* Subtle Progress Bar Indicator */}
        <div className="w-28 h-1 bg-[#d8cebe] border border-[#141c2b] rounded-none overflow-hidden mt-3">
          <div className="w-full h-full bg-[#141c2b] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
