import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router"
import { supabase } from "../lib/supabase"
import CommunityCard, { type CommunityCardProps } from "../components/CommunityCard"

const POPULAR_TAGS = ["All", "Coding", "Law", "Design", "AI", "Chess", "Robotics", "Music", "Startups"]

const FALLBACK_COMMUNITIES: CommunityCardProps[] = [
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
  {
    name: "Campus Chess & Blitz Guild",
    members: 92,
    description: "Bullet tournaments in the student cafeteria, opening theory seminars, and inter-department blitz cups.",
    tags: ["Chess", "Tactics", "Blitz", "BoardGames"],
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Indie Sound & Live Jam Collective",
    members: 68,
    description: "Acoustic sessions behind the amphitheater, original tracks recording, and stage sound engineering.",
    tags: ["Music", "LiveBand", "Acoustic", "Production"],
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
    instagram_link: "https://instagram.com/campus_jam_collective",
  },
]

function Communities() {
  const [communities, setCommunities] = useState<CommunityCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")

  async function fetchCommunities() {
    try {
      setLoading(true)
      setErrorMsg(null)
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false })

      if (error || !data || data.length === 0) {
        setCommunities(FALLBACK_COMMUNITIES)
      } else {
        setCommunities(data)
      }
    } catch (err: any) {
      console.error("Error loading communities:", err)
      setCommunities(FALLBACK_COMMUNITIES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [])

  // Filter based on search query and tag
  const filteredCommunities = useMemo(() => {
    return communities.filter((item) => {
      const name = item.name || ""
      const desc = item.description || ""

      let tagsList: string[] = []
      if (Array.isArray(item.tags)) {
        tagsList = item.tags
      } else if (typeof item.tags === "string") {
        tagsList = item.tags.split(",").map((t) => t.trim())
      }

      const tagsStr = tagsList.join(" ")

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tagsStr.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTag =
        selectedTag === "All" ||
        tagsList.some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
        name.toLowerCase().includes(selectedTag.toLowerCase())

      return matchesSearch && matchesTag
    })
  }, [communities, searchQuery, selectedTag])

  return (
    <div className="editorial-shell space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
            CAMPUS DISPATCH // BOARD 01
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight">
            The Community Noticeboard
          </h1>
          <p className="text-sm text-[#545e6d] max-w-xl">
            Explore authentic student-run clubs, guilds, and cohorts. Pin a new group or join an existing collective.
          </p>
        </div>

        <Link
          to="/create-community"
          className="primary-action self-start sm:self-auto"
        >
          <span>+ Pin Your Community</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-[#fbe8e6] border-2 border-[#d84c23] font-mono text-xs font-bold text-[#d84c23] rounded-xs shadow-[2px_2px_0px_#d84c23]">
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ─────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-4 sm:p-5 shadow-[4px_4px_0px_#141c2b] space-y-4">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-[#141c2b] uppercase tracking-wider border-b border-[#d8cebe] pb-2">
          <span>Filter Noticeboard</span>
          <span className="text-[#d84c23]">{filteredCommunities.length} CIRCLES SHOWN</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by topic, club name, or keyword (e.g., Rust, Moot Court, Robotics, Chess)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-[#ffffff] shadow-[2px_2px_0px_#141c2b] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#d84c23] hover:underline"
            >
              CLEAR ✕
            </button>
          )}
        </div>

        {/* Tag Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xs font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                selectedTag === tag
                  ? "bg-[#141c2b] text-[#faf7f2] border-2 border-[#141c2b] shadow-[2px_2px_0px_#d84c23]"
                  : "bg-[#f5f1ea] text-[#141c2b] border-1.5 border-[#141c2b] hover:bg-[#eae2d5]"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── NOTICEBOARD ASYMMETRIC GRID ─────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-[#545e6d] font-mono text-sm space-y-2">
          <div className="w-8 h-8 border-2 border-[#141c2b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Syncing bulletin board...</p>
        </div>
      ) : filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((item, idx) => (
            <div key={item.id ?? idx} className="h-full">
              <CommunityCard {...item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg space-y-3">
          <h3 className="font-serif text-2xl font-bold text-[#141c2b]">
            No circles found for "{searchQuery || selectedTag}"
          </h3>
          <p className="text-xs text-[#545e6d] font-mono">
            Try resetting your filter or pin the very first club for this topic.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedTag("All")
              }}
              className="secondary-action"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Communities