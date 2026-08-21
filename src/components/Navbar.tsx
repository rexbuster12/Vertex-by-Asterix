import { useState } from "react"
import { Link, NavLink } from "react-router"

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs font-mono uppercase tracking-[0.1em] font-bold px-3.5 py-2 rounded-sm transition-all ${
      isActive
        ? "text-[#faf7f2] bg-[#141c2b] shadow-[2px_2px_0px_#d84c23]"
        : "text-[#141c2b] hover:bg-[#eae2d5] hover:text-[#141c2b]"
    }`

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-[#141c2b] bg-[#f5f1ea]/95 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Editorial Masthead */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/vertex-logo.jpg"
              alt="Vertex Logo"
              className="h-10 w-10 rounded-sm object-cover border-2 border-[#141c2b] shadow-[2px_2px_0px_#141c2b] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform"
            />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-2xl font-black tracking-[-0.04em] text-[#141c2b] uppercase leading-none">
                VERTEX
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#545e6d] font-bold mt-0.5">
                CAMPUS DISPATCH // DISCOVERY
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Cover
            </NavLink>
            <NavLink to="/communities" className={navLinkClass}>
              Noticeboard
            </NavLink>
            <NavLink to="/students" className={navLinkClass}>
              Directory
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              My Profile
            </NavLink>
          </nav>

          {/* Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/create-community"
              className="primary-action"
              style={{
                padding: "0.55rem 1.1rem",
                fontSize: "0.8rem",
                boxShadow: "3px 3px 0px #141c2b",
              }}
            >
              <span>+ Pin a Community</span>
            </Link>
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
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
              end
            >
              Cover
            </NavLink>
            <NavLink
              to="/communities"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Noticeboard
            </NavLink>
            <NavLink
              to="/students"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              Directory
            </NavLink>
            <NavLink
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              My Profile
            </NavLink>
          </nav>
          <div className="pt-2">
            <Link
              to="/create-community"
              onClick={() => setIsMobileMenuOpen(false)}
              className="primary-action w-full"
            >
              + Pin a Community
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar