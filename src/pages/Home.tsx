import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Megaphone } from "lucide-react"
import CommunityCard, { type CommunityCardProps } from "../components/CommunityCard"
import { getStoredCommunities } from "../lib/mockStore"
import { fetchCommunitiesFromDb } from "../lib/supabaseService"
import { supabase } from "../lib/supabase"

interface HomeAnnouncement {
  id: string
  communityName: string
  title: string
  content: string
  date: string
  author: string
  tag?: string
  image?: string
  likes?: number
  dislikes?: number
}

function Home() {
  const navigate = useNavigate()
  const [dbCommunities, setDbCommunities] = useState<CommunityCardProps[]>([])
  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true)
        // 1. Load local cache
        const localList = getStoredCommunities()
        let mapped: CommunityCardProps[] = localList.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          members: c.members_count || c.members?.length || 1,
          members_count: c.members_count || c.members?.length || 1,
          whatsapp_link: c.whatsapp_link,
          instagram_link: c.instagram_link,
          image: c.image,
        }))

        // Collect local announcements
        const collected: HomeAnnouncement[] = []
        localList.forEach((comm) => {
          if (comm.announcements && comm.announcements.length > 0) {
            comm.announcements.forEach((ann) => {
              collected.push({
                id: ann.id,
                communityName: comm.name,
                title: ann.title,
                content: ann.content,
                date: ann.date,
                author: ann.author,
                tag: ann.tag,
                image: ann.image,
                likes: ann.likes || 0,
                dislikes: ann.dislikes || 0,
              })
            })
          }
        })

        // 2. Fetch live data from Supabase
        try {
          const remoteComms = await fetchCommunitiesFromDb()
          if (remoteComms && Array.isArray(remoteComms) && remoteComms.length > 0) {
            const mappedRemote: CommunityCardProps[] = remoteComms.map((c) => ({
              id: c.id || c.name,
              name: c.name,
              description: c.description,
              members: c.members_count || 1,
              members_count: c.members_count || 1,
              whatsapp_link: c.whatsapp_link,
              instagram_link: c.instagram_link,
              image: c.image,
            }))

            const seen = new Set<string>()
            mapped = [...mappedRemote, ...mapped].filter((c) => {
              const k = c.name.trim().toLowerCase()
              if (seen.has(k)) return false
              seen.add(k)
              return true
            })

            // Also fetch announcements from Supabase
            const { data: dbAnnouncements } = await supabase
              .from("announcements")
              .select("*, communities(name)")
              .order("created_at", { ascending: false })

            if (dbAnnouncements && dbAnnouncements.length > 0) {
              const remoteAnn = dbAnnouncements.map((a: any) => ({
                id: a.id,
                communityName: a.communities?.name || "Campus Community",
                title: a.title,
                content: a.content,
                date: a.created_at ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today",
                author: "Community Dispatch",
                tag: a.tag || "NOTICE",
                image: a.image,
                likes: a.likes || 0,
                dislikes: a.dislikes || 0,
              }))

              // Merge announcements without duplicates
              const seenAnn = new Set<string>()
              const combinedAnn = [...remoteAnn, ...collected].filter((a) => {
                if (seenAnn.has(a.id)) return false
                seenAnn.add(a.id)
                return true
              })
              setAnnouncements(combinedAnn)
            } else {
              setAnnouncements(collected)
            }
          } else {
            setAnnouncements(collected)
          }
        } catch (dbErr) {
          console.warn("Supabase home load notice:", dbErr)
          setAnnouncements(collected)
        }

        setDbCommunities(mapped.slice(0, 4))
      } catch (err) {
        console.error("Error loading home data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/communities?q=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate("/communities")
    }
  }

  const displayList = dbCommunities

  return (
    <div className="home-zine-shell">
      <section className="zine-hero">
        <div className="zine-topbar">
          <div className="zine-blank" aria-hidden="true" />

          <form onSubmit={handleSearchSubmit} className="zine-search">
            <span className="zine-search-mark">⌕</span>
            <input
              type="text"
              placeholder="Search communities"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          <div className="zine-links">
            <Link to="/communities" className="zine-link zine-link--dark">JOINED COMMUNITIES</Link>
            <Link to="/communities" className="zine-link">EXPLORE COMMUNITIES</Link>
            <Link to="/create-community" className="zine-link">CREATE COMMUNITY</Link>
          </div>
        </div>
      </section>

      {/* Middle Bubble Container: Live Community Announcements Feed */}
      <section className="zine-lower relative p-5 sm:p-7 flex flex-col justify-between overflow-hidden">
        <div className="zine-lower-shape zine-lower-shape--left pointer-events-none" aria-hidden="true" />
        <div className="zine-lower-shape zine-lower-shape--right pointer-events-none" aria-hidden="true" />

        {/* Section Header */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-[#141c2b]/15 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#d84c23]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#141c2b]">
              Campus Bulletins & Announcements Feed
            </span>
          </div>
          <div className="flex items-center gap-2">
            {announcements.length > 0 && (
              <span className="font-mono text-[10px] font-black uppercase bg-[#d84c23] text-white px-2 py-0.5 rounded-xs shadow-[1px_1px_0px_#141c2b]">
                {announcements.length} Live
              </span>
            )}
            <Link
              to="/notifications"
              className="font-mono text-[11px] font-bold text-[#141c2b] hover:text-[#d84c23] uppercase underline"
            >
              All Alerts →
            </Link>
          </div>
        </div>

        {/* Announcements Content */}
        <div className="relative z-10 my-auto py-3.5">
          {announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/communities/${encodeURIComponent(item.communityName)}`}
                  className="group bg-white/95 backdrop-blur-xs border-2 border-[#141c2b] p-4 rounded-sm shadow-[3px_3px_0px_#141c2b] hover:bg-white hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 bg-[#141c2b] text-white rounded-2xs">
                        {item.tag || "NOTICE"}
                      </span>
                      <span className="font-mono text-[10px] text-[#545e6d]">{item.date}</span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase block truncate">
                        {item.communityName}
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#141c2b] group-hover:text-[#d84c23] transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                    </div>

                    {item.image && (
                      <div className="h-24 w-full overflow-hidden rounded-2xs border border-[#141c2b] my-1">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <p className="text-xs text-[#545e6d] line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-3 border-t border-[#141c2b]/10 flex items-center justify-between font-mono text-[10px] text-[#8892a0]">
                    <span>By <b>{item.author}</b> {((item.likes || 0) > 0 || (item.dislikes || 0) > 0) && `• 👍 ${item.likes || 0}`}</span>
                    <span className="text-[#141c2b] font-bold group-hover:text-[#d84c23]">
                      View Bulletin →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 space-y-2 max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#141c2b] flex items-center justify-center mx-auto text-[#d84c23] shadow-[2px_2px_0px_#141c2b]">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-black text-[#141c2b]">
                Campus Community Bulletins
              </h3>
              <p className="text-xs text-[#545e6d] leading-relaxed">
                When you create or join communities, announcements, event schedules, and important club notices are broadcast here in real-time.
              </p>
              <div className="pt-1">
                <Link
                  to="/create-community"
                  className="font-mono text-xs font-bold uppercase text-[#d84c23] hover:underline inline-flex items-center gap-1"
                >
                  <span> Create a Community to Post First Announcement</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="zine-discovery">
        <div className="zine-discovery-header">
          <div>
            <p className="zine-kicker">VERTEX EXPLORER // ACTIVE COMMUNITIES</p>
            <h2>Trending Campus Communities</h2>
          </div>
          <Link to="/communities">Explore All ({displayList.length}+) →</Link>
        </div>

        {loading ? (
          <div className="zine-loading">
            <div className="zine-spinner" />
            Syncing campus database...
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-16 text-center bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg">
            <h3 className="font-serif text-xl font-bold text-[#141c2b]">No communities yet</h3>
            <p className="text-sm text-[#545e6d] max-w-lg mx-auto mt-2">The community board is empty. Create the first community to get started.</p>
            <div className="mt-4">
              <Link to="/create-community" className="primary-action" style={{ padding: "0.55rem 1.1rem" }}>
                + Create Community
              </Link>
            </div>
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