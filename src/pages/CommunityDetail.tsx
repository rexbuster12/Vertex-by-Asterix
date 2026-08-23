import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router"
import {
  Users,
  Calendar,
  UserCheck,
  ChevronDown,
  Megaphone,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Crown,
  Trash2,
  Pencil,
  PlusCircle,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  UserMinus,
  Flag,
  LogOut,
} from "lucide-react"
import { WhatsAppIcon, InstagramIcon } from "../components/Icons"
import EditCommunityModal from "../components/EditCommunityModal"
import CreateAnnouncementModal from "../components/CreateAnnouncementModal"
import ReportModal from "../components/ReportModal"
import {
  findCommunityByName,
  deleteMockCommunity,
  updateMockCommunity,
  addCommunityAnnouncement,
  deleteCommunityAnnouncement,
  setMemberRole,
  removeCommunityMember,
  addCommunityMember,
  transferCommunityFounder,
  toggleAnnouncementReaction,
  type MockCommunity,
  type CommunityMember,
} from "../lib/mockStore"
import { getActiveProfile, getActiveUser } from "../lib/tempStore"
import { addNotification } from "../lib/notificationStore"
import {
  fetchCommunityDetailFromDb,
  deleteCommunityInDb,
  deleteAnnouncementInDb,
  joinCommunityInDb,
  leaveCommunityInDb,
  fetchUserJoinedCommunityNames,
} from "../lib/supabaseService"
import { supabase } from "../lib/supabase"

const FALLBACK_COVER = "/default-banner.jpg"

function CommunityDetail() {
  const { communityName } = useParams()
  const navigate = useNavigate()
  const [community, setCommunity] = useState<MockCommunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [isMemberListOpen, setIsMemberListOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Kick Member Modal State
  const [memberToKick, setMemberToKick] = useState<CommunityMember | null>(null)
  const [kickReason, setKickReason] = useState("Violation of community guidelines or inactivity.")
  const [isKickModalOpen, setIsKickModalOpen] = useState(false)

  // Head Departure / Handover Modal State
  const [isFounderDepartureOpen, setIsFounderDepartureOpen] = useState(false)
  const [selectedSuccessorId, setSelectedSuccessorId] = useState("")

  const activeProfile = getActiveProfile()
  const activeUser = getActiveUser()

  useEffect(() => {
    async function loadCommunity() {
      if (!communityName) {
        setLoading(false)
        return
      }

      const decoded = decodeURIComponent(communityName).trim()
      const joinedNamesList = await fetchUserJoinedCommunityNames()
      const joinedSet = new Set(joinedNamesList.map((n) => n.toLowerCase()))

      // 1. Check local cache first for instant render
      const localFound = findCommunityByName(decoded)
      if (localFound) {
        setCommunity(localFound)
        setMemberCount(localFound.members_count || localFound.members?.length || 1)
        const isUserHead = Boolean(
          (activeProfile?.display_name && localFound.created_by?.name && activeProfile.display_name.trim().toLowerCase() === localFound.created_by.name.trim().toLowerCase()) ||
          (activeUser?.id && localFound.created_by && (localFound.created_by as any) === activeUser.id)
        )
        const isUserMember = isUserHead || joinedSet.has(localFound.name.toLowerCase()) || (localFound.members && localFound.members.some((m: any) => m.id === activeUser?.id || (activeProfile?.display_name && m.name.toLowerCase() === activeProfile.display_name.toLowerCase())))
        if (isUserMember) setJoined(true)
      }

      // 2. Fetch live data from Supabase
      try {
        const remoteCommunity = await fetchCommunityDetailFromDb(decoded)
        if (remoteCommunity) {
          setCommunity(remoteCommunity as MockCommunity)
          setMemberCount(remoteCommunity.members_count || remoteCommunity.members?.length || 1)
          const isUserHead = Boolean(
            (activeProfile?.display_name && remoteCommunity.created_by?.name && activeProfile.display_name.trim().toLowerCase() === remoteCommunity.created_by.name.trim().toLowerCase()) ||
            (activeUser?.id && remoteCommunity.created_by && (remoteCommunity.created_by as any) === activeUser.id)
          )
          const isUserMember = isUserHead || joinedSet.has(remoteCommunity.name.toLowerCase()) || (remoteCommunity.members && remoteCommunity.members.some((m: any) => m.id === activeUser?.id || (activeProfile?.display_name && m.name.toLowerCase() === activeProfile.display_name.toLowerCase())))
          if (isUserMember) setJoined(true)
        } else if (!localFound) {
          setCommunity(null)
        }
      } catch (err) {
        console.warn("Supabase fetch community detail notice:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCommunity()
  }, [communityName])

  // Check roles (Head of Community)
  const isHead = Boolean(
    community &&
    ((activeProfile?.display_name &&
      community.created_by?.name &&
      activeProfile.display_name.trim().toLowerCase() === community.created_by.name.trim().toLowerCase()) ||
     (activeUser?.name &&
      community.created_by?.name &&
      activeUser.name.trim().toLowerCase() === community.created_by.name.trim().toLowerCase()) ||
     (activeUser?.id && (community.created_by as any) === activeUser.id) ||
     (community.members && Array.isArray(community.members) && activeProfile && community.members.some((m: any) =>
       (m.name?.toLowerCase() === activeProfile.display_name?.toLowerCase() || (activeUser?.id && m.id === activeUser.id)) &&
       (m.is_founder || m.is_head || m.role === "founder" || m.role === "head")
     )))
  )
  const isFounder = isHead // Alias for Head of Community

  const handleToggleJoin = async () => {
    if (!community || isJoining) return

    // If Head clicks leave, open departure handover modal
    if (isHead) {
      setIsFounderDepartureOpen(true)
      return
    }

    setIsJoining(true)

    try {
      if (joined) {
        setJoined(false)
        setMemberCount((prev) => Math.max(1, prev - 1))
        setCommunity((prev) => {
          if (!prev) return prev
          const withoutSelf = (prev.members || []).filter(
            (m) => m.name.trim().toLowerCase() !== activeProfile?.display_name?.trim().toLowerCase()
          )
          return {
            ...prev,
            members: withoutSelf,
            members_count: Math.max(1, withoutSelf.length),
          }
        })
        if (activeProfile?.display_name) {
          removeCommunityMember(community.name, activeProfile.display_name)
        }
        await leaveCommunityInDb(community.id || community.name)
      } else {
        setJoined(true)
        setMemberCount((prev) => prev + 1)
        const newMember: CommunityMember = {
          id: activeUser?.id || activeProfile?.display_name || `mem-${Date.now()}`,
          name: activeProfile?.display_name || activeUser?.name || "Student Member",
          branch: activeProfile?.branch || "BML Munjal University",
          batch: activeProfile?.batch || "Student",
          avatar_url: activeProfile?.avatar_url,
          instagram_url: activeProfile?.instagram_url,
          linkedin_url: activeProfile?.linkedin_url,
          is_founder: false,
          is_head: false,
          role: "member",
        }
        setCommunity((prev) => {
          if (!prev) return prev
          const existing = prev.members || []
          const withoutSelf = existing.filter(
            (m) => m.name.trim().toLowerCase() !== newMember.name.trim().toLowerCase()
          )
          const updated = [...withoutSelf, newMember]
          return {
            ...prev,
            members: updated,
            members_count: Math.max(prev.members_count || 1, updated.length),
          }
        })
        if (activeProfile?.display_name) {
          addCommunityMember(community.name, {
            id: activeProfile.display_name,
            name: activeProfile.display_name,
            branch: activeProfile.branch,
            batch: activeProfile.batch,
            avatar_url: activeProfile.avatar_url,
            instagram_url: activeProfile.instagram_url,
            linkedin_url: activeProfile.linkedin_url,
          })
        }
        addNotification({
          type: "member_joined",
          title: `Joined ${community.name}`,
          message: `You joined ${community.name}. You'll receive updates and bulletins from this community.`,
          linkUrl: `/communities/${encodeURIComponent(community.name)}`,
          communityName: community.name,
        })
        await joinCommunityInDb(community.id || community.name)
      }
    } catch (err) {
      console.warn("Toggle join notice:", err)
    } finally {
      setTimeout(() => {
        setIsJoining(false)
      }, 700)
    }
  }

  const handleOpenKickModal = (member: CommunityMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setMemberToKick(member)
    setKickReason("Inappropriate conduct or violation of community standards.")
    setIsKickModalOpen(true)
  }

  const handleConfirmKick = () => {
    if (!community || !memberToKick) return
    const updated = removeCommunityMember(community.name, memberToKick.id)
    if (updated) setCommunity(updated)
    setMemberCount((prev) => Math.max(1, prev - 1))

    // Send kick notification
    addNotification({
      type: "connection_received",
      title: `Removed from ${community.name}`,
      message: `You were removed from ${community.name}. Reason: ${kickReason}`,
      linkUrl: `/communities`,
      sourceName: community.name,
    })

    setIsKickModalOpen(false)
    setMemberToKick(null)
  }

  const handleFounderTransferAndLeave = async () => {
    if (!community || !selectedSuccessorId) return
    const updated = transferCommunityFounder(community.name, selectedSuccessorId)
    if (updated) {
      // Now remove previous head from member list
      if (activeProfile?.display_name) {
        removeCommunityMember(community.name, activeProfile.display_name)
      }
      await leaveCommunityInDb(community.id || community.name)
      setJoined(false)
      setMemberCount((prev) => Math.max(1, prev - 1))
      setIsFounderDepartureOpen(false)
      navigate("/communities")
    }
  }

  const handlePublishAnnouncement = async (payload: {
    title: string
    content: string
    tag: string
    image?: string
  }) => {
    if (!community) return
    const created = addCommunityAnnouncement(community.name, payload)

    // Persist to Supabase announcements table
    try {
      const { data: dbComm } = await supabase
        .from("communities")
        .select("id")
        .ilike("name", community.name)
        .maybeSingle()

      if (dbComm?.id) {
        await supabase.from("announcements").insert({
          community_id: dbComm.id,
          title: payload.title,
          content: payload.content,
          tag: payload.tag,
          image: payload.image || null,
          likes: 0,
          dislikes: 0,
        })
      }
    } catch (err) {
      console.warn("Supabase post announcement notice:", err)
    }

    // Refresh live
    const remote = await fetchCommunityDetailFromDb(community.name)
    if (remote) {
      setCommunity(remote as MockCommunity)
    } else if (created) {
      const refreshed = findCommunityByName(community.name)
      if (refreshed) setCommunity(refreshed)
    }
  }

  const handleDeleteAnnouncement = async () => {
    if (!community || !announcementToDelete) return
    deleteCommunityAnnouncement(community.name, announcementToDelete)
    await deleteAnnouncementInDb(announcementToDelete)

    const remote = await fetchCommunityDetailFromDb(community.name)
    if (remote) {
      setCommunity(remote as MockCommunity)
    } else {
      const refreshed = findCommunityByName(community.name)
      if (refreshed) setCommunity(refreshed)
    }
    setAnnouncementToDelete(null)
  }

  const handleToggleCoLeader = (memberId: string, currentRole?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!community) return
    const newRole = currentRole === "co-leader" ? "member" : "co-leader"
    const updated = setMemberRole(community.name, memberId, newRole)
    if (updated) setCommunity(updated)
  }

  const handleReaction = async (announcementId: string, reactionType: "like" | "dislike", e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!community) return
    const userId = activeProfile?.display_name || "active-user"
    const updated = toggleAnnouncementReaction(community.name, announcementId, userId, reactionType)
    if (updated) setCommunity(updated)

    try {
      const currentLikes = updated?.announcements?.find((a) => a.id === announcementId)?.likes || 0
      const currentDislikes = updated?.announcements?.find((a) => a.id === announcementId)?.dislikes || 0
      await supabase
        .from("announcements")
        .update({ likes: currentLikes, dislikes: currentDislikes })
        .eq("id", announcementId)
    } catch (err) {
      console.warn("Supabase reaction sync notice:", err)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleDelete = () => {
    if (!community) return
    deleteMockCommunity(community.name)
    deleteCommunityInDb(community.id || community.name)
    navigate("/communities")
  }

  const handleSaveCommunity = async (updates: {
    name: string
    description: string
    image?: string
    whatsapp_link?: string
    instagram_link?: string
  }) => {
    if (!community) return
    const updated = updateMockCommunity(community.name, updates)
    if (updated) {
      setCommunity(updated)
      setIsEditModalOpen(false)
      if (updated.name !== community.name) {
        navigate(`/communities/${encodeURIComponent(updated.name)}`, { replace: true })
      }
    }

    // Persist edits to Supabase
    try {
      await supabase
        .from("communities")
        .update(updates)
        .or(`id.eq.${community.id || community.name},name.ilike.${community.name}`)
    } catch (err) {
      console.warn("Supabase update community notice:", err)
    }
  }

  const handleMemberClick = (member: CommunityMember) => {
    const previewData = {
      display_name: member.name,
      branch: member.branch,
      batch: member.batch,
      bio: `Student member in ${community?.name || "campus communities"}.`,
      avatar_url: member.avatar_url || "",
      instagram_url: member.instagram_url || "",
      linkedin_url: member.linkedin_url || "",
    }
    localStorage.setItem("vertex_preview_profile", JSON.stringify(previewData))
    navigate(`/profile?preview=${encodeURIComponent(member.name)}`)
  }

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-sm text-[#545e6d] space-y-3">
        <div className="w-8 h-8 border-2 border-[#141c2b] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading community details...</p>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-20 text-center">
        <p className="font-mono text-xs font-bold uppercase text-[#d84c23]">
          404 // COMMUNITY NOT FOUND
        </p>
        <h1 className="font-serif text-4xl font-black text-[#141c2b]">
          That community is not available.
        </h1>
        <div className="pt-3">
          <Link to="/communities" className="primary-action inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Communities</span>
          </Link>
        </div>
      </div>
    )
  }

  const activeMember = (community.members || []).find(
    (m) => activeProfile?.display_name && m.name.trim().toLowerCase() === activeProfile.display_name.trim().toLowerCase()
  )
  const isCoLeader = Boolean(activeMember?.role === "co-leader")
  const canPostAnnouncements = isFounder || isCoLeader
  const canRemoveMembers = isFounder || isCoLeader
  const isCreator = isFounder // Alias for creator-only community actions

  // Format creation date
  let formattedDate = "Recently"
  try {
    if (community.created_at) {
      const d = new Date(community.created_at)
      formattedDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  } catch { }

  const coverPhoto = community.image || FALLBACK_COVER

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Back to noticeboard navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/communities"
          className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#d84c23] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Noticeboard</span>
        </Link>

        <div className="flex items-center gap-2">
          {isCreator && (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="font-mono text-xs font-bold uppercase text-[#141c2b] bg-[#faf7f2] border-2 border-[#141c2b] px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-[#eae2d5] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Edit this community"
              >
                <Pencil className="w-3.5 h-3.5 text-[#d84c23]" />
                <span>Edit Community</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="font-mono text-xs font-bold uppercase text-[#d84c23] bg-[#fbe8e6] border-2 border-[#d84c23] px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#d84c23] hover:bg-[#d84c23] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Delete this community"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            onClick={handleShare}
            className="font-mono text-xs font-bold uppercase text-[#141c2b] bg-[#faf7f2] border-2 border-[#141c2b] px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-[#eae2d5] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#141c2b]" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="font-mono text-xs font-bold uppercase text-[#545e6d] bg-[#faf7f2] border-2 border-[#141c2b] px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-[#fbe8e6] hover:text-[#d84c23] hover:border-[#d84c23] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Report this community to campus moderators"
          >
            <Flag className="w-3.5 h-3.5 text-[#d84c23]" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[999] bg-[#141c2b]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 max-w-md w-full shadow-[8px_8px_0px_#141c2b] space-y-4">
            <h3 className="font-serif text-2xl font-black text-[#141c2b]">
              Delete Community?
            </h3>
            <p className="text-xs text-[#545e6d] leading-relaxed">
              Are you sure you want to delete <b>{community.name}</b>? This community and all its announcements will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="secondary-action text-xs font-mono"
                style={{ padding: "0.5rem 1rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="font-mono text-xs font-bold uppercase px-4 py-2 bg-[#d84c23] text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {isEditModalOpen && (
        <EditCommunityModal
          community={community}
          onSave={handleSaveCommunity}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* ── MAIN COMMUNITY HERO CARD ──────────────────────────── */}
      <section className="overflow-hidden rounded-lg border-2 border-[#141c2b] bg-[#faf7f2] shadow-[6px_6px_0px_#141c2b]">
        {/* Cover Photo Banner */}
        <div
          className="h-52 sm:h-72 md:h-80 w-full bg-cover bg-center border-b-2 border-[#141c2b] relative"
          style={{ backgroundImage: `url(${coverPhoto})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#141c2b]/85 via-[#141c2b]/30 to-transparent flex items-end p-6">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#faf7f2] bg-[#141c2b]/90 px-3 py-1 border border-[#faf7f2]/30 backdrop-blur-sm">
              ★ OFFICIAL BMU STUDENT COMMUNITY
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-[#141c2b]">
                {community.name}
              </h1>

              {/* Created When & By Whom Metadata */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 font-mono text-xs text-[#545e6d]">
                <span className="flex items-center gap-1.5 text-[#141c2b] font-bold">
                  <Calendar className="w-3.5 h-3.5 text-[#d84c23]" />
                  Created {formattedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-[#141c2b]">
                  <UserCheck className="w-3.5 h-3.5 text-[#d84c23]" />
                  Founded by <b className="text-[#141c2b]">{community.created_by.name}</b>
                  {community.created_by.branch && (
                    <span className="text-[#8892a0]">({community.created_by.branch})</span>
                  )}
                </span>
              </div>
            </div>

            {/* Member Count badge */}
            <div className="flex items-center gap-2 bg-[#eae2d5] border-2 border-[#141c2b] px-4 py-2 rounded-xs shadow-[2px_2px_0px_#141c2b] self-start font-mono text-xs font-bold text-[#141c2b]">
              <Users className="w-4 h-4 text-[#d84c23]" />
              <span>{memberCount} Active Members</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-base sm:text-lg leading-relaxed text-[#545e6d] border-t-2 border-[#d8cebe] pt-4">
            {community.description}
          </p>

          {/* Action Row: Head Status / Join + WhatsApp + Instagram */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isHead ? (
              <div className="flex items-center gap-1.5 px-4 py-3 bg-[#eae2d5] border-2 border-[#141c2b] text-[#141c2b] font-mono text-xs font-bold uppercase rounded-xs shadow-[2px_2px_0px_#141c2b]">
                <Crown className="w-4 h-4 text-[#d84c23]" />
                <span>Head of Community (Joined ✓)</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={isJoining}
                onClick={handleToggleJoin}
                className={`font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xs border-2 transition-all flex items-center gap-2 cursor-pointer ${
                  joined
                    ? "bg-[#fbe8e6] text-[#d84c23] hover:bg-[#d84c23] hover:text-white border-[#141c2b] shadow-[3px_3px_0px_#141c2b]"
                    : "bg-[#141c2b] text-white hover:bg-[#d84c23] border-[#141c2b] shadow-[3px_3px_0px_#d84c23]"
                } ${isJoining ? "opacity-75 cursor-not-allowed" : ""}`}
                title={joined ? "Leave this community" : "Join this community"}
              >
                {joined && <LogOut className="w-4 h-4" />}
                <span>{isJoining ? "Updating..." : joined ? "Leave Community" : "+ Join Community"}</span>
              </button>
            )}

            {community.whatsapp_link && (
              <a
                href={community.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-3 bg-[#25D366] text-white border-2 border-[#141c2b] rounded-xs shadow-[3px_3px_0px_#141c2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform inline-flex items-center gap-2"
                title="Join WhatsApp Group"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp Group ↗</span>
              </a>
            )}

            {community.instagram_link && (
              <a
                href={community.instagram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white border-2 border-[#141c2b] rounded-xs shadow-[3px_3px_0px_#141c2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform inline-flex items-center gap-2"
                title="Visit Instagram Page"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram ↗</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── 2-COLUMN SECTION: ANNOUNCEMENTS & MEMBERS ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scrollable Announcements Feed (7 cols) */}
        <section className="lg:col-span-7 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-7 shadow-[5px_5px_0px_#141c2b] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#141c2b] pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#d84c23]" />
              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#141c2b]">
                Announcements Board
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-[#d84c23] uppercase">
                {community.announcements?.length || 0} BULLETINS
              </span>

              {canPostAnnouncements && (
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="font-mono text-[11px] font-bold uppercase px-2.5 py-1 bg-[#d84c23] text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-orange-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Publish new announcement"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post Announcement</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable container for announcements */}
          <div className="max-h-[440px] overflow-y-auto pr-2 space-y-3.5 custom-scrollbar">
            {community.announcements && community.announcements.length > 0 ? (
              community.announcements.map((item) => {
                const currentUserId = (activeProfile?.display_name || "active-user").trim().toLowerCase()
                const hasLiked = Array.isArray(item.likedBy) && item.likedBy.includes(currentUserId)
                const hasDisliked = Array.isArray(item.dislikedBy) && item.dislikedBy.includes(currentUserId)

                return (
                  <article
                    key={item.id}
                    className="bg-[#f5f1ea] border-2 border-[#141c2b] p-4 rounded-sm shadow-[3px_3px_0px_#141c2b] space-y-2.5 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#141c2b] text-white rounded-xs">
                          {item.tag || "NOTICE"}
                        </span>
                        <span className="font-mono text-[11px] text-[#545e6d]">{item.date}</span>
                      </div>

                      {isFounder && (
                        <button
                          type="button"
                          onClick={() => setAnnouncementToDelete(item.id)}
                          className="text-[#8892a0] hover:text-[#d84c23] p-1 rounded-xs transition-colors cursor-pointer"
                          title="Delete this announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-serif text-base font-bold text-[#141c2b]">{item.title}</h3>

                    {item.image && (
                      <div className="rounded-xs overflow-hidden border border-[#141c2b] max-h-48">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xs text-[#545e6d] leading-relaxed whitespace-pre-line">{item.content}</p>

                    <div className="pt-2 border-t border-[#d8cebe] flex items-center justify-between flex-wrap gap-2">
                      <span className="font-mono text-[10px] text-[#8892a0]">
                        Posted by <b>{item.author}</b>
                      </span>

                      {/* Reaction Thumbs Up & Thumbs Down Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleReaction(item.id, "like", e)}
                          className={`font-mono text-[11px] font-bold px-2 py-1 rounded-xs border-1.5 transition-all flex items-center gap-1.5 cursor-pointer ${
                            hasLiked
                              ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[1px_1px_0px_#d84c23]"
                              : "bg-[#faf7f2] text-[#141c2b] border-[#141c2b]/50 hover:bg-white hover:border-[#141c2b] hover:shadow-[1px_1px_0px_#141c2b]"
                          }`}
                          title="Like announcement"
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? "text-[#d84c23]" : "text-[#141c2b]"}`} />
                          <span>{item.likes || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleReaction(item.id, "dislike", e)}
                          className={`font-mono text-[11px] font-bold px-2 py-1 rounded-xs border-1.5 transition-all flex items-center gap-1.5 cursor-pointer ${
                            hasDisliked
                              ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[1px_1px_0px_#d84c23]"
                              : "bg-[#faf7f2] text-[#141c2b] border-[#141c2b]/50 hover:bg-white hover:border-[#141c2b] hover:shadow-[1px_1px_0px_#141c2b]"
                          }`}
                          title="Dislike announcement"
                        >
                          <ThumbsDown className={`w-3.5 h-3.5 ${hasDisliked ? "text-[#d84c23]" : "text-[#545e6d]"}`} />
                          <span>{item.dislikes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="text-center py-10 text-xs font-mono text-[#545e6d]">
                No announcements published yet. Check back soon!
              </div>
            )}
          </div>
        </section>

        {/* Member Directory Dropdown Section (5 cols) */}
        <section className="lg:col-span-5 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 shadow-[5px_5px_0px_#141c2b] space-y-4">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              COMMUNITY ROSTER
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-black text-[#141c2b]">
              Member Directory
            </h2>
            <p className="text-xs text-[#545e6d]">
              Connect with fellow students in this community.
            </p>
          </div>

          {/* Collapsible Trigger Button with Downward Arrow */}
          <button
            type="button"
            onClick={() => setIsMemberListOpen((prev) => !prev)}
            className="w-full font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 bg-[#141c2b] text-white border-2 border-[#141c2b] rounded-xs shadow-[3px_3px_0px_#d84c23] flex items-center justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#faf7f2]" />
              <span>{isMemberListOpen ? "Hide Member List" : "View Member List"}</span>
              <span className="bg-[#d84c23] text-white px-1.5 py-0.2 rounded-xs text-[10px]">
                {community.members?.length || 0}
              </span>
            </span>

            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${isMemberListOpen ? "rotate-180" : "rotate-0"
                }`}
            />
          </button>

          {/* Expandable Member Cards List */}
          {isMemberListOpen && (
            <div className="pt-2 space-y-3 animate-fadeIn">
              <p className="font-mono text-[11px] text-[#545e6d] pb-1">
                Click any student card to view their full profile:
              </p>

              {(() => {
                const allMembers = community.members || []
                const leadershipMembers = allMembers.filter(
                  (m) =>
                    m.is_founder ||
                    m.is_head ||
                    m.role === "founder" ||
                    m.role === "head" ||
                    (community.created_by?.name &&
                      m.name.trim().toLowerCase() === community.created_by.name.trim().toLowerCase())
                )
                const regularMembers = allMembers.filter(
                  (m) => !leadershipMembers.some((lm) => lm.id === m.id || lm.name.toLowerCase() === m.name.toLowerCase())
                )

                return (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* 1. LEADERSHIP SECTION */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#d84c23] uppercase tracking-wider pb-1">
                        <Crown className="w-3.5 h-3.5 text-[#d84c23]" />
                        <span>Community Leadership / Head</span>
                      </div>
                      {leadershipMembers.map((member) => {
                        const initials = member.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)

                        return (
                          <div
                            key={member.id}
                            onClick={() => handleMemberClick(member)}
                            className="group flex items-center justify-between p-3 bg-[#faf7f2] border-2 border-[#141c2b] rounded-xs shadow-[3px_3px_0px_#d84c23] hover:bg-white hover:translate-x-[-1px] transition-all cursor-pointer gap-2"
                            title={`View Head ${member.name}'s profile`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-xs object-cover border-1.5 border-[#141c2b] flex-shrink-0 shadow-[1px_1px_0px_#141c2b]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xs bg-[#141c2b] text-white font-serif font-black flex items-center justify-center text-xs flex-shrink-0 border-1.5 border-[#141c2b]">
                                  {initials}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-sans font-bold text-xs text-[#141c2b] group-hover:text-[#d84c23] transition-colors truncate">
                                    {member.name}
                                  </h4>
                                  <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#d84c23] text-white rounded-2xs flex items-center gap-0.5 shadow-[1px_1px_0px_#141c2b]">
                                    <Crown className="w-2.5 h-2.5" /> Head
                                  </span>
                                </div>
                                <p className="font-mono text-[10px] text-[#545e6d] truncate">
                                  {member.branch} • {member.batch}
                                </p>
                              </div>
                            </div>

                            <ExternalLink className="w-3.5 h-3.5 text-[#8892a0] group-hover:text-[#d84c23] transition-colors ml-1" />
                          </div>
                        )
                      })}
                    </div>

                    {/* 2. CLEAR DIVIDER GAP */}
                    <div className="flex items-center gap-3 pt-2 pb-1">
                      <div className="flex-1 h-[1.5px] bg-[#d8cebe]" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#545e6d] bg-[#f5f1ea] px-2 py-0.5 rounded-2xs border border-[#d8cebe]">
                        Community Members ({regularMembers.length})
                      </span>
                      <div className="flex-1 h-[1.5px] bg-[#d8cebe]" />
                    </div>

                    {/* 3. REGULAR MEMBERS LIST */}
                    {regularMembers.length > 0 ? (
                      <div className="space-y-2">
                        {regularMembers.map((member) => {
                          const initials = member.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)

                          const isMemberCoLeader = Boolean(member.role === "co-leader")
                          const isMemberSelf = Boolean(
                            activeProfile?.display_name &&
                            member.name.trim().toLowerCase() === activeProfile.display_name.trim().toLowerCase()
                          )

                          return (
                            <div
                              key={member.id}
                              onClick={() => handleMemberClick(member)}
                              className="group flex items-center justify-between p-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-white hover:border-[#d84c23] transition-all cursor-pointer gap-2"
                              title={`View ${member.name}'s profile`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.name}
                                    className="w-9 h-9 rounded-xs object-cover border-1.5 border-[#141c2b] flex-shrink-0 shadow-[1px_1px_0px_#141c2b]"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xs bg-[#141c2b] text-white font-serif font-black flex items-center justify-center text-xs flex-shrink-0 border-1.5 border-[#141c2b]">
                                    {initials}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-sans font-bold text-xs text-[#141c2b] group-hover:text-[#d84c23] transition-colors truncate">
                                      {member.name}
                                    </h4>
                                    {isMemberCoLeader && (
                                      <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#2b59ff] text-white rounded-2xs flex items-center gap-0.5 shadow-[1px_1px_0px_#141c2b]">
                                        <ShieldCheck className="w-2.5 h-2.5" /> Co-Leader
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-mono text-[10px] text-[#545e6d] truncate">
                                    {member.branch} • {member.batch}
                                  </p>
                                </div>
                              </div>

                              {/* Co-Leader Promotion / Kick Controls */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isFounder && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleCoLeader(member.id, member.role, e)}
                                    className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-2xs border transition-all cursor-pointer ${
                                      isMemberCoLeader
                                        ? "bg-[#eae2d5] text-[#141c2b] border-[#141c2b] hover:bg-white"
                                        : "bg-[#2b59ff] text-white border-[#141c2b] hover:bg-blue-700 shadow-[1px_1px_0px_#141c2b]"
                                    }`}
                                    title={isMemberCoLeader ? "Revoke Co-Leader status" : "Promote to Co-Leader"}
                                  >
                                    {isMemberCoLeader ? "Revoke" : "+ Co-Leader"}
                                  </button>
                                )}

                                {canRemoveMembers && !isMemberSelf && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenKickModal(member, e)}
                                    className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-2xs border border-[#d84c23] bg-[#fbe8e6] text-[#d84c23] hover:bg-[#d84c23] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                                    title="Kick member with reason"
                                  >
                                    <UserMinus className="w-3 h-3" />
                                    <span>Kick</span>
                                  </button>
                                )}

                                <ExternalLink className="w-3.5 h-3.5 text-[#8892a0] group-hover:text-[#d84c23] transition-colors ml-1" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-white border-2 border-dashed border-[#141c2b]/30 rounded-xs text-center font-mono text-xs text-[#545e6d]">
                        No other members have joined yet. Be the first to join this community!
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </section>
      </div>

      {/* Create Announcement Modal */}
      {community && (
        <CreateAnnouncementModal
          communityName={community.name}
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          onPublish={handlePublishAnnouncement}
        />
      )}

      {/* ── KICK MEMBER MODAL ────────────────────────────────────── */}
      {isKickModalOpen && memberToKick && (
        <div className="fixed inset-0 z-[999] bg-[#141c2b]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_#141c2b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8cebe] pb-2.5">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase">
                  FOUNDER PERMISSION // REMOVE MEMBER
                </span>
                <h3 className="font-serif text-xl font-bold text-[#141c2b]">
                  Kick Member from Community
                </h3>
              </div>
              <button
                onClick={() => setIsKickModalOpen(false)}
                className="font-mono text-xs font-bold text-[#545e6d] hover:text-[#141c2b] p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#f5f1ea] border border-[#141c2b] rounded-xs">
              <div className="w-10 h-10 rounded-xs bg-[#141c2b] text-white font-serif font-black flex items-center justify-center text-xs flex-shrink-0">
                {memberToKick.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-sm text-[#141c2b] truncate">{memberToKick.name}</p>
                <p className="font-mono text-[10px] text-[#545e6d]">{memberToKick.branch} • {memberToKick.batch}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b]">
                Kick Reason / Message <span className="text-[#d84c23]">*</span>
              </label>
              <textarea
                rows={3}
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
                placeholder="Explain reason for removal (will be sent in student notification)..."
                className="w-full px-3 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] resize-none"
              />
              <p className="font-mono text-[10px] text-[#8892a0]">
                This message will be dispatched directly to the student's Vertex alerts.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#d8cebe]">
              <button
                type="button"
                onClick={() => setIsKickModalOpen(false)}
                className="secondary-action text-xs font-mono"
                style={{ padding: "0.5rem 1rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmKick}
                className="font-mono text-xs font-bold uppercase px-4 py-2 bg-[#d84c23] text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-red-700 cursor-pointer"
              >
                Confirm Kick
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEAD DEPARTURE / HANDOVER MODAL ────────────────────── */}
      {isFounderDepartureOpen && (
        <div className="fixed inset-0 z-[999] bg-[#141c2b]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_#141c2b] space-y-5">
            <div className="flex items-center justify-between border-b border-[#d8cebe] pb-2.5">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase">
                  HEAD ACTIONS // DEPARTURE & HANDOVER
                </span>
                <h3 className="font-serif text-2xl font-black text-[#141c2b]">
                  Leave Community
                </h3>
              </div>
              <button
                onClick={() => setIsFounderDepartureOpen(false)}
                className="font-mono text-xs font-bold text-[#545e6d] hover:text-[#141c2b] p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#545e6d] leading-relaxed">
              As the <b>Head & Leader</b> of <b>{community.name}</b>, you cannot simply leave without resolving leadership. You must choose to either <b>permanently delete the community</b> or <b>hand over Head leadership</b> to another member.
            </p>

            {/* Choice 1: Transfer Leadership */}
            {community.members && community.members.filter((m) => !m.is_founder && !m.is_head).length > 0 ? (
              <div className="p-4 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs space-y-3 shadow-[2px_2px_0px_#141c2b]">
                <h4 className="font-serif font-bold text-sm text-[#141c2b] flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#d84c23]" />
                  <span>Option A: Transfer Head Role & Leave</span>
                </h4>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] font-bold uppercase text-[#545e6d]">
                    Select Successor Member:
                  </label>
                  <select
                    value={selectedSuccessorId}
                    onChange={(e) => setSelectedSuccessorId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Member to Promote to Head --</option>
                    {community.members
                      .filter((m) => !m.is_founder && !m.is_head)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.branch} • {m.batch})
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!selectedSuccessorId}
                  onClick={handleFounderTransferAndLeave}
                  className={`w-full py-2.5 font-mono text-xs font-bold uppercase rounded-xs border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedSuccessorId
                      ? "bg-[#141c2b] text-white border-[#141c2b] shadow-[2px_2px_0px_#d84c23] hover:bg-[#d84c23]"
                      : "bg-[#eae2d5] text-[#8892a0] border-[#141c2b]/40 cursor-not-allowed"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Transfer Head Role & Leave Community</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-[#fbe8e6] border-2 border-[#d84c23] rounded-xs text-xs font-mono text-[#d84c23]">
                ℹ️ There are no other members in this community to transfer leadership to. You must delete the community to proceed.
              </div>
            )}

            {/* Choice 2: Delete Community */}
            <div className="p-4 bg-[#fbe8e6] border-2 border-[#d84c23] rounded-xs space-y-2.5 shadow-[2px_2px_0px_#d84c23]">
              <h4 className="font-serif font-bold text-sm text-[#d84c23] flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span>Option B: Delete Community</span>
              </h4>
              <p className="text-xs text-[#545e6d]">
                This will permanently delete {community.name}, remove all announcements, and erase the community from the university bulletin board.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                className="font-mono text-xs font-bold uppercase px-4 py-2 bg-[#d84c23] text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-red-700 transition-colors cursor-pointer"
              >
                Permanently Delete Community
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsFounderDepartureOpen(false)}
                className="secondary-action text-xs font-mono"
                style={{ padding: "0.5rem 1rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Announcement Confirmation Dialog */}
      {announcementToDelete && (
        <div className="fixed inset-0 z-[999] bg-[#141c2b]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 max-w-md w-full shadow-[8px_8px_0px_#141c2b] space-y-4">
            <h3 className="font-serif text-2xl font-black text-[#141c2b]">
              Delete Bulletin?
            </h3>
            <p className="text-xs text-[#545e6d] leading-relaxed">
              Are you sure you want to remove this announcement from the community board?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAnnouncementToDelete(null)}
                className="secondary-action text-xs font-mono"
                style={{ padding: "0.5rem 1rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAnnouncement}
                className="font-mono text-xs font-bold uppercase px-4 py-2 bg-[#d84c23] text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Report Community Modal */}
      {community && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="community"
          targetId={community.id || community.name}
          targetName={community.name}
        />
      )}
    </div>
  )
}

export default CommunityDetail
