import { useState, useEffect } from "react"
import { Link, NavLink, useNavigate } from "react-router"
import { Bell, LogOut } from "lucide-react"
import {
  getUnreadNotificationCount,
  subscribeToNotifications,
  mergeRemoteNotifications,
} from "../lib/notificationStore"
import { signOutStudent, syncNotificationsFromDb } from "../lib/supabaseService"
import { getActiveProfile } from "../lib/tempStore"

function Navbar() {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUnreadCount(getUnreadNotificationCount())
    const unsubscribe = subscribeToNotifications(() => {
      setUnreadCount(getUnreadNotificationCount())
    })

    async function syncNotifs() {
      const active = getActiveProfile()
      if (active?.display_name) {
        try {
          const remoteNotifs = await syncNotificationsFromDb(active.display_name)
          if (remoteNotifs && remoteNotifs.length > 0) {
            mergeRemoteNotifications(remoteNotifs)
          }
        } catch { }
      }
    }

    syncNotifs()
    const interval = setInterval(syncNotifs, 4000)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  async function handleLogout() {
    await signOutStudent()
    navigate("/login", { replace: true })
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs font-mono uppercase tracking-[0.1em] font-bold px-3.5 py-2 rounded-sm transition-all ${isActive
      ? "text-[#faf7f2] bg-[#141c2b] shadow-[2px_2px_0px_#d84c23]"
      : "text-[#141c2b] hover:bg-[#eae2d5] hover:text-[#141c2b]"
    }`

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-[#141c2b] bg-[#f5f1ea]/95 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Editorial Masthead */}
          <Link to="/home" className="flex items-center gap-3.5 group mr-10 lg:mr-16">
            <img
              src="/image.png"
              alt="Vertex Logo"
              className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col leading-none">
              <span
                className="text-2xl sm:text-3xl font-extrabold tracking-[-0.06em] text-[#141c2b] uppercase leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                VERTEX
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#545e6d] font-bold mt-1">
                CONNECT AND INTERACT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with generous spacing */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-4">
            <NavLink to="/home" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/communities" className={navLinkClass}>
              Communities
            </NavLink>
            <NavLink to="/students" className={navLinkClass}>
              DIRECTORY
            </NavLink>
          </nav>

          {/* Right Navigation: Notifications, My Profile, Log Out */}
          <div className="hidden md:flex items-center gap-2.5 ml-auto">
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `relative p-2 rounded-sm border-2 border-[#141c2b] transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? "bg-[#141c2b] text-white shadow-[2px_2px_0px_#d84c23]"
                    : "bg-[#faf7f2] text-[#141c2b] hover:bg-[#eae2d5] shadow-[2px_2px_0px_#141c2b]"
                }`
              }
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#d84c23] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center px-1 border border-[#141c2b] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/profile" className={navLinkClass}>
              My Profile
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.05em] text-[#d84c23] bg-[#faf7f2] hover:bg-[#d84c23] hover:text-white border-2 border-[#141c2b] rounded-sm shadow-[2px_2px_0px_#141c2b] transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-sm border-2 border-[#141c2b] bg-[#faf7f2] text-[#141c2b] shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-[#141c2b] bg-[#faf7f2] px-4 py-5 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2">
            <NavLink
              to="/home"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Home
            </NavLink>
            <NavLink
              to="/communities"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Communities
            </NavLink>
            <NavLink
              to="/students"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              DIRECTORY
            </NavLink>
            <NavLink
              to="/notifications"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
            </NavLink>
            <NavLink
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              My Profile
            </NavLink>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/create-community"
              onClick={() => setIsMobileMenuOpen(false)}
              className="primary-action w-full"
            >
              + Create Community
            </Link>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.05em] text-[#d84c23] bg-[#fbe8e6] hover:bg-[#d84c23] hover:text-white border-2 border-[#141c2b] rounded-sm shadow-[2px_2px_0px_#141c2b] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar