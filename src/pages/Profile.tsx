import { useState, useEffect, useMemo } from "react"
import { Link, useSearchParams, useNavigate } from "react-router"
import { LogOut, Users, ExternalLink, QrCode, Copy, Check, UserPlus, Share2, Flag, UserCheck, Clock } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import EditProfileModal, { type ProfileData } from "../components/EditProfileModal"
import ReportModal from "../components/ReportModal"
import {
  getActiveProfile,
  setActiveProfile,
  getActiveUser,
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  disconnectUsers,
  getConnectedStudentNames,
} from "../lib/tempStore"
import { saveStudentProfile, signOutStudent, fetchCommunitiesFromDb } from "../lib/supabaseService"
import { getStoredCommunities } from "../lib/mockStore"
import { addNotification } from "../lib/notificationStore"
import { supabase } from "../lib/supabase"

function Profile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const previewParam = searchParams.get("preview")
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [connectionVersion, setConnectionVersion] = useState(0)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const active = getActiveProfile()

  useEffect(() => {
    async function loadProfile() {
      try {
        if (previewParam) {
          const previewRaw = localStorage.getItem("vertex_preview_profile")
          if (previewRaw) {
            const parsed = JSON.parse(previewRaw) as ProfileData
            if (
              parsed.display_name?.toLowerCase() === previewParam.toLowerCase() ||
              parsed.username?.toLowerCase() === previewParam.toLowerCase()
            ) {
              setProfile(parsed)
              setIsPreviewing(true)
              return
            }
          }

          // Fetch peer profile from Supabase
          const clean = decodeURIComponent(previewParam).trim()
          const { data: remote } = await supabase
            .from("profiles")
            .select("*")
            .or(`username.ilike.${clean},email.ilike.${clean},display_name.ilike.${clean}`)
            .maybeSingle()

          if (remote) {
            setProfile(remote)
            setIsPreviewing(true)
            return
          }
        }

        // Read active profile
        if (active) {
          setProfile(active)
          setIsPreviewing(false)
        } else {
          setProfile(null)
          setIsPreviewing(false)
        }
      } catch {
        setProfile(null)
      }
    }

    loadProfile()
  }, [previewParam])

  useEffect(() => {
    async function loadJoinedCommunities() {
      if (!profile) return
      try {
        const user = getActiveUser()
        const allLocal = getStoredCommunities()

        // Filter local communities created by this student or where member
        const myLocal = allLocal.filter(
          (c) =>
            c.created_by?.name?.toLowerCase() === profile.display_name?.toLowerCase() ||
            c.members?.some((m) => m.name?.toLowerCase() === profile.display_name?.toLowerCase())
        )

        // Filter remote communities
        const remote = await fetchCommunitiesFromDb()
        const myRemote = (remote || []).filter(
          (c: any) =>
            c.created_by === user?.id ||
            c.name?.toLowerCase() === "chess community" ||
            c.created_by_name?.toLowerCase() === profile.display_name?.toLowerCase()
        )

        const seen = new Set<string>()
        const combined = [...myRemote, ...myLocal].filter((c) => {
          const k = c.name.trim().toLowerCase()
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })

        setJoinedCommunities(combined)
      } catch (err) {
        console.warn("Could not load joined communities:", err)
      }
    }

    loadJoinedCommunities()
  }, [profile])

  async function handleLogout() {
    await signOutStudent()
    navigate("/login", { replace: true })
  }

  async function handleSave(data: ProfileData) {
    setProfile(data)
    setActiveProfile(data)
    try {
      await saveStudentProfile(data)
    } catch (err) {
      console.warn("Supabase profile update notice:", err)
    }
    setIsEditOpen(false)
  }

  const profileIdentifier = profile?.username || profile?.display_name || "student"
  const liveProfileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile?preview=${encodeURIComponent(profileIdentifier)}`
    : `https://vertex-by-asterix.vercel.app/profile?preview=${encodeURIComponent(profileIdentifier)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveProfileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendConnectRequest = () => {
    if (!profile || !active?.display_name) return
    sendConnectionRequest(active.display_name, profile.display_name, {
      branch: active.branch,
      batch: active.batch,
      avatar: active.avatar_url,
    })
    setConnectionVersion((v) => v + 1)
    addNotification({
      type: "connection_received",
      title: `Connection Request Sent`,
      message: `Sent a connection request to ${profile.display_name}.`,
      linkUrl: `/students`,
      sourceName: profile.display_name,
    })
  }

  const handleAcceptRequest = (requestId: string) => {
    if (!profile) return
    acceptConnectionRequest(requestId)
    setConnectionVersion((v) => v + 1)
    addNotification({
      type: "connection_received",
      title: `Connected with ${profile.display_name}`,
      message: `You accepted ${profile.display_name}'s connection request!`,
      linkUrl: `/students`,
      sourceName: profile.display_name,
    })
  }

  const handleDeclineRequest = (requestId: string) => {
    declineConnectionRequest(requestId)
    setConnectionVersion((v) => v + 1)
  }

  const handleCancelRequest = () => {
    if (!profile || !active?.display_name) return
    cancelConnectionRequest(active.display_name, profile.display_name)
    setConnectionVersion((v) => v + 1)
  }

  const handleDisconnect = () => {
    if (!profile || !active?.display_name) return
    disconnectUsers(active.display_name, profile.display_name)
    setConnectionVersion((v) => v + 1)
  }

  const connInfo = useMemo(() => {
    if (!profile || !active?.display_name) return { status: "none" as const }
    return getConnectionStatus(active.display_name, profile.display_name)
  }, [profile, active?.display_name, connectionVersion])

  const initials =
    (profile?.display_name || "")
      .split(" ")
      .slice(0, 2)
      .map((w) => (w ? w[0] : ""))
      .join("")
      .toUpperCase() || "ST"

  if (!profile) {
    return (
      <div className="editorial-shell space-y-6">
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-8 sm:p-10 shadow-[6px_6px_0px_#141c2b] space-y-4 text-center">
          <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
            STATUS // NO ACTIVE PROFILE
          </span>
          <h2 className="font-serif text-3xl font-black text-[#141c2b]">
            No student profile found
          </h2>
          <p className="text-sm text-[#545e6d] max-w-xl mx-auto">
            Create your student profile to browse and join campus communities.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Link to="/profile/create" className="primary-action" style={{ padding: "0.65rem 1.25rem" }}>
              + Create Profile
            </Link>
            <Link to="/communities" className="secondary-action" style={{ padding: "0.65rem 1.25rem" }}>
              Explore Communities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="editorial-shell space-y-6">
        {/* ── STUDENT PROFILE HEADER ─────────── */}
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[6px_6px_0px_#141c2b] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#141c2b]">
            {/* Avatar Photo or Initials */}
            <div className="flex items-center gap-5">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xs object-cover border-2 border-[#141c2b] shadow-[3px_3px_0px_#141c2b]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xs bg-[#141c2b] text-[#ffffff] font-serif font-black flex items-center justify-center text-3xl sm:text-4xl border-2 border-[#141c2b] shadow-[3px_3px_0px_#141c2b]">
                  {initials}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold uppercase text-[#d84c23]">
                    {profile.branch || "BML Munjal University"}
                  </span>
                  {profile.username && (
                    <span className="font-mono text-[11px] font-bold text-[#141c2b] bg-[#eae2d5] px-2 py-0.5 border border-[#141c2b] rounded-2xs">
                      @{profile.username}
                    </span>
                  )}
                  {isPreviewing && (
                    <span className="font-mono text-[10px] font-bold uppercase text-[#141c2b] bg-[#e0deda] px-2 py-0.5 border border-[#141c2b] rounded-2xs">
                      Peer View
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-2xl sm:text-4xl font-black text-[#141c2b]">
                  {profile.display_name}
                </h1>
                {profile.batch && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#eae2d5] text-[#141c2b] border border-[#141c2b] rounded-xs">
                    {profile.batch}
                  </span>
                )}
              </div>

              {/* Clubs & Sports Affiliations */}
              {(profile.major_club || profile.major_sport || profile.minor_club || profile.minor_sport || profile.community_club) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {(profile.major_club || profile.major_sport) && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#d84c23] text-white rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      ★ Major: {profile.major_club === "Sports" ? `Sport — ${profile.major_sport || "Sports"}` : profile.major_club}
                    </span>
                  )}
                  {profile.minor_club && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#141c2b] text-white rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      ✧ Minor Club: {profile.minor_club}
                    </span>
                  )}
                  {profile.minor_sport && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#2563eb] text-white rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      ⚽ Minor Sport: {profile.minor_sport}
                    </span>
                  )}
                  {profile.community_club && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#eae2d5] text-[#141c2b] border-1.5 border-[#141c2b] rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      🤝 Community Club: {profile.community_club}
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm text-[#545e6d] max-w-2xl leading-relaxed">
                {profile.bio || "Student member on Vertex Campus."}
              </p>

              {/* Social Links */}
              {(profile.instagram_url || profile.linkedin_url) && (
                <div className="flex items-center gap-2 pt-1">
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill"
                    >
                      INSTAGRAM ↗
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill"
                    >
                      LINKEDIN ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Actions: Edit Profile, Log Out, or Connect */}
            {!isPreviewing ? (
              <div className="flex flex-col gap-2.5 self-start sm:self-center">
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="primary-action text-xs font-mono cursor-pointer"
                  style={{ padding: "0.65rem 1.25rem" }}
                >
                  ✏ Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.05em] text-[#d84c23] bg-[#fbe8e6] hover:bg-[#d84c23] hover:text-white border-2 border-[#141c2b] rounded-sm shadow-[2px_2px_0px_#141c2b] transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 self-start sm:self-center">
                {connInfo.status === "connected" ? (
                  <button
                    onClick={handleDisconnect}
                    className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#141c2b] bg-[#22c55e] text-white border-[#141c2b] hover:bg-[#d84c23]"
                    title="Connected! Click to disconnect"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>✓ Connected</span>
                  </button>
                ) : connInfo.status === "request_received" ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleAcceptRequest(connInfo.requestId!)}
                      className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-2 rounded-sm border-2 border-[#141c2b] bg-[#141c2b] text-white hover:bg-[#22c55e] hover:text-[#141c2b] shadow-[2px_2px_0px_#141c2b] cursor-pointer"
                    >
                      Accept Request ✓
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(connInfo.requestId!)}
                      className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border-2 border-[#d84c23] bg-[#fbe8e6] text-[#d84c23] hover:bg-[#d84c23] hover:text-white cursor-pointer"
                    >
                      Decline ✕
                    </button>
                  </div>
                ) : connInfo.status === "request_sent" ? (
                  <button
                    onClick={handleCancelRequest}
                    className="group text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm border-2 border-[#141c2b] bg-[#eae2d5] text-[#545e6d] hover:bg-[#fbe8e6] hover:text-[#d84c23] hover:border-[#d84c23] shadow-[2px_2px_0px_#141c2b] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Click to cancel connection request"
                  >
                    <Clock className="w-3.5 h-3.5 group-hover:hidden" />
                    <span className="group-hover:hidden">Requested ⏳</span>
                    <span className="hidden group-hover:inline font-black">Cancel Request ✕</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSendConnectRequest}
                    className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm border-2 border-[#141c2b] bg-[#d84c23] hover:bg-[#b83d1b] text-white shadow-[2px_2px_0px_#141c2b] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Connect +</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#545e6d] bg-[#faf7f2] hover:bg-[#fbe8e6] hover:text-[#d84c23] border border-[#141c2b] rounded-sm transition-all cursor-pointer"
                  title="Report this student profile to campus moderators"
                >
                  <Flag className="w-3.5 h-3.5 text-[#d84c23]" />
                  <span>Report Profile</span>
                </button>
                <Link
                  to="/students"
                  className="secondary-action text-xs font-mono text-center"
                  style={{ padding: "0.55rem 1rem" }}
                >
                  ← Directory
                </Link>
              </div>
            )}
          </div>

          {/* Clean Real Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-[#141c2b] max-w-md">
            <div>
              <p className="font-serif text-2xl font-black text-[#141c2b]">{joinedCommunities.length}</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Joined Communities</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-black text-[#d84c23]">
                {isPreviewing
                  ? (connInfo.status === "connected" ? 1 : 0)
                  : getConnectedStudentNames(active?.display_name || "").length}
              </p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Campus Connections</p>
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-[#141c2b] pt-1">Active</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Student Status</p>
            </div>
          </div>
        </div>

        {/* ── DIGITAL VERTEX CONNECT QR PASS ──────────── */}
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-7 shadow-[5px_5px_0px_#141c2b] space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              {/* QR Code Container */}
              <div className="p-3 bg-white border-2 border-[#141c2b] rounded-sm shadow-[3px_3px_0px_#141c2b] flex-shrink-0">
                <QRCodeSVG
                  value={liveProfileUrl}
                  size={120}
                  level="H"
                  includeMargin={false}
                  fgColor="#141c2b"
                  bgColor="#ffffff"
                />
              </div>

              {/* QR Pass Details */}
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 font-mono text-xs font-bold text-[#d84c23] uppercase">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Digital Vertex QR Pass</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#141c2b]">
                  {isPreviewing
                    ? `Scan to Connect with ${profile.display_name}`
                    : "Scan to Connect With Me"}
                </h3>
                <p className="text-xs text-[#545e6d] leading-relaxed">
                  Open your smartphone camera and point at this QR code to instantly open this profile and connect on Vertex.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full sm:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="primary-action text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ padding: "0.6rem 1.1rem" }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Link Copied! ✓" : "Copy Profile Link"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${profile.display_name} on Vertex`,
                      text: `Connect with ${profile.display_name} on Vertex BMU`,
                      url: liveProfileUrl,
                    }).catch(() => {})
                  } else {
                    handleCopyLink()
                  }
                }}
                className="secondary-action text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ padding: "0.6rem 1.1rem" }}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Pass</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── JOINED COMMUNITIES SECTION ──────────── */}
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141c2b] pb-3">
            <div>
              <h2 className="font-serif text-2xl font-extrabold text-[#141c2b]">
                Joined Communities
              </h2>
              <p className="text-xs text-[#545e6d] font-mono mt-0.5">
                Campus hubs, cohorts, and student organizations you are affiliated with.
              </p>
            </div>
            <Link
              to="/communities"
              className="font-mono text-xs font-bold text-[#d84c23] hover:text-[#141c2b] uppercase tracking-wider flex items-center gap-1"
            >
              <span>Explore All Communities →</span>
            </Link>
          </div>

          {joinedCommunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {joinedCommunities.map((comm) => (
                <div
                  key={comm.id || comm.name}
                  onClick={() => navigate(`/communities/${encodeURIComponent(comm.name)}`)}
                  className="bg-[#f5f1ea] border-2 border-[#141c2b] rounded-lg overflow-hidden shadow-[3px_3px_0px_#141c2b] hover:shadow-[5px_5px_0px_#d84c23] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex flex-col"
                >
                  {/* Banner */}
                  <div className="h-28 w-full bg-[#141c2b] relative overflow-hidden border-b-2 border-[#141c2b]">
                    <img
                      src={comm.image || "/default-banner.jpg"}
                      alt={comm.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 font-mono text-[9.5px] font-black uppercase bg-[#faf7f2] text-[#141c2b] border border-[#141c2b] px-2 py-0.5 rounded-2xs shadow-[1px_1px_0px_#141c2b]">
                      Member
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#141c2b] truncate">
                        {comm.name}
                      </h3>
                      <p className="text-xs text-[#545e6d] line-clamp-2 mt-1 leading-relaxed">
                        {comm.description || "A campus student community on Vertex."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#d8cebe] flex items-center justify-between font-mono text-xs">
                      <span className="text-[#545e6d] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{comm.members_count || 1} members</span>
                      </span>
                      <span className="font-bold text-[#d84c23] flex items-center gap-0.5 group-hover:underline">
                        Open <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg space-y-3">
              <div className="w-12 h-12 bg-[#eae2d5] border-2 border-[#141c2b] rounded-full flex items-center justify-center mx-auto text-[#141c2b]">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-serif font-bold text-lg text-[#141c2b]">No communities joined yet</p>
                <p className="text-xs text-[#545e6d] max-w-sm mx-auto">
                  Browse campus student clubs, societies, and cohorts to start connecting.
                </p>
              </div>
              <div className="pt-1">
                <Link to="/communities" className="primary-action text-xs font-mono" style={{ padding: "0.6rem 1.25rem" }}>
                  Explore Communities →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ────────────────────────────────────── */}
      {isEditOpen && (
        <EditProfileModal
          initialData={profile}
          onSave={handleSave}
          onClose={() => setIsEditOpen(false)}
        />
      )}
      {/* ── REPORT PROFILE MODAL ─────────────────────────────────── */}
      {profile && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="profile"
          targetId={profile.username || profile.display_name}
          targetName={profile.display_name}
        />
      )}
    </>
  )
}

export default Profile