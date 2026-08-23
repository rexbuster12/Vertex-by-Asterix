import { getActiveProfile, getActiveUser } from "./tempStore"
import { addNotification } from "./notificationStore"

export interface CommunityMember {
  id: string
  name: string
  branch: string
  batch: string
  avatar_url?: string
  is_founder?: boolean
  is_head?: boolean
  role?: "founder" | "head" | "co-leader" | "member"
}

export interface CommunityAnnouncement {
  id: string
  title: string
  content: string
  date: string
  author: string
  tag?: string
  image?: string
  likes?: number
  dislikes?: number
  likedBy?: string[]
  dislikedBy?: string[]
}

export interface MockCommunity {
  id: string
  name: string
  description: string
  members_count: number
  whatsapp_link?: string
  instagram_link?: string
  image?: string
  created_at: string
  created_by: {
    name: string
    branch: string
    batch: string
    email?: string
  }
  announcements: CommunityAnnouncement[]
  members: CommunityMember[]
}

// 100% Blank website from the start for clean demo recording
const INITIAL_COMMUNITIES: MockCommunity[] = []

const STORAGE_KEY = "vertex_mock_communities_v1"

export function getStoredCommunities(): MockCommunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn("Could not load from localStorage", err)
  }
  return INITIAL_COMMUNITIES
}

export function saveStoredCommunities(communities: MockCommunity[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(communities))
  } catch (err) {
    console.warn("Could not save to localStorage", err)
  }
}

export function findCommunityByName(name: string): MockCommunity | undefined {
  const all = getStoredCommunities()
  const cleanName = decodeURIComponent(name).trim().toLowerCase()
  return all.find((c) => c.name.trim().toLowerCase() === cleanName)
}

export function deleteMockCommunity(communityNameOrId: string): boolean {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  const filtered = all.filter(
    (c) => c.id !== communityNameOrId && c.name.trim().toLowerCase() !== clean
  )
  saveStoredCommunities(filtered)
  console.log(`🗑️ [COMMUNITY DELETED FROM TEMPORARY STORE]: ${communityNameOrId}`)
  return true
}

export function updateMockCommunity(
  communityNameOrId: string,
  updates: Partial<Pick<MockCommunity, "name" | "description" | "image" | "whatsapp_link" | "instagram_link">>
): MockCommunity | null {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  let updatedCommunity: MockCommunity | null = null

  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      updatedCommunity = {
        ...c,
        ...updates,
        name: updates.name ? updates.name.trim() : c.name,
        description: updates.description !== undefined ? updates.description.trim() : c.description,
        image: updates.image !== undefined ? updates.image : c.image,
        whatsapp_link: updates.whatsapp_link !== undefined ? updates.whatsapp_link.trim() : c.whatsapp_link,
        instagram_link: updates.instagram_link !== undefined ? updates.instagram_link.trim() : c.instagram_link,
      }
      return updatedCommunity
    }
    return c
  })

  if (updatedCommunity) {
    saveStoredCommunities(updatedList)
    console.log("✏️ [COMMUNITY UPDATED IN TEMPORARY STORE]:", updatedCommunity)
  }
  return updatedCommunity
}

export function setMemberRole(
  communityNameOrId: string,
  memberId: string,
  role: "co-leader" | "member"
): MockCommunity | null {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  let updatedCommunity: MockCommunity | null = null

  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      const updatedMembers = (c.members || []).map((m) => {
        if (m.id === memberId && !m.is_founder) {
          return {
            ...m,
            role: role,
          }
        }
        return m
      })
      updatedCommunity = { ...c, members: updatedMembers }
      return updatedCommunity
    }
    return c
  })

  if (updatedCommunity) {
    saveStoredCommunities(updatedList)
    console.log(`🛡️ [MEMBER ROLE UPDATED IN ${communityNameOrId}]: Member ${memberId} -> ${role}`)
  }
  return updatedCommunity
}

export function removeCommunityMember(
  communityNameOrId: string,
  memberId: string
): MockCommunity | null {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  let updatedCommunity: MockCommunity | null = null

  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      const filteredMembers = (c.members || []).filter(
        (m) => m.id !== memberId || m.is_founder
      )
      updatedCommunity = {
        ...c,
        members: filteredMembers,
        members_count: Math.max(1, (c.members_count || filteredMembers.length) - 1),
      }
      return updatedCommunity
    }
    return c
  })

  if (updatedCommunity) {
    saveStoredCommunities(updatedList)
    console.log(`🚫 [MEMBER REMOVED FROM ${communityNameOrId}]: Member ${memberId}`)
  }
  return updatedCommunity
}

export function toggleAnnouncementReaction(
  communityNameOrId: string,
  announcementId: string,
  userIdentifier: string,
  reactionType: "like" | "dislike"
): MockCommunity | null {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  const userId = (userIdentifier || "active-user").trim().toLowerCase()
  let updatedCommunity: MockCommunity | null = null

  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      const updatedAnnouncements = (c.announcements || []).map((ann) => {
        if (ann.id === announcementId) {
          let likedBy = Array.isArray(ann.likedBy) ? [...ann.likedBy] : []
          let dislikedBy = Array.isArray(ann.dislikedBy) ? [...ann.dislikedBy] : []

          const hasLiked = likedBy.includes(userId)
          const hasDisliked = dislikedBy.includes(userId)

          if (reactionType === "like") {
            if (hasLiked) {
              // Remove like
              likedBy = likedBy.filter((u) => u !== userId)
            } else {
              // Add like and remove dislike if present
              likedBy.push(userId)
              dislikedBy = dislikedBy.filter((u) => u !== userId)
            }
          } else if (reactionType === "dislike") {
            if (hasDisliked) {
              // Remove dislike
              dislikedBy = dislikedBy.filter((u) => u !== userId)
            } else {
              // Add dislike and remove like if present
              dislikedBy.push(userId)
              likedBy = likedBy.filter((u) => u !== userId)
            }
          }

          return {
            ...ann,
            likes: likedBy.length,
            dislikes: dislikedBy.length,
            likedBy,
            dislikedBy,
          }
        }
        return ann
      })

      updatedCommunity = {
        ...c,
        announcements: updatedAnnouncements,
      }
      return updatedCommunity
    }
    return c
  })

  if (updatedCommunity) {
    saveStoredCommunities(updatedList)
  }
  return updatedCommunity
}

export function addCommunityAnnouncement(
  communityNameOrId: string,
  payload: {
    title: string
    content: string
    tag?: string
    image?: string
  }
): CommunityAnnouncement | null {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  const active = getActiveProfile()
  const authorName = active?.display_name || "Community Founder"

  const newAnnouncement: CommunityAnnouncement = {
    id: `ann-${Date.now()}`,
    title: payload.title.trim(),
    content: payload.content.trim(),
    tag: (payload.tag || "NOTICE").toUpperCase(),
    image: payload.image || undefined,
    date: "Just now",
    author: authorName,
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
  }

  let targetCommunityName = ""
  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      targetCommunityName = c.name
      return {
        ...c,
        announcements: [newAnnouncement, ...(c.announcements || [])],
      }
    }
    return c
  })

  if (targetCommunityName) {
    saveStoredCommunities(updatedList)
    console.log(`📢 [ANNOUNCEMENT POSTED IN ${targetCommunityName}]:`, newAnnouncement)

    // Trigger app notification
    addNotification({
      type: "announcement_posted",
      title: `New announcement in ${targetCommunityName}`,
      message: `${newAnnouncement.title} — ${newAnnouncement.content.slice(0, 80)}...`,
      linkUrl: `/communities/${encodeURIComponent(targetCommunityName)}`,
      sourceName: authorName,
      communityName: targetCommunityName,
    })

    return newAnnouncement
  }
  return null
}

export function deleteCommunityAnnouncement(
  communityNameOrId: string,
  announcementId: string
): boolean {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  let deleted = false

  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      const remaining = (c.announcements || []).filter((a) => a.id !== announcementId)
      deleted = remaining.length !== (c.announcements || []).length
      return {
        ...c,
        announcements: remaining,
      }
    }
    return c
  })

  if (deleted) {
    saveStoredCommunities(updatedList)
    console.log(`🗑️ [ANNOUNCEMENT ${announcementId} DELETED FROM ${communityNameOrId}]`)
  }
  return deleted
}

export function createMockCommunity(payload: {
  name: string
  description: string
  whatsapp_link?: string
  instagram_link?: string
  image?: string
}): MockCommunity {
  const all = getStoredCommunities()
  
  // Get active temporary profile / user created during demo
  const activeProfile = getActiveProfile()
  const activeUser = getActiveUser()

  let authorName = "Student Member"
  let authorBranch = "B.Tech CSE"
  let authorBatch = "2024–2028"
  let authorAvatar = ""

  if (activeProfile?.display_name) {
    authorName = activeProfile.display_name.trim()
    if (activeProfile.branch) authorBranch = activeProfile.branch
    if (activeProfile.batch) authorBatch = activeProfile.batch
    if (activeProfile.avatar_url) authorAvatar = activeProfile.avatar_url
  } else if (activeUser?.name) {
    authorName = activeUser.name.trim()
  }

  const newCommunity: MockCommunity = {
    id: `comm-${Date.now()}`,
    name: payload.name.trim(),
    description: payload.description.trim() || "A campus student community on Vertex.",
    members_count: 1,
    whatsapp_link: payload.whatsapp_link?.trim() || undefined,
    instagram_link: payload.instagram_link?.trim() || undefined,
    image: payload.image || undefined,
    created_at: new Date().toISOString(),
    created_by: {
      name: authorName,
      branch: authorBranch,
      batch: authorBatch,
      email: activeUser?.email,
    },
    announcements: [
      {
        id: `ann-${Date.now()}`,
        title: `Welcome to ${payload.name.trim()}! 🎉`,
        content: `Community was officially established by ${authorName}. Join our official links and connect with fellow members!`,
        date: "Just now",
        author: authorName,
        tag: "FOUNDATION",
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
      },
    ],
    members: [
      {
        id: `mem-${Date.now()}`,
        name: authorName,
        branch: authorBranch,
        batch: authorBatch,
        avatar_url: authorAvatar || undefined,
        is_founder: true,
        role: "founder",
      },
    ],
  }

  // Save to stored list
  const updated = [newCommunity, ...all]
  saveStoredCommunities(updated)

  try {
    const saved = localStorage.getItem("vertex_head_community_names")
    const list: string[] = saved ? JSON.parse(saved) : []
    if (!list.includes(newCommunity.name.trim().toLowerCase())) {
      list.push(newCommunity.name.trim().toLowerCase())
      localStorage.setItem("vertex_head_community_names", JSON.stringify(list))
    }
  } catch { }

  console.log("🚀 [VERTEX COMMUNITY CREATED BY]:", authorName, newCommunity)

  // Trigger notification for creation
  addNotification({
    type: "announcement_posted",
    title: `Community Created: ${newCommunity.name}`,
    message: `You established ${newCommunity.name}. Announcements and bulletin boards are live!`,
    linkUrl: `/communities/${encodeURIComponent(newCommunity.name)}`,
    sourceName: authorName,
    communityName: newCommunity.name,
  })

  return newCommunity
}

export function transferCommunityFounder(
  communityNameOrId: string,
  newFounderId: string
): MockCommunity | null {
  const all = getStoredCommunities()
  const clean = decodeURIComponent(communityNameOrId).trim().toLowerCase()
  let updatedCommunity: MockCommunity | null = null

  const updatedList = all.map((c) => {
    if (c.id === communityNameOrId || c.name.trim().toLowerCase() === clean) {
      const newFounderMember = (c.members || []).find((m) => m.id === newFounderId)
      if (!newFounderMember) return c

      const updatedMembers = (c.members || []).map((m) => {
        if (m.id === newFounderId) {
          return { ...m, is_founder: true, role: "founder" as const }
        }
        if (m.is_founder) {
          return { ...m, is_founder: false, role: "member" as const }
        }
        return m
      })

      updatedCommunity = {
        ...c,
        created_by: {
          name: newFounderMember.name,
          branch: newFounderMember.branch,
          batch: newFounderMember.batch,
        },
        members: updatedMembers,
      }
      return updatedCommunity
    }
    return c
  })

  if (updatedCommunity) {
    saveStoredCommunities(updatedList)
    console.log(`👑 [COMMUNITY FOUNDERSHIP TRANSFERRED IN ${communityNameOrId}]: New Founder -> ${newFounderId}`)
  }
  return updatedCommunity
}

