import { useEffect, useState, useMemo } from "react"
import { Link, useSearchParams } from "react-router"
import { Search, PlusCircle, CheckSquare, Square, Layers, CheckCircle2, Compass } from "lucide-react"
import CommunityCard, { type CommunityCardProps } from "../components/CommunityCard"
import { getStoredCommunities } from "../lib/mockStore"
import { fetchCommunitiesFromDb, fetchUserJoinedCommunityNames } from "../lib/supabaseService"
import { getActiveUser, getActiveProfile } from "../lib/tempStore"

type CommunityFilterType = "all" | "joined" | "non-joined"

function Communities() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilter = (searchParams.get("filter") as CommunityFilterType) || "all"
  const [filterType, setFilterType] = useState<CommunityFilterType>(
    initialFilter === "joined" || initialFilter === "non-joined" ? initialFilter : "all"
  )
  const [communities, setCommunities] = useState<(CommunityCardProps & { isJoined?: boolean; isHead?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "")

  // Sync state if URL search param changes
  useEffect(() => {
    const f = searchParams.get("filter") as CommunityFilterType
    if (f === "joined" || f === "non-joined" || f === "all") {
      setFilterType(f)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadCommunities() {
      const user = getActiveUser()
      const profile = getActiveProfile()
      const joinedNamesList = await fetchUserJoinedCommunityNames()
      const joinedSet = new Set(joinedNamesList.map((n) => n.toLowerCase()))

      function checkIsHead(c: any): boolean {
        if (!user && !profile) return false
        if (c.created_by && user && c.created_by === user.id) return true
        if (c.created_by_name && profile && c.created_by_name.toLowerCase() === profile.display_name?.toLowerCase()) return true
        if (c.created_by?.name && profile && c.created_by.name.toLowerCase() === profile.display_name?.toLowerCase()) return true
        return false
      }

      function checkIsJoined(c: any): boolean {
        if (checkIsHead(c)) return true
        const cleanName = (c.name || "").trim().toLowerCase()
        if (joinedSet.has(cleanName)) return true
        if (c.members && Array.isArray(c.members) && profile && c.members.some((m: any) => m.name?.toLowerCase() === profile.display_name?.toLowerCase())) return true
        return false
      }

      // 1. Initial render from local cache
      const localList = getStoredCommunities()
      const mappedLocal = localList.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        members: c.members_count || c.members?.length || 1,
        members_count: c.members_count || c.members?.length || 1,
        whatsapp_link: c.whatsapp_link,
        instagram_link: c.instagram_link,
        image: c.image,
        isHead: checkIsHead(c),
        isJoined: checkIsJoined(c),
      }))
      setCommunities(mappedLocal)

      // 2. Fetch from Supabase cloud database
      try {
        const remote = await fetchCommunitiesFromDb()
        if (remote && Array.isArray(remote) && remote.length > 0) {
          const mappedRemote = remote.map((c) => ({
            id: c.id || c.name,
            name: c.name,
            description: c.description,
            members: c.members_count || 1,
            members_count: c.members_count || 1,
            whatsapp_link: c.whatsapp_link,
            instagram_link: c.instagram_link,
            image: c.image,
            isHead: checkIsHead(c),
            isJoined: checkIsJoined(c),
          }))

          // Merge without duplicates
          const seen = new Set<string>()
          const combined = [...mappedRemote, ...mappedLocal].filter((c) => {
            const k = c.name.trim().toLowerCase()
            if (seen.has(k)) return false
            seen.add(k)
            return true
          })

          setCommunities(combined)
        }
      } catch (err) {
        console.warn("Supabase fetch communities notice:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCommunities()
  }, [])

  const handleFilterChange = (type: CommunityFilterType) => {
    setFilterType(type)
    const newParams = new URLSearchParams(searchParams)
    if (type === "all") {
      newParams.delete("filter")
    } else {
      newParams.set("filter", type)
    }
    setSearchParams(newParams, { replace: true })
  }

  // Calculate counts for badges
  const counts = useMemo(() => {
    const total = communities.length
    const joined = communities.filter((c) => c.isJoined).length
    const nonJoined = total - joined
    return { total, joined, nonJoined }
  }, [communities])

  // Filter based on search query and membership tab
  const filteredCommunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return communities.filter((item) => {
      // 1. Membership filter
      if (filterType === "joined" && !item.isJoined) return false
      if (filterType === "non-joined" && item.isJoined) return false

      // 2. Search query filter
      if (!query) return true
      const name = item.name || ""
      const desc = item.description || ""
      return (
        name.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query)
      )
    })
  }, [communities, searchQuery, filterType])

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

      {/* ── MAIN CONTENT: SIDEBAR + GRID ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Selection Panel */}
        <div className="lg:col-span-3 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-5 shadow-[4px_4px_0px_#141c2b] space-y-4 sticky top-6">
          <div className="border-b border-[#d8cebe] pb-2.5">
            <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase tracking-wider block">
              FILTER HUBS
            </span>
            <h3 className="font-serif text-lg font-bold text-[#141c2b]">
              Community Status
            </h3>
          </div>

          <div className="space-y-2">
            {/* 1. All Communities */}
            <button
              onClick={() => handleFilterChange("all")}
              className={`w-full flex items-center justify-between p-3 rounded-xs border-2 text-left transition-all cursor-pointer ${filterType === "all"
                  ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[2px_2px_0px_#d84c23]"
                  : "bg-[#f5f1ea] text-[#141c2b] border-[#141c2b] hover:bg-white"
                }`}
            >
              <div className="flex items-center gap-2.5">
                {filterType === "all" ? (
                  <CheckSquare className="w-4 h-4 text-[#d84c23]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8892a0]" />
                )}
                <span className="font-mono text-xs font-bold uppercase">All Communities</span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-2xs ${filterType === "all" ? "bg-white/20 text-white" : "bg-[#eae2d5] text-[#141c2b]"
                  }`}
              >
                {counts.total}
              </span>
            </button>

            {/* 2. Joined Communities */}
            <button
              onClick={() => handleFilterChange("joined")}
              className={`w-full flex items-center justify-between p-3 rounded-xs border-2 text-left transition-all cursor-pointer ${filterType === "joined"
                  ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[2px_2px_0px_#d84c23]"
                  : "bg-[#f5f1ea] text-[#141c2b] border-[#141c2b] hover:bg-white"
                }`}
            >
              <div className="flex items-center gap-2.5">
                {filterType === "joined" ? (
                  <CheckSquare className="w-4 h-4 text-[#d84c23]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8892a0]" />
                )}
                <span className="font-mono text-xs font-bold uppercase">Joined Hubs</span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-2xs ${filterType === "joined" ? "bg-white/20 text-white" : "bg-[#eae2d5] text-[#141c2b]"
                  }`}
              >
                {counts.joined}
              </span>
            </button>

            {/* 3. Non-Joined Communities */}
            <button
              onClick={() => handleFilterChange("non-joined")}
              className={`w-full flex items-center justify-between p-3 rounded-xs border-2 text-left transition-all cursor-pointer ${filterType === "non-joined"
                  ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[2px_2px_0px_#d84c23]"
                  : "bg-[#f5f1ea] text-[#141c2b] border-[#141c2b] hover:bg-white"
                }`}
            >
              <div className="flex items-center gap-2.5">
                {filterType === "non-joined" ? (
                  <CheckSquare className="w-4 h-4 text-[#d84c23]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8892a0]" />
                )}
                <span className="font-mono text-xs font-bold uppercase">Explore New</span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-2xs ${filterType === "non-joined" ? "bg-white/20 text-white" : "bg-[#eae2d5] text-[#141c2b]"
                  }`}
              >
                {counts.nonJoined}
              </span>
            </button>
          </div>
        </div>

        {/* Right Side Search & Grid */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search Bar */}
          <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-4 sm:p-5 shadow-[4px_4px_0px_#141c2b] space-y-3">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-[#141c2b] uppercase tracking-wider border-b border-[#d8cebe] pb-2">
              <span className="flex items-center gap-1.5">
                {filterType === "joined" && <CheckCircle2 className="w-3.5 h-3.5 text-[#d84c23]" />}
                {filterType === "non-joined" && <Compass className="w-3.5 h-3.5 text-[#2563eb]" />}
                {filterType === "all" && <Layers className="w-3.5 h-3.5 text-[#141c2b]" />}
                <span>
                  {filterType === "joined"
                    ? "Showing Joined Communities"
                    : filterType === "non-joined"
                      ? "Showing New Communities"
                      : "Showing All Communities"}
                </span>
              </span>
              <span className="text-[#d84c23]">{filteredCommunities.length} ACTIVE HUBS</span>
            </div>

            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-[#545e6d]" />
              <input
                type="text"
                placeholder="Search by community name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-[#ffffff] shadow-[2px_2px_0px_#141c2b] transition-all"
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

          {/* Grid Content */}
          {loading ? (
            <div className="py-20 text-center text-[#545e6d] font-mono text-sm space-y-2 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg">
              <div className="w-8 h-8 border-2 border-[#141c2b] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Syncing campus bulletin...</p>
            </div>
          ) : filteredCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCommunities.map((item, idx) => (
                <div key={item.id ?? idx} className="h-full">
                  <CommunityCard
                    {...item}
                    onToggleJoin={(name, nextJoined) => {
                      setCommunities((prev) =>
                        prev.map((c) =>
                          c.name.toLowerCase() === name.toLowerCase()
                            ? {
                                ...c,
                                isJoined: nextJoined,
                                members_count: nextJoined
                                  ? (c.members_count || 1) + 1
                                  : Math.max(1, (c.members_count || 1) - 1),
                              }
                            : c
                        )
                      )
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg space-y-3">
              <h3 className="font-serif text-2xl font-bold text-[#141c2b]">
                {filterType === "joined"
                  ? "No joined communities yet"
                  : searchQuery
                    ? `No communities found for "${searchQuery}"`
                    : "No communities found in this view"}
              </h3>
              <p className="text-xs text-[#545e6d] font-mono max-w-md mx-auto">
                {filterType === "joined"
                  ? "You haven't joined any communities yet. Check 'All Communities' or 'Explore New' to discover campus hubs."
                  : "Try clearing your search or explore all active student communities."}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                {filterType !== "all" && (
                  <button
                    onClick={() => handleFilterChange("all")}
                    className="primary-action font-mono text-xs uppercase"
                    style={{ padding: "0.55rem 1.1rem" }}
                  >
                    View All Communities
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="secondary-action font-mono text-xs uppercase"
                    style={{ padding: "0.55rem 1.1rem" }}
                  >
                    Reset Search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Communities