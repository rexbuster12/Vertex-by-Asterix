type LogoIconProps = {
  className?: string
  color?: string
}

export default function LogoIcon({ className = "w-6 h-6", color = "currentColor" }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Wing of V */}
      <path
        d="M26 38L42 74L35 90L10 38H26Z"
        fill={color}
      />
      {/* Right Wing of V */}
      <path
        d="M74 38L52 86L46 72L60 38H74Z"
        fill={color}
      />
      <path
        d="M48 93L42 107L38 98L44 85L48 93Z"
        fill={color}
      />
      {/* Dynamic Diagonal Slash Line */}
      <line
        x1="65"
        y1="18"
        x2="22"
        y2="114"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
