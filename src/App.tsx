import { BrowserRouter, Routes, Route, Link } from "react-router"
import "./App.css"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Communities from "./pages/Communities"
import Students from "./pages/Students"
import Profile from "./pages/Profile"
import ProfileCreatePage from "./pages/ProfileCreatePage"
import CreateCommunityPage from "./pages/CreateCommunityPage"
import IntroAnimation from "./components/IntroAnimation"

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell min-h-screen flex flex-col bg-[#F5F1EA] text-[#14161B]">
        <IntroAnimation />

        <Navbar />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/students" element={<Students />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/create" element={<ProfileCreatePage />} />
            <Route path="/create-community" element={<CreateCommunityPage />} />
          </Routes>
        </main>

        <footer className="border-t-2 border-[#141c2b] bg-[#faf7f2] mt-auto py-8 text-xs text-[#545e6d] font-mono">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[#141c2b]">
              <span className="font-serif font-black uppercase text-base">VERTEX</span>
              <span>//</span>
              <span className="font-bold text-[11px] text-[#d84c23]">CAMPUS PRINT & DISCOVERY DISPATCH</span>
            </div>
            <div className="flex items-center gap-5 text-[#141c2b] flex-wrap justify-center font-bold text-xs uppercase">
              <Link to="/" className="hover:text-[#d84c23] hover:underline">Cover</Link>
              <Link to="/communities" className="hover:text-[#d84c23] hover:underline">Noticeboard</Link>
              <Link to="/students" className="hover:text-[#d84c23] hover:underline">Roster</Link>
              <Link to="/create-community" className="hover:text-[#d84c23] hover:underline">Pin Circle</Link>
              <Link to="/profile" className="hover:text-[#d84c23] hover:underline">Badge</Link>
            </div>
            <div className="text-[11px] text-[#8892a0]">&copy; {new Date().getFullYear()} VERTEX DISPATCH. ALL RIGHTS RESERVED.</div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App