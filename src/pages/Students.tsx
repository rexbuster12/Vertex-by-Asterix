import { useState, useMemo, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { getActiveProfile, blockUser, unblockUser, isUserBlocked, getBlockedUsers } from "../lib/tempStore"
import { addNotification } from "../lib/notificationStore"
import { fetchAllProfiles } from "../lib/supabaseService"
import { COURSE_OPTIONS } from "./ProfileCreatePage"
import { COMMUNITY_CLUBS, MAJOR_CLUBS } from "../lib/clubsData"
import { Ban, CheckSquare, Square } from "lucide-react"

export type StudentProfile = {
  id: string | number
  name: string
  username?: string
  branch: string
  batchYear: string
  bio: string
  communities: string[]
  interests: string[]
  avatarPhoto?: string
  major_club?: string
  major_sport?: string
  minor_club?: string
  minor_sport?: string
  community_club?: string
}

const BRANCH_FILTER_OPTIONS = [
  "All Branches",
  ...COURSE_OPTIONS,
]

const START_YEAR_OPTIONS = [
  "All Start Years",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
]

const END_YEAR_OPTIONS = [
  "All End Years",
  "2024",
  "2025",
  "2026",
  "2027",
  "2028",
  "2029",
  "2030",
  "2031",
]

function Students() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [connectionFilter, setConnectionFilter] = useState<"all" | "connected">("all")
  const [selectedBranch, setSelectedBranch] = useState("All Branches")
  const [selectedStartYear, setSelectedStartYear] = useState("All Start Years")
  const [selectedEndYear, setSelectedEndYear] = useState("All End Years")
  const [selectedMajorClub, setSelectedMajorClub] = useState("All Major Clubs & Sports")
  const [selectedCommunityClub, setSelectedCommunityClub] = useState("All Community Clubs")
  const [sportQuery, setSportQuery] = useState("")
  const [connectedIds, setConnectedIds] = useState<Record<string | number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("vertex_connected_ids")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [, setBlockedUsers] = useState<string[]>(() => getBlockedUsers())
  const [remoteProfiles, setRemoteProfiles] = useState<StudentProfile[]>([])

  const active = getActiveProfile()

  useEffect(() => {
    async function loadStudents() {
      try {
        const all = await fetchAllProfiles()
        if (all && all.length > 0) {
          const mapped: StudentProfile[] = all.map((p: any) => ({
            id: p.id || p.username || p.email,
            name: p.display_name || p.username,
            username: p.username,
            branch: p.branch || "BML Munjal University",
            batchYear: p.batch || "2024–2028",
            bio: p.bio || "Student member on Vertex Campus.",
            communities: [],
            interests: [],
            avatarPhoto: p.avatar_url,
            major_club: p.major_club,
            major_sport: p.major_sport,
            minor_club: p.minor_club,
            minor_sport: p.minor_sport,
            community_club: p.community_club,
          }))
          setRemoteProfiles(mapped)
        }
      } catch (err) {
        console.warn("Could not load remote profiles:", err)
      }
    }
    loadStudents()
  }, [])

  const studentList: StudentProfile[] = useMemo(() => {
    const list: StudentProfile[] = [...remoteProfiles]
    if (active && active.display_name) {
      const exists = list.some((s) => s.name.toLowerCase() === active.display_name.toLowerCase())
      if (!exists) {
        list.unshift({
          id: "active-user",
          name: active.display_name,
          username: active.username,
          branch: active.branch,
          batchYear: active.batch,
          bio: active.bio || "Student member on Vertex Campus.",
          communities: [],
          interests: [],
          avatarPhoto: active.avatar_url,
          major_club: active.major_club,
          major_sport: active.major_sport,
          minor_club: active.minor_club,
          minor_sport: active.minor_sport,
          community_club: active.community_club,
        })
      }
    }
    return list
  }, [active, remoteProfiles])

  const handleViewPeerProfile = (student: StudentProfile) => {
    const previewData = {
      display_name: student.name,
      username: student.username,
      branch: student.branch,
      batch: student.batchYear,
      bio: student.bio,
      avatar_url: student.avatarPhoto || "",
      major_club: student.major_club,
      major_sport: student.major_sport,
      minor_club: student.minor_club,
      minor_sport: student.minor_sport,
      community_club: student.community_club,
      instagram_url: student.username ? `https://instagram.com/${student.username}` : "",
      linkedin_url: student.username ? `https://linkedin.com/in/${student.username}` : "",
    }
    localStorage.setItem("vertex_preview_profile", JSON.stringify(previewData))
    navigate(`/profile?preview=${encodeURIComponent(student.username || student.name)}`)
  }

  const toggleConnect = (id: string | number, studentName: string) => {
    if (isUserBlocked(studentName)) return

    const isNowConnected = !connectedIds[id]
    const updated = {
      ...connectedIds,
      [id]: isNowConnected,
    }
    setConnectedIds(updated)
    try {
      localStorage.setItem("vertex_connected_ids", JSON.stringify(updated))
    } catch (e) {
      console.warn("Storage notice:", e)
    }

    if (isNowConnected) {
      const targetStudent = studentList.find((s) => s.id === id)
      addNotification({
        type: "connection_received",
        title: `Connected with ${targetStudent?.name || "Fellow Student"}`,
        message: `You are now connected with ${targetStudent?.name || "fellow student"} on Vertex.`,
        linkUrl: `/students`,
        sourceName: targetStudent?.name,
      })
    }
  }

  const toggleBlockStudent = (studentName: string) => {
    if (!studentName) return
    if (isUserBlocked(studentName)) {
      unblockUser(studentName)
      setBlockedUsers(getBlockedUsers())
    } else {
      blockUser(studentName)
      setBlockedUsers(getBlockedUsers())
      const target = studentList.find((s) => s.name === studentName)
      if (target) {
        const updated = { ...connectedIds, [target.id]: false }
        setConnectedIds(updated)
        localStorage.setItem("vertex_connected_ids", JSON.stringify(updated))
      }
    }
  }

  const totalCount = studentList.length
  const connectedCount = useMemo(() => {
    return studentList.filter((s) => !!connectedIds[s.id]).length
  }, [studentList, connectedIds])

  const filteredStudents = useMemo(() => {
    return studentList.filter((student) => {
      if (connectionFilter === "connected" && !connectedIds[student.id]) {
        return false
      }

      const matchSearch =
        searchQuery.trim() === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.username && student.username.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchBranch =
        selectedBranch === "All Branches" || student.branch === selectedBranch

      const matchStartYear =
        selectedStartYear === "All Start Years" ||
        student.batchYear.startsWith(selectedStartYear) ||
        student.batchYear.includes(selectedStartYear)

      const matchEndYear =
        selectedEndYear === "All End Years" ||
        student.batchYear.endsWith(selectedEndYear) ||
        student.batchYear.includes(selectedEndYear)

      const matchMajorClub =
        selectedMajorClub === "All Major Clubs & Sports" ||
        (selectedMajorClub === "Sports" && (student.major_club === "Sports" || !!student.major_sport)) ||
        student.major_club === selectedMajorClub ||
        student.minor_club === selectedMajorClub

      const matchCommunityClub =
        selectedCommunityClub === "All Community Clubs" ||
        student.community_club === selectedCommunityClub

      const matchSport =
        sportQuery.trim() === "" ||
        (student.major_sport && student.major_sport.toLowerCase().includes(sportQuery.toLowerCase())) ||
        (student.minor_sport && student.minor_sport.toLowerCase().includes(sportQuery.toLowerCase()))

      return matchSearch && matchBranch && matchStartYear && matchEndYear && matchMajorClub && matchCommunityClub && matchSport
    })
  }, [studentList, searchQuery, selectedBranch, selectedStartYear, selectedEndYear, selectedMajorClub, selectedCommunityClub, sportQuery, connectionFilter, connectedIds])

  return (
    <div className="editorial-shell space-y-6">
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight font-serif">
            Student Directory
          </h1>
          <p className="text-sm text-[#545e6d] max-w-xl">
            Meet students that share your interests across departments and cohorts at BMU.
          </p>
        </div>
        <Link to="/profile" className="secondary-action self-start sm:self-auto font-mono text-xs uppercase">
          <span>View My Profile</span>
        </Link>
      </div>

      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-4 sm:p-5 shadow-[4px_4px_0px_#141c2b] space-y-3">
        {/* Row 1: General & Branch/Batch Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              placeholder="Search by student name, username, or headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-[#ffffff] shadow-[2px_2px_0px_#141c2b]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              {BRANCH_FILTER_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedStartYear}
              onChange={(e) => setSelectedStartYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              {START_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedEndYear}
              onChange={(e) => setSelectedEndYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              {END_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Clubs & Sports Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-[#d8cebe]">
          <div className="md:col-span-5">
            <select
              value={selectedMajorClub}
              onChange={(e) => setSelectedMajorClub(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              <option value="All Major Clubs & Sports">All Major Clubs & Sports</option>
              {MAJOR_CLUBS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedCommunityClub}
              onChange={(e) => setSelectedCommunityClub(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              <option value="All Community Clubs">All Community Clubs</option>
              {COMMUNITY_CLUBS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Search by Sport (e.g. Football)..."
              value={sportQuery}
              onChange={(e) => setSportQuery(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] placeholder-[#8892a0] focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
            />
          </div>
        </div>

        {/* Row 3: Connection Status Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#d8cebe] flex-wrap">
          <span className="font-mono text-[11px] font-bold uppercase text-[#141c2b] mr-1">
            PEER STATUS:
          </span>
          <button
            type="button"
            onClick={() => setConnectionFilter("all")}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              connectionFilter === "all"
                ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[1.5px_1.5px_0px_#d84c23]"
                : "bg-[#f5f1ea] text-[#141c2b] border-[#141c2b] hover:bg-white"
            }`}
          >
            {connectionFilter === "all" ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#d84c23]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[#8892a0]" />
            )}
            <span>All Students ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setConnectionFilter("connected")}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              connectionFilter === "connected"
                ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[1.5px_1.5px_0px_#d84c23]"
                : "bg-[#f5f1ea] text-[#141c2b] border-[#141c2b] hover:bg-white"
            }`}
          >
            {connectionFilter === "connected" ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#d84c23]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[#8892a0]" />
            )}
            <span>Connected Only ({connectedCount})</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#545e6d] pt-1">
          <span>SHOWING <b className="text-[#141c2b]">{filteredStudents.length}</b> REGISTERED STUDENTS</span>
          {(selectedBranch !== "All Branches" || selectedStartYear !== "All Start Years" || selectedEndYear !== "All End Years" || selectedMajorClub !== "All Major Clubs & Sports" || selectedCommunityClub !== "All Community Clubs" || sportQuery || searchQuery || connectionFilter !== "all") && (
            <button
              onClick={() => {
                setSelectedBranch("All Branches")
                setSelectedStartYear("All Start Years")
                setSelectedEndYear("All End Years")
                setSelectedMajorClub("All Major Clubs & Sports")
                setSelectedCommunityClub("All Community Clubs")
                setSportQuery("")
                setSearchQuery("")
                setConnectionFilter("all")
              }}
              className="text-[#d84c23] hover:underline uppercase font-bold cursor-pointer"
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </div>

      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const isSelf = active && active.display_name.trim().toLowerCase() === student.name.trim().toLowerCase()
            const isConnected = !!connectedIds[student.id]
            const isBlocked = isUserBlocked(student.name)
            const initials = student.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "ST"

            return (
              <div
                key={student.id}
                className={`bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-5 shadow-[4px_4px_0px_#141c2b] flex flex-col justify-between space-y-3 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all relative ${
                  isBlocked ? "opacity-75 bg-[#f5f1ea]" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {student.avatarPhoto ? (
                    <img
                      src={student.avatarPhoto}
                      alt={student.name}
                      className="w-16 h-16 rounded-xs object-cover border-2 border-[#141c2b] shadow-[2px_2px_0px_#141c2b]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xs bg-[#141c2b] text-white font-serif font-black flex items-center justify-center text-xl border-2 border-[#141c2b] shadow-[2px_2px_0px_#141c2b]">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold uppercase text-[#d84c23] truncate">
                        {student.branch}
                      </span>
                      {student.username && (
                        <span className="font-mono text-[9px] font-bold text-[#141c2b] bg-[#eae2d5] px-1.5 py-0.2 border border-[#141c2b] rounded-2xs">
                          @{student.username}
                        </span>
                      )}
                      {isBlocked && (
                        <span className="font-mono text-[9px] font-black uppercase text-[#d84c23] bg-[#fbe8e6] px-1.5 py-0.2 rounded-2xs border border-[#d84c23]">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#141c2b] truncate">
                      {student.name}
                    </h3>
                    <span className="font-mono text-[11px] text-[#545e6d]">
                      Batch {student.batchYear}
                    </span>
                  </div>
                </div>

                {/* Clubs & Sports Badges */}
                {(student.major_club || student.major_sport || student.minor_club || student.minor_sport || student.community_club) && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {(student.major_club || student.major_sport) && (
                      <span className="font-mono text-[9.5px] font-bold px-2 py-0.5 bg-[#d84c23] text-white rounded-2xs">
                        ★ {student.major_club === "Sports" ? `Sport: ${student.major_sport || "Sports"}` : student.major_club}
                      </span>
                    )}
                    {student.minor_club && (
                      <span className="font-mono text-[9.5px] font-bold px-2 py-0.5 bg-[#141c2b] text-white rounded-2xs">
                        ✧ {student.minor_club}
                      </span>
                    )}
                    {student.minor_sport && (
                      <span className="font-mono text-[9.5px] font-bold px-2 py-0.5 bg-[#2563eb] text-white rounded-2xs">
                        ⚽ {student.minor_sport}
                      </span>
                    )}
                    {student.community_club && (
                      <span className="font-mono text-[9.5px] font-bold px-2 py-0.5 bg-[#eae2d5] text-[#141c2b] border border-[#141c2b] rounded-2xs">
                        🤝 {student.community_club}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-[#545e6d] leading-relaxed line-clamp-2">
                  {student.bio}
                </p>

                <div className="pt-3 border-t border-[#d8cebe] flex items-center justify-between mt-auto gap-2">
                  {isSelf ? (
                    <Link
                      to="/profile"
                      className="font-mono text-xs font-bold text-[#141c2b] hover:text-[#d84c23] underline truncate"
                    >
                      View Your Profile →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleViewPeerProfile(student)}
                      className="font-mono text-xs font-bold text-[#141c2b] hover:text-[#d84c23] underline truncate cursor-pointer"
                    >
                      View Profile →
                    </button>
                  )}

                  {isSelf ? (
                    <span className="font-mono text-[10px] font-bold uppercase text-[#141c2b] bg-[#eae2d5] px-2.5 py-1 border border-[#141c2b] rounded-xs shadow-[1px_1px_0px_#141c2b]">
                      You (Self)
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {isBlocked ? (
                        <button
                          type="button"
                          onClick={() => toggleBlockStudent(student.name)}
                          className="font-mono text-[11px] font-bold uppercase px-2.5 py-1 bg-[#eae2d5] text-[#141c2b] border border-[#141c2b] rounded-xs hover:bg-white transition-all cursor-pointer shadow-[1px_1px_0px_#141c2b]"
                          title="Unblock this student"
                        >
                          Unblock
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleConnect(student.id, student.name)}
                            className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-1.5 border-[#141c2b] transition-all cursor-pointer ${
                              isConnected
                                ? "bg-[#eae2d5] text-[#141c2b] shadow-[1px_1px_0px_#141c2b]"
                                : "bg-[#141c2b] text-[#ffffff] shadow-[2px_2px_0px_#d84c23] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                            }`}
                          >
                            {isConnected ? "Connected ✓" : "+ Connect"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBlockStudent(student.name)}
                            className="p-1.5 text-[#8892a0] hover:text-[#d84c23] hover:bg-[#fbe8e6] rounded-xs transition-colors cursor-pointer border border-transparent hover:border-[#d84c23]"
                            title="Block this user (stops connections)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg space-y-4">
          <p className="font-serif text-2xl font-bold text-[#141c2b]">Student directory is empty</p>
          <p className="text-sm text-[#545e6d] max-w-xl mx-auto">
            There are no student profiles yet. Create your student profile to appear in the directory.
          </p>
          <div className="flex justify-center gap-3 pt-3">
            <Link to="/profile/create" className="primary-action font-mono text-xs uppercase" style={{ padding: "0.6rem 1.1rem" }}>
              + Create Profile
            </Link>
            <Link to="/communities" className="secondary-action font-mono text-xs uppercase" style={{ padding: "0.6rem 1.1rem" }}>
              Explore Communities
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Students
