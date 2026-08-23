import { useState, useMemo, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import {
  getActiveProfile,
  getActiveUser,
  blockUser,
  unblockUser,
  isUserBlocked,
  getBlockedUsers,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  getConnectionStatus,
  getIncomingConnectionRequests,
  areUsersConnected,
  disconnectUsers,
  mergeRemoteConnectionRequests,
  type ConnectionRequest,
} from "../lib/tempStore"
import { addNotification } from "../lib/notificationStore"
import {
  fetchAllProfiles,
  sendConnectionRequestInDb,
  acceptConnectionRequestInDb,
  declineConnectionRequestInDb,
  cancelConnectionRequestInDb,
  syncConnectionRequestsFromDb,
  disconnectUsersInDb,
} from "../lib/supabaseService"
import { COURSE_OPTIONS } from "./ProfileCreatePage"
import { COMMUNITY_CLUBS, MAJOR_CLUBS } from "../lib/clubsData"
import { Ban, CheckSquare, Square, Flag, UserCheck, UserPlus, Clock } from "lucide-react"
import ReportModal from "../components/ReportModal"

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
  instagram_url?: string
  linkedin_url?: string
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
  const [connectionVersion, setConnectionVersion] = useState(0)
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([])
  const [, setBlockedUsers] = useState<string[]>(() => getBlockedUsers())
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null)
  const [remoteProfiles, setRemoteProfiles] = useState<StudentProfile[]>([])

  const active = getActiveProfile()
  const user = getActiveUser()
  const activeName = active?.display_name || user?.name || ""
  const activeUsername = active?.username || user?.username || ""

  useEffect(() => {
    async function syncRemote() {
      if (activeName || activeUsername) {
        try {
          const remoteReqs = await syncConnectionRequestsFromDb(activeName, activeUsername)
          if (remoteReqs) {
            mergeRemoteConnectionRequests(remoteReqs, activeName, activeUsername)
          }
        } catch { }
        setIncomingRequests(getIncomingConnectionRequests(activeName, activeUsername))
      }
    }
    syncRemote()
    const interval = setInterval(syncRemote, 3000)
    return () => clearInterval(interval)
  }, [activeName, activeUsername, connectionVersion])

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
            instagram_url: p.instagram_url || "",
            linkedin_url: p.linkedin_url || "",
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
          instagram_url: active.instagram_url || "",
          linkedin_url: active.linkedin_url || "",
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
      instagram_url: student.instagram_url || "",
      linkedin_url: student.linkedin_url || "",
    }
    localStorage.setItem("vertex_preview_profile", JSON.stringify(previewData))
    navigate(`/profile?preview=${encodeURIComponent(student.username || student.name)}`)
  }

  const handleSendConnectRequest = (student: StudentProfile) => {
    if (!active?.display_name || isUserBlocked(student.name)) return
    sendConnectionRequest(active.display_name, student.name, {
      branch: active.branch,
      batch: active.batch,
      avatar: active.avatar_url,
    })
    sendConnectionRequestInDb(active.display_name, student.name, {
      branch: active.branch,
      batch: active.batch,
      avatar: active.avatar_url,
    })
    setConnectionVersion((v) => v + 1)
    addNotification({
      type: "connection_received",
      title: `Connection Request Sent`,
      message: `Sent a connection request to ${student.name}.`,
      linkUrl: `/students`,
      sourceName: student.name,
    })
  }

  const handleCancelConnectRequest = (studentName: string) => {
    if (!active?.display_name) return
    cancelConnectionRequest(active.display_name, studentName)
    cancelConnectionRequestInDb(active.display_name, studentName)
    setConnectionVersion((v) => v + 1)
  }

  const handleAcceptRequest = (requestId: string, fromName: string) => {
    acceptConnectionRequest(requestId)
    if (active?.display_name) {
      acceptConnectionRequestInDb(requestId, fromName, active.display_name)
    }
    setConnectionVersion((v) => v + 1)
    addNotification({
      type: "connection_received",
      title: `Connected with ${fromName}`,
      message: `You accepted ${fromName}'s connection request. You are now connected on Vertex!`,
      linkUrl: `/students`,
      sourceName: fromName,
    })
  }

  const handleDeclineRequest = (requestId: string) => {
    declineConnectionRequest(requestId)
    declineConnectionRequestInDb(requestId)
    setConnectionVersion((v) => v + 1)
  }

  const handleDisconnect = (studentName: string) => {
    const myName = active?.display_name || user?.name || ""
    if (!myName) return
    disconnectUsers(myName, studentName)
    disconnectUsersInDb(myName, studentName)
    setConnectionVersion((v) => v + 1)
  }

  const toggleBlockStudent = (studentName: string) => {
    if (!studentName) return
    if (isUserBlocked(studentName)) {
      unblockUser(studentName)
      setBlockedUsers(getBlockedUsers())
    } else {
      blockUser(studentName)
      setBlockedUsers(getBlockedUsers())
      if (active?.display_name) {
        disconnectUsers(active.display_name, studentName)
      }
    }
    setConnectionVersion((v) => v + 1)
  }

  const totalCount = studentList.length
  const connectedCount = useMemo(() => {
    if (!active?.display_name) return 0
    return studentList.filter((s) => areUsersConnected(active.display_name, s.name)).length
  }, [studentList, active?.display_name, connectionVersion])

  const filteredStudents = useMemo(() => {
    return studentList.filter((student) => {
      if (connectionFilter === "connected" && active?.display_name && !areUsersConnected(active.display_name, student.name)) {
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
  }, [studentList, searchQuery, selectedBranch, selectedStartYear, selectedEndYear, selectedMajorClub, selectedCommunityClub, sportQuery, connectionFilter, connectionVersion, active?.display_name])

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
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${connectionFilter === "all"
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
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${connectionFilter === "connected"
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

      {/* ── INCOMING CONNECTION REQUESTS BANNER ── */}
      {incomingRequests.length > 0 && (
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-5 shadow-[5px_5px_0px_#d84c23] space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#d8cebe] pb-2">
            <span className="font-mono text-xs font-bold uppercase text-[#d84c23] flex items-center gap-1.5 tracking-wider">
              <UserCheck className="w-4 h-4 text-[#d84c23]" />
              Incoming Connect Requests ({incomingRequests.length})
            </span>
            <span className="font-mono text-[10px] text-[#545e6d]">
              Review students who want to connect with your profile
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {req.fromAvatar ? (
                    <img
                      src={req.fromAvatar}
                      alt={req.fromName}
                      className="w-10 h-10 rounded-xs object-cover border-1.5 border-[#141c2b] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xs bg-[#141c2b] text-white font-serif font-black flex items-center justify-center text-xs flex-shrink-0 border-1.5 border-[#141c2b]">
                      {req.fromName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-sans font-bold text-xs text-[#141c2b] truncate">
                      {req.fromName}
                    </h4>
                    <p className="font-mono text-[10px] text-[#545e6d] truncate">
                      {req.fromBranch || "BML Munjal University"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(req.id, req.fromName)}
                    className="font-mono text-[10.5px] font-bold uppercase px-2.5 py-1 bg-[#141c2b] text-white rounded-2xs border border-[#141c2b] hover:bg-[#22c55e] hover:text-[#141c2b] transition-all cursor-pointer shadow-[1px_1px_0px_#141c2b]"
                    title="Accept connection"
                  >
                    Accept ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineRequest(req.id)}
                    className="font-mono text-[10.5px] font-bold uppercase px-2 py-1 bg-[#fbe8e6] text-[#d84c23] rounded-2xs border border-[#d84c23] hover:bg-[#d84c23] hover:text-white transition-all cursor-pointer"
                    title="Decline request"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const isSelf = active && active.display_name.trim().toLowerCase() === student.name.trim().toLowerCase()
            const connInfo = getConnectionStatus(active?.display_name || "", student.name)
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
                className={`bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-5 shadow-[4px_4px_0px_#141c2b] flex flex-col justify-between space-y-3 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all relative ${isBlocked ? "opacity-75 bg-[#f5f1ea]" : ""
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
                          {connInfo.status === "connected" ? (
                            <button
                              type="button"
                              onClick={() => handleDisconnect(student.name)}
                              className="font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-1.5 border-[#141c2b] bg-[#22c55e] text-white shadow-[1px_1px_0px_#141c2b] hover:bg-[#d84c23] transition-all cursor-pointer flex items-center gap-1"
                              title="Connected! Click to disconnect"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Connected ✓</span>
                            </button>
                          ) : connInfo.status === "request_received" ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAcceptRequest(connInfo.requestId!, student.name)}
                                className="font-mono text-[11px] font-bold uppercase px-2.5 py-1 rounded-xs border-1.5 border-[#141c2b] bg-[#141c2b] text-white shadow-[1px_1px_0px_#22c55e] hover:bg-[#22c55e] hover:text-[#141c2b] transition-all cursor-pointer"
                              >
                                Accept ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeclineRequest(connInfo.requestId!)}
                                className="font-mono text-[11px] font-bold uppercase px-2 py-1 rounded-xs border-1.5 border-[#d84c23] bg-[#fbe8e6] text-[#d84c23] hover:bg-[#d84c23] hover:text-white transition-all cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : connInfo.status === "request_sent" ? (
                            <button
                              type="button"
                              onClick={() => handleCancelConnectRequest(student.name)}
                              className="group font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-1.5 border-[#141c2b] bg-[#eae2d5] text-[#545e6d] hover:bg-[#fbe8e6] hover:text-[#d84c23] hover:border-[#d84c23] shadow-[1px_1px_0px_#141c2b] transition-all cursor-pointer flex items-center gap-1"
                              title="Click to cancel / un-request connection"
                            >
                              <Clock className="w-3 h-3 group-hover:hidden" />
                              <span className="group-hover:hidden">Requested ⏳</span>
                              <span className="hidden group-hover:inline font-black">Cancel ✕</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendConnectRequest(student)}
                              className="font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-1.5 border-[#141c2b] bg-[#141c2b] text-[#ffffff] shadow-[2px_2px_0px_#d84c23] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>+ Connect</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleBlockStudent(student.name)}
                            className="p-1.5 text-[#8892a0] hover:text-[#d84c23] hover:bg-[#fbe8e6] rounded-xs transition-colors cursor-pointer border border-transparent hover:border-[#d84c23]"
                            title="Block this user (stops connections)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportTarget({ id: String(student.id), name: student.name })}
                            className="p-1.5 text-[#8892a0] hover:text-[#d84c23] hover:bg-[#fbe8e6] rounded-xs transition-colors cursor-pointer border border-transparent hover:border-[#d84c23]"
                            title="Report student profile to campus moderators"
                          >
                            <Flag className="w-3.5 h-3.5" />
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
          <p className="font-serif text-2xl font-bold text-[#141c2b]">No Student Found</p>
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
      {/* Report Student Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType="profile"
          targetId={reportTarget.id}
          targetName={reportTarget.name}
        />
      )}
    </div>
  )
}

export default Students
