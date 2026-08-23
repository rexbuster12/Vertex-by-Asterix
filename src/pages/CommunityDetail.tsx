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
} from "lucide-react"
import { WhatsAppIcon, InstagramIcon } from "../components/Icons"
import EditCommunityModal from "../components/EditCommunityModal"
import CreateAnnouncementModal from "../components/CreateAnnouncementModal"
import {
  findCommunityByName,
  deleteMockCommunity,
  updateMockCommunity,
  addCommunityAnnouncement,
  deleteCommunityAnnouncement,
  setMemberRole,
  removeCommunityMember,
  toggleAnnouncementReaction,
  type MockCommunity,
  type CommunityMember,
} from "../lib/mockStore"
import { getActiveProfile } from "../lib/tempStore"
import { addNotification } from "../lib/notificationStore"
import { fetchCommunityDetailFromDb, deleteCommunityInDb } from "../lib/supabaseService"

const FALLBACK_COVER = "/default-banner.jpg"

function CommunityDetail() {
  const { communityName } = useParams()
  const navigate = useNavigate()
  const [community, setCommunity] = useState<MockCommunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [isMemberListOpen, setIsMemberListOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)

  const activeProfile = getActiveProfile()

  useEffect(() => {
    async function loadCommunity() {
      if (!communityName) {
        setLoading(false)
        return
      }

      const decoded = decodeURIComponent(communityName).trim()

      // 1. Check local cache first for instant render
      const localFound = findCommunityByName(decoded)
      if (localFound) {
        setCommunity(localFound)
        setMemberCount(localFound.members_count || localFound.members?.length || 1)
      }

      // 2. Fetch live data from Supabase
      try {
        const remoteCommunity = await fetchCommunityDetailFromDb(decoded)
        if (remoteCommunity) {
          setCommunity(remoteCommunity as MockCommunity)
          setMemberCount(remoteCommunity.members_count || remoteCommunity.members?.length || 1)
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

  const handleToggleJoin = () => {
    if (joined) {
      setJoined(false)
      setMemberCount((prev) => Math.max(1, prev - 1))
    } else {
      setJoined(true)
      setMemberCount((prev) => prev + 1)
      if (community) {
        addNotification({
          type: "member_joined",
          title: `Joined ${community.name}`,
          message: `You joined ${community.name}. You'll receive updates and bulletins from this community.`,
          linkUrl: `/communities/${encodeURIComponent(community.name)}`,
          communityName: community.name,
        })
      }
    }
  }

  const handlePublishAnnouncement = (payload: {
    title: string
    content: string
    tag: string
    image?: string
  }) => {
    if (!community) return
    const created = addCommunityAnnouncement(community.name, payload)
    if (created) {
      const refreshed = findCommunityByName(community.name)
      if (refreshed) setCommunity(refreshed)
    }
  }

  const handleDeleteAnnouncement = () => {
    if (!community || !announcementToDelete) return
    deleteCommunityAnnouncement(community.name, announcementToDelete)
    const refreshed = findCommunityByName(community.name)
    if (refreshed) setCommunity(refreshed)
    setAnnouncementToDelete(null)
  }

  const handleToggleCoLeader = (memberId: string, currentRole?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!community) return
    const newRole = currentRole === "co-leader" ? "member" : "co-leader"
    const updated = setMemberRole(community.name, memberId, newRole)
    if (updated) setCommunity(updated)
  }

  const handleRemoveMember = (memberId: string, memberName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!community) return
    const confirmRemove = window.confirm(`Are you sure you want to remove ${memberName} from ${community.name}?`)
    if (confirmRemove) {
      const updated = removeCommunityMember(community.name, memberId)
      if (updated) setCommunity(updated)
    }
  }

  const handleReaction = (announcementId: string, reactionType: "like" | "dislike", e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!community) return
    const userId = activeProfile?.display_name || "active-user"
    const updated = toggleAnnouncementReaction(community.name, announcementId, userId, reactionType)
    if (updated) setCommunity(updated)
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

  const handleSaveCommunity = (updates: {
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
  }

  const handleMemberClick = (member: CommunityMember) => {
    const previewData = {
      display_name: member.name,
      branch: member.branch,
      batch: member.batch,
      bio: `Student member in ${community?.name || "campus communities"}.`,
      avatar_url: member.avatar_url || "",
      instagram_url: `https://instagram.com/${member.name.toLowerCase().replace(/\s+/g, "_")}`,
      linkedin_url: `https://linkedin.com/in/${member.name.toLowerCase().replace(/\s+/g, "-")}`,
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

  // Check roles
  const isFounder = Boolean(
    activeProfile?.display_name &&
    community.created_by?.name &&
    activeProfile.display_name.trim().toLowerCase() === community.created_by.name.trim().toLowerCase()
  )

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

          {/* Action Row: Founder Status / Join + WhatsApp + Instagram */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isCreator ? (
              <div className="flex items-center gap-1.5 px-4 py-3 bg-[#eae2d5] border-2 border-[#141c2b] text-[#141c2b] font-mono text-xs font-bold uppercase rounded-xs shadow-[2px_2px_0px_#141c2b]">
                <Crown className="w-4 h-4 text-[#d84c23]" />
                <span>Founder (Joined ✓)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleToggleJoin}
                className={`primary-action font-mono text-xs uppercase font-bold tracking-wider cursor-pointer ${joined ? "bg-[#eae2d5] text-[#141c2b] border-[#141c2b]" : ""
                  }`}
                style={{ padding: "0.75rem 1.5rem" }}
              >
                {joined ? "Joined ✓" : "+ Join Community"}
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
            <div className="pt-2 space-y-2.5 animate-fadeIn">
              <p className="font-mono text-[11px] text-[#545e6d] pb-1">
                Click any member card to view their student profile:
              </p>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {community.members && community.members.length > 0 ? (
                  community.members.map((member) => {
                    const initials = member.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)

                    const isMemberFounder = Boolean(
                      member.is_founder ||
                      (community.created_by?.name &&
                        member.name.trim().toLowerCase() === community.created_by.name.trim().toLowerCase())
                    )
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
                          {/* Member Photo or Initials */}
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

                          {/* Member Info: Name + Founder/Co-Leader Tag + Branch */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-sans font-bold text-xs text-[#141c2b] group-hover:text-[#d84c23] transition-colors truncate">
                                {member.name}
                              </h4>
                              {isMemberFounder ? (
                                <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#d84c23] text-white rounded-2xs flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> Founder
                                </span>
                              ) : isMemberCoLeader ? (
                                <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#2b59ff] text-white rounded-2xs flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Co-Leader
                                </span>
                              ) : null}
                            </div>
                            <p className="font-mono text-[10px] text-[#545e6d] truncate">
                              {member.branch} • {member.batch}
                            </p>
                          </div>
                        </div>

                        {/* Co-Leader Promotion / Removal Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isFounder && !isMemberFounder && (
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

                          {canRemoveMembers && !isMemberFounder && !isMemberSelf && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveMember(member.id, member.name, e)}
                              className="p-1 text-[#8892a0] hover:text-[#d84c23] hover:bg-[#fbe8e6] rounded-xs transition-colors cursor-pointer border border-transparent hover:border-[#d84c23]"
                              title="Remove member from community"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <ExternalLink className="w-3.5 h-3.5 text-[#8892a0] group-hover:text-[#d84c23] transition-colors ml-1" />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 font-mono text-xs text-[#545e6d]">
                    No members registered yet.
                  </div>
                )}
              </div>
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
    </div>
  )
}

export default CommunityDetail
