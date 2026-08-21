import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { supabase } from "../lib/supabase"
import CommunityCard, { type CommunityCardProps } from "../components/CommunityCard"

const SAMPLE_CAMPUS_CIRCLES: CommunityCardProps[] = [
  {
    name: "Full-Stack & Systems Guild",
    members: 148,
    description: "Building production web apps, exploring Rust & Go distributed systems, and shipping weekend open-source tools.",
    tags: ["Coding", "FullStack", "Rust", "Hackathons"],
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    whatsapp_link: "https://chat.whatsapp.com/demo-guild",
  },
  {
    name: "Campus Moot Court Society",
    members: 86,
    description: "Briefing constitutional law cases, mock trials, bilateral negotiation rounds, and national debate training.",
    tags: ["Law", "Debating", "MootCourt", "Policy"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80",
    instagram_link: "https://instagram.com/mootcourtsociety",
  },
  {
    name: "Human-Centered Design Lab",
    members: 112,
    description: "Weekly design critiques, Figma jams, physical typography zine printing, and UX testing on real campus projects.",
    tags: ["Design", "UIUX", "Typography", "Figma"],
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    instagram_link: "https://instagram.com/designlab_campus",
  },
  {
    name: "Autonomous Robotics & Drone Cell",
    members: 74,
    description: "ROS2 development, LiDAR mapping, PCB soldering, and competitive drone racing across inter-college circuits.",
    tags: ["Robotics", "Hardware", "ROS2", "AI"],
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80",
    whatsapp_link: "https://chat.whatsapp.com/demo-robotics",
  },
]

function Home() {
  const navigate = useNavigate()
  const [dbCommunities, setDbCommunities] = useState<CommunityCardProps[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecent() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("communities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4)

        if (!error && data && data.length > 0) {
          setDbCommunities(data)
        } else {
          setDbCommunities(SAMPLE_CAMPUS_CIRCLES)
        }
      } catch (err) {
        console.error("Error loading home communities:", err)
        setDbCommunities(SAMPLE_CAMPUS_CIRCLES)
      } finally {
        setLoading(false)
      }
    }

    loadRecent()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/communities?q=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate("/communities")
    }
  }

  const displayList = dbCommunities.length > 0 ? dbCommunities : SAMPLE_CAMPUS_CIRCLES

  return (
    <div className="home-zine-shell">
      <section className="zine-hero">
        <div className="zine-topbar">
          <div className="zine-blank" aria-hidden="true" />

          <form onSubmit={handleSearchSubmit} className="zine-search">
            <span>(</span>
            <span className="zine-search-mark">⌕</span>
            <span className="zine-search-divider">|</span>
            <input
              type="text"
              placeholder="Search communities, topics, clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span>)</span>
          </form>

          <Link to="/profile" className="zine-profile" aria-label="My profile">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="zine-art zine-art--left" aria-hidden="true">
          <svg viewBox="0 0 300 300" fill="none">
            <path d="M0,40 Q80,120 160,30 T300,100" />
            <path d="M0,70 Q90,140 180,50 T300,130" />
            <path d="M0,100 Q100,160 200,70 T300,160" />
            <path d="M0,130 Q110,180 220,90 T300,190" />
            <path d="M0,160 Q120,200 240,110 T300,220" />
            <path d="M0,190 Q130,220 260,130 T300,250" />
          </svg>
        </div>

        <div className="zine-art zine-art--right" aria-hidden="true">
          <svg viewBox="0 0 400 400" fill="none">
            <ellipse cx="200" cy="200" rx="170" ry="90" transform="rotate(-25 200 200)" />
            <ellipse cx="200" cy="200" rx="130" ry="70" transform="rotate(-25 200 200)" />
            <ellipse cx="200" cy="200" rx="90" ry="50" transform="rotate(-25 200 200)" />
            <ellipse cx="200" cy="200" rx="55" ry="30" transform="rotate(-25 200 200)" />
            <ellipse cx="70" cy="140" rx="40" ry="70" transform="rotate(20 70 140)" />
            <ellipse cx="130" cy="110" rx="40" ry="70" transform="rotate(35 130 110)" />
            <ellipse cx="200" cy="110" rx="40" ry="70" transform="rotate(50 200 110)" />
            <ellipse cx="270" cy="140" rx="40" ry="70" transform="rotate(65 270 140)" />
            <ellipse cx="330" cy="200" rx="40" ry="70" transform="rotate(80 330 200)" />
            <ellipse cx="330" cy="260" rx="40" ry="70" transform="rotate(95 330 260)" />
            <ellipse cx="270" cy="290" rx="40" ry="70" transform="rotate(110 270 290)" />
            <ellipse cx="200" cy="290" rx="40" ry="70" transform="rotate(125 200 290)" />
            <ellipse cx="130" cy="260" rx="40" ry="70" transform="rotate(140 130 260)" />
            <ellipse cx="70" cy="200" rx="40" ry="70" transform="rotate(155 70 200)" />
          </svg>
        </div>

        <div className="zine-headline-wrap">
          <h1 className="zine-headline zine-headline--1">YOUR INTERESTS,</h1>
          <h1 className="zine-headline zine-headline--2">YOUR COMMUNITY,</h1>
          <h1 className="zine-headline zine-headline--3">YOUR PEOPLE.</h1>
        </div>

        <div className="zine-footer-block">
          <p className="zine-subtitle">CHOOSE THE FOLLOWING PAGES TO VISIT</p>

          <div className="zine-links">
            <Link to="/communities" className="zine-link zine-link--dark">JOINED COMMUNITIES</Link>
            <Link to="/communities" className="zine-link">MORE COMMUNITIES</Link>
            <Link to="/create-community" className="zine-link">NOTICEBOARD</Link>
            <Link to="/profile" className="zine-link">MY PROFILE</Link>
          </div>
        </div>
      </section>

      <section className="zine-lower" aria-hidden="true">
        <div className="zine-lower-shape zine-lower-shape--left" />
        <div className="zine-lower-shape zine-lower-shape--right" />
      </section>

      <section className="zine-discovery">
        <div className="zine-discovery-header">
          <div>
            <p className="zine-kicker">VERTEX EXPLORER // ACTIVE CIRCLES</p>
            <h2>Trending Campus Circles</h2>
          </div>
          <Link to="/communities">Explore All ({displayList.length}+) →</Link>
        </div>

        {loading ? (
          <div className="zine-loading">
            <div className="zine-spinner" />
            Syncing campus database...
          </div>
        ) : (
          <div className="zine-grid">
            {displayList.map((item, idx) => (
              <div key={item.id ?? idx} className="zine-community-card">
                <CommunityCard {...item} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home