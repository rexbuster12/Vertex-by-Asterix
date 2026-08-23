import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router"
import "./App.css"
import Navbar from "./components/Navbar"
import IntroAnimation from "./components/IntroAnimation"
import AuthPage from "./pages/AuthPage"
import Home from "./pages/Home"
import Communities from "./pages/Communities"
import Students from "./pages/Students"
import Profile from "./pages/Profile"
import ProfileCreatePage from "./pages/ProfileCreatePage"
import CreateCommunityPage from "./pages/CreateCommunityPage"
import CommunityDetail from "./pages/CommunityDetail"
import Notifications from "./pages/Notifications"
import { getActiveUser, getActiveProfile } from "./lib/tempStore"

function ProtectedRoute({
  children,
  allowSetupOnly = false,
}: {
  children: React.ReactNode
  allowSetupOnly?: boolean
}) {
  const user = getActiveUser()
  const profile = getActiveProfile()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile && !allowSetupOnly) {
    return <Navigate to="/profile/create" replace />
  }

  return <>{children}</>
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const user = getActiveUser()
  const profile = getActiveProfile()

  if (user && profile) {
    return <Navigate to="/home" replace />
  }
  if (user && !profile) {
    return <Navigate to="/profile/create" replace />
  }
  return <>{children}</>
}

function AppShell() {
  const location = useLocation()
  const isAuthRoute = ["/", "/login", "/signup"].includes(location.pathname)

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[#F5F1EA] text-[#14161B]">
      {!isAuthRoute && <IntroAnimation />}
      {!isAuthRoute && <Navbar />}

      <main className={isAuthRoute ? "flex-1 w-full" : "flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10"}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicAuthRoute>
                <AuthPage />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <AuthPage />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicAuthRoute>
                <AuthPage />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities"
            element={
              <ProtectedRoute>
                <Communities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/:communityName"
            element={
              <ProtectedRoute>
                <CommunityDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/create"
            element={
              <ProtectedRoute allowSetupOnly>
                <ProfileCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-community"
            element={
              <ProtectedRoute>
                <CreateCommunityPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {!isAuthRoute && (
        <footer className="border-t-2 border-[#141c2b] bg-[#faf7f2] mt-auto py-8 text-xs text-[#545e6d] font-mono">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[#141c2b]">
              <span
                className="font-extrabold uppercase text-xl tracking-[-0.06em] leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                VERTEX
              </span>
              <span>//</span>
              <span className="font-bold text-[10px] tracking-[0.2em] text-[#d84c23] uppercase font-mono">
                CONNECT AND INTERACT
              </span>
            </div>
            <div className="flex items-center gap-5 text-[#141c2b] flex-wrap justify-center font-bold text-xs uppercase">
              <Link to="/home" className="hover:text-[#d84c23] hover:underline">Home</Link>
              <Link to="/communities" className="hover:text-[#d84c23] hover:underline">Communities</Link>
              <Link to="/students" className="hover:text-[#d84c23] hover:underline">DIRECTORY</Link>
              <Link to="/notifications" className="hover:text-[#d84c23] hover:underline">Notifications</Link>
              <Link to="/create-community" className="hover:text-[#d84c23] hover:underline">Create Community</Link>
              <Link to="/profile" className="hover:text-[#d84c23] hover:underline">Profile</Link>
            </div>
            <div className="text-[11px] text-[#8892a0]">&copy; {new Date().getFullYear()} VERTEX. ALL RIGHTS RESERVED.</div>
          </div>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App