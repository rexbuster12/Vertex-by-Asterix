import { useEffect, useState, useMemo } from "react"
import { Link, useSearchParams } from "react-router"
import { Search, PlusCircle } from "lucide-react"
import CommunityCard, { type CommunityCardProps } from "../components/CommunityCard"
import { getStoredCommunities } from "../lib/mockStore"

function Communities() {
  const [searchParams] = useSearchParams()
  const [communities, setCommunities] = useState<CommunityCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "")

  useEffect(() => {
    // Load directly from our resilient mockStore
    try {
      const list = getStoredCommunities()
      const mapped: CommunityCardProps[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        members: c.members_count || c.members?.length || 1,
        members_count: c.members_count || c.members?.length || 1,
        whatsapp_link: c.whatsapp_link,
        instagram_link: c.instagram_link,
        image: c.image,
      }))
      setCommunities(mapped)
    } catch (err) {
      console.warn("Error reading stored communities:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter based on search query (name and description)
  const filteredCommunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return communities

    return communities.filter((item) => {
      const name = item.name || ""
      const desc = item.description || ""
      return (
        name.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query)
      )
    })
  }, [communities, searchQuery])

  return (
    <div className="editorial-shell space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight font-serif">
            Student Communities
          </h1>
          <p className="text-sm text-[#545e6d] max-w-2xl">
            Explore authentic student-run clubs, societies, and build cohorts at <span className="whitespace-nowrap">BML Munjal University</span>.
          </p>
        </div>

        <Link
          to="/create-community"
          className="primary-action self-start sm:self-auto text-xs font-mono uppercase font-bold tracking-[0.1em] flex items-center gap-1.5"
          style={{ padding: "0.65rem 1.25rem" }}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch Community</span>
        </Link>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ─────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-4 sm:p-5 shadow-[4px_4px_0px_#141c2b] space-y-4">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-[#141c2b] uppercase tracking-wider border-b border-[#d8cebe] pb-2">
          <span>Browse Communities</span>
          <span className="text-[#d84c23]">{filteredCommunities.length} ACTIVE HUBS</span>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-[#545e6d]" />
          <input
            type="text"
            placeholder="Search for communities and build your mesh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-3 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-[#ffffff] shadow-[2px_2px_0px_#141c2b] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 font-mono text-xs font-bold text-[#d84c23] hover:underline"
            >
              CLEAR ✕
            </button>
          )}
        </div>
      </div>

      {/* ── NOTICEBOARD ASYMMETRIC GRID ─────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-[#545e6d] font-mono text-sm space-y-2">
          <div className="w-8 h-8 border-2 border-[#141c2b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Syncing campus bulletin...</p>
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
            {searchQuery ? `No communities found for "${searchQuery}"` : "No communities yet"}
          </h3>
          <p className="text-xs text-[#545e6d] font-mono">
            Try another search term, or create the first community to start the campus bulletin.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setSearchQuery("")}
              className="secondary-action font-mono text-xs uppercase"
            >
              Reset Search
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Communities