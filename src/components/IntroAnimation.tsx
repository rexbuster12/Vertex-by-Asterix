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
    }, 1300)

    // Step 3: Remove from DOM
    const finishTimer = setTimeout(() => {
      setStage("hidden")
    }, 1900)

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
          ? "opacity-0 backdrop-blur-xl scale-95"
          : stage === "active"
          ? "opacity-100 backdrop-blur-none scale-100"
          : "opacity-0 backdrop-blur-2xl scale-105 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center space-y-5 text-center px-4">
        {/* Animated Emblem with ink border and hard drop shadow */}
        <img
          src="/vertex-logo.jpg"
          alt="Vertex"
          className="w-32 h-40 sm:w-36 sm:h-44 rounded-sm object-cover border-2 border-[#141c2b] shadow-[6px_6px_0px_#141c2b] transition-transform duration-1000 ease-out"
        />

        {/* Brand Name */}
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#141c2b] uppercase">
            VERTEX
          </h1>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#d84c23] uppercase">
            CAMPUS DISPATCH // WHERE PATHS CONVERGE
          </p>
        </div>

        {/* Subtle Indicator */}
        <div className="w-24 h-1 bg-[#d8cebe] border border-[#141c2b] rounded-none overflow-hidden mt-3">
          <div className="w-full h-full bg-[#141c2b] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
