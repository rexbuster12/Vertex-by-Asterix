import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react"
import { setActiveUser } from "../lib/tempStore"

const BMU_DOMAIN = "@bmu.edu.in"

function VertexLogo() {
  return (
    <div className="vertex-logo flex flex-col items-center justify-center mb-6">
      <div className="flex items-center gap-3.5">
        <img
          src="/image.png"
          alt="Vertex Logo"
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
        />
        <div className="flex flex-col leading-none text-left">
          <span
            className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-0.06em] text-[#141c2b] uppercase leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VERTEX
          </span>
          <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.24em] text-[#545e6d] font-bold mt-1">
            CONNECT AND INTERACT
          </span>
        </div>
      </div>
    </div>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Form states
  const [emailPrefix, setEmailPrefix] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(location.pathname === "/signup")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null)
  const [showIntro, setShowIntro] = useState(true)

  // Forgot Password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)
  const [enteredOtp, setEnteredOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  useEffect(() => {
    setIsSignup(location.pathname === "/signup")
    setIsForgotPassword(false)
  }, [location.pathname])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  function cleanPrefixInput(prefix: string) {
    let clean = prefix.trim().toLowerCase()
    if (clean.includes("@")) {
      clean = clean.split("@")[0]
    }
    return clean
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setMessage(null)

    const cleanPrefix = cleanPrefixInput(emailPrefix)
    if (!cleanPrefix) {
      setMessage({ type: "error", text: "Please enter your BMU student ID / email prefix." })
      return
    }

    const fullEmail = `${cleanPrefix}${BMU_DOMAIN}`

    if (!password) {
      setMessage({ type: "error", text: "Please enter your password." })
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." })
      return
    }

    if (isSignup) {
      if (!confirmPassword) {
        setMessage({ type: "error", text: "Please confirm your password." })
        return
      }
      if (password !== confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match." })
        return
      }
    }

    setLoading(true)

    const formattedName = cleanPrefix
      .split(".")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")

    const temporaryUser = {
      email: fullEmail,
      name: formattedName,
      username: cleanPrefix,
    }

    setActiveUser(temporaryUser)
    console.log("🚀 [AUTH LOGIN - AUTOMATIC USERNAME ASSIGNED (@" + cleanPrefix + ")]:", temporaryUser)

    setMessage({
      type: "success",
      text: isSignup ? "Account created! Redirecting to setup profile..." : "Signed in! Redirecting...",
    })

    setTimeout(() => {
      setLoading(false)
      navigate("/profile/create", { replace: true })
    }, 600)
  }

  // Handle requesting 6-digit OTP
  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    const cleanPrefix = cleanPrefixInput(emailPrefix)
    if (!cleanPrefix) {
      setMessage({ type: "error", text: "Please enter your registered BMU email prefix." })
      return
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
    setOtpSent(true)
    setMessage({
      type: "info",
      text: `6-Digit verification code generated for ${cleanPrefix}${BMU_DOMAIN}.`,
    })
  }

  // Handle resetting password with OTP
  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (enteredOtp.trim() !== generatedOtp) {
      setMessage({ type: "error", text: "Invalid verification OTP code. Please check and try again." })
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long." })
      return
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: "error", text: "New passwords do not match." })
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setPassword(newPassword)
      setIsForgotPassword(false)
      setOtpSent(false)
      setGeneratedOtp(null)
      setEnteredOtp("")
      setNewPassword("")
      setConfirmNewPassword("")
      setMessage({
        type: "success",
        text: "Password changed successfully! You can now sign in with your new password.",
      })
    }, 600)
  }

  return (
    <div className="vertex-auth-shell min-h-screen flex items-center justify-center bg-[#f5f1ea] px-4 py-8 relative overflow-hidden">
      {/* Background Subtle Accent Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#141c2b_1px,transparent_1px)] [background-size:24px_24px]" />

      {showIntro ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5f1ea] transition-all duration-700 animate-pulse">
          <div className="flex flex-col items-center space-y-3">
            <img
              src="/image.png"
              alt="Vertex Logo"
              className="w-20 h-20 object-contain"
            />
            <span
              className="text-4xl font-extrabold tracking-[-0.06em] text-[#141c2b] uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              VERTEX
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#545e6d] font-bold">
              CONNECT AND INTERACT
            </span>
          </div>
        </div>
      ) : (
        <main className="vertex-auth-page w-full max-w-2xl sm:max-w-3xl px-4 sm:px-6 relative z-10 animate-zoom-in-blur">
          <div className="vertex-auth-card bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-8 sm:p-12 shadow-[8px_8px_0px_#141c2b]">
            <VertexLogo />

            {/* Header */}
            <div className="vertex-auth-header text-center mb-6">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#141c2b] tracking-[-0.05em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isForgotPassword
                  ? "Reset Your Password"
                  : isSignup
                    ? "Create BMU Account"
                    : "Sign in to Vertex"}
              </h1>
            </div>

            {/* Status Messages */}
            {message && (
              <div
                className={`p-3.5 mb-5 border-2 rounded-xs font-mono text-xs font-bold shadow-[2px_2px_0px_#141c2b] flex items-center gap-2 ${message.type === "error"
                  ? "bg-[#fbe8e6] border-[#d84c23] text-[#d84c23]"
                  : message.type === "success"
                    ? "bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32]"
                    : "bg-[#e3f2fd] border-[#1565c0] text-[#1565c0]"
                  }`}
              >
                {message.type === "error" && <span>⚠</span>}
                {message.type === "success" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                {message.type === "info" && <ShieldCheck className="w-4 h-4 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* ── FORGOT PASSWORD FLOW ────────────────────────────────────────── */}
            {isForgotPassword ? (
              !otpSent ? (
                /* Step 1: Request OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                      BMU Student Email <span className="text-[#d84c23]">*</span>
                    </label>
                    <div className="flex items-stretch rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] shadow-[3px_3px_0px_#141c2b] focus-within:bg-white transition-all overflow-hidden">
                      <input
                        id="reset-email"
                        type="text"
                        value={emailPrefix}
                        onChange={(e) => setEmailPrefix(e.target.value.replace(/@.*/, "").trim())}
                        placeholder="e.g. rohit.sharma.23"
                        className="w-full bg-transparent px-3.5 py-3 text-sm font-sans font-medium text-[#141c2b] placeholder-[#8892a0] focus:outline-none"
                        required
                      />
                      <div className="flex items-center px-3.5 font-mono text-xs sm:text-sm font-bold text-[#141c2b] bg-[#eae2d5] border-l-2 border-[#141c2b] select-none whitespace-nowrap">
                        @bmu.edu.in
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-action w-full mt-3 font-mono uppercase tracking-wider font-bold"
                    style={{ padding: "0.85rem 1.5rem" }}
                  >
                    Send Verification OTP →
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false)
                        setMessage(null)
                      }}
                      className="font-mono text-xs font-bold text-[#545e6d] hover:text-[#141c2b] hover:underline uppercase inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter OTP & New Password */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* Simulated OTP Display Banner for Demo */}
                  {generatedOtp && (
                    <div className="p-3 bg-[#eae2d5] border-2 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] flex items-center justify-between shadow-[2px_2px_0px_#141c2b]">
                      <span className="font-bold uppercase text-[#d84c23]">Demo OTP Code:</span>
                      <span className="font-black text-sm tracking-widest bg-white px-2 py-0.5 border border-[#141c2b] rounded-2xs">
                        {generatedOtp}
                      </span>
                    </div>
                  )}

                  {/* OTP Code Field */}
                  <div>
                    <label htmlFor="reset-otp" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                      6-Digit OTP Code <span className="text-[#d84c23]">*</span>
                    </label>
                    <input
                      id="reset-otp"
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.trim())}
                      placeholder="Enter 6-digit OTP"
                      className="w-full rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] px-3.5 py-3 text-base font-mono font-bold tracking-widest text-[#141c2b] placeholder-[#8892a0] focus:outline-none focus:bg-white shadow-[3px_3px_0px_#141c2b]"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="reset-new-password" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                      New Password <span className="text-[#d84c23]">*</span>
                    </label>
                    <div className="flex items-center rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] shadow-[3px_3px_0px_#141c2b] focus-within:bg-white transition-all overflow-hidden">
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-transparent px-3.5 py-3 text-sm font-sans font-medium text-[#141c2b] placeholder-[#8892a0] focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="px-3.5 text-[#545e6d] hover:text-[#141c2b] transition-colors focus:outline-none cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label htmlFor="reset-confirm-new-password" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                      Confirm New Password <span className="text-[#d84c23]">*</span>
                    </label>
                    <div className="flex items-center rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] shadow-[3px_3px_0px_#141c2b] focus-within:bg-white transition-all overflow-hidden">
                      <input
                        id="reset-confirm-new-password"
                        type={showConfirmNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full bg-transparent px-3.5 py-3 text-sm font-sans font-medium text-[#141c2b] placeholder-[#8892a0] focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        className="px-3.5 text-[#545e6d] hover:text-[#141c2b] transition-colors focus:outline-none cursor-pointer"
                        title={showConfirmNewPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="primary-action w-full mt-3 font-mono uppercase tracking-wider font-bold"
                    style={{ padding: "0.85rem 1.5rem" }}
                  >
                    {loading ? "Resetting Password..." : "Confirm & Reset Password →"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false)
                        setOtpSent(false)
                        setGeneratedOtp(null)
                        setMessage(null)
                      }}
                      className="font-mono text-xs font-bold text-[#545e6d] hover:text-[#141c2b] hover:underline uppercase inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* ── MAIN SIGN IN / SIGN UP FORM ────────────────────────────────── */
              <form onSubmit={handleSubmit} className="vertex-auth-form space-y-4">
                {/* Student Email with Attached Domain Suffix */}
                <div className="vertex-form-field">
                  <label htmlFor="auth-email" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                    Student Email <span className="text-[#d84c23]">*</span>
                  </label>
                  <div className="flex items-stretch rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] shadow-[3px_3px_0px_#141c2b] focus-within:bg-white transition-all overflow-hidden">
                    <input
                      id="auth-email"
                      type="text"
                      value={emailPrefix}
                      onChange={(e) => {
                        const val = e.target.value.replace(/@.*/, "").trim()
                        setEmailPrefix(val)
                      }}
                      placeholder="e.g. rohit.sharma.23"
                      className="w-full bg-transparent px-3.5 py-3 text-sm font-sans font-medium text-[#141c2b] placeholder-[#8892a0] focus:outline-none"
                      required
                    />
                    <div className="flex items-center px-3.5 font-mono text-xs sm:text-sm font-bold text-[#141c2b] bg-[#eae2d5] border-l-2 border-[#141c2b] select-none whitespace-nowrap">
                      @bmu.edu.in
                    </div>
                  </div>
                </div>

                {/* Password Field with Eye Toggle */}
                <div className="vertex-form-field">
                  <label htmlFor="auth-password" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                    Password <span className="text-[#d84c23]">*</span>
                  </label>
                  <div className="flex items-center rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] shadow-[3px_3px_0px_#141c2b] focus-within:bg-white transition-all overflow-hidden">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? "Create secure password (min 6 chars)" : "Enter your password"}
                      className="w-full bg-transparent px-3.5 py-3 text-sm font-sans font-medium text-[#141c2b] placeholder-[#8892a0] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="px-3.5 text-[#545e6d] hover:text-[#141c2b] transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Forgot Password Button (Sign-in only) */}
                  {!isSignup && (
                    <div className="flex justify-end pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true)
                          setMessage(null)
                          setOtpSent(false)
                          setGeneratedOtp(null)
                        }}
                        className="font-mono text-xs font-bold text-[#d84c23] hover:underline uppercase inline-flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Forgot your password?</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Signup only) with Eye Toggle */}
                {isSignup && (
                  <div className="vertex-form-field">
                    <label htmlFor="auth-confirm-password" className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                      Confirm Password <span className="text-[#d84c23]">*</span>
                    </label>
                    <div className="flex items-center rounded-xs border-2 border-[#141c2b] bg-[#f5f1ea] shadow-[3px_3px_0px_#141c2b] focus-within:bg-white transition-all overflow-hidden">
                      <input
                        id="auth-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-transparent px-3.5 py-3 text-sm font-sans font-medium text-[#141c2b] placeholder-[#8892a0] focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="px-3.5 text-[#545e6d] hover:text-[#141c2b] transition-colors focus:outline-none cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="primary-action w-full mt-3 font-mono uppercase tracking-wider font-bold"
                  style={{ padding: "0.85rem 1.5rem" }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : isSignup ? (
                    "Create Account →"
                  ) : (
                    "Sign In →"
                  )}
                </button>
              </form>
            )}

            {/* Bottom Toggle between Login & Signup */}
            {!isForgotPassword && (
              <div className="vertex-auth-toggle mt-6 pt-4 border-t-2 border-[#d8cebe] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup((prev) => !prev)
                    setMessage(null)
                    setPassword("")
                    setConfirmPassword("")
                    setShowPassword(false)
                    setShowConfirmPassword(false)
                    navigate(isSignup ? "/login" : "/signup", { replace: true })
                  }}
                  className="font-mono text-xs font-bold text-[#d84c23] hover:underline uppercase cursor-pointer"
                >
                  {isSignup ? "Already have a verified account? Sign in" : "New to campus? Create account"}
                </button>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  )
}

export default AuthPage
