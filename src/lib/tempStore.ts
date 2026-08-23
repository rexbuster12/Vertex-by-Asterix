export interface ActiveProfile {
  display_name: string
  username?: string
  bio: string
  branch: string
  batch: string
  avatar_url: string
  instagram_url: string
  linkedin_url: string
  major_club?: string
  major_sport?: string
  minor_club?: string
  minor_sport?: string
  community_club?: string
}

export interface ActiveUser {
  email: string
  name: string
  username: string
}

let inMemoryProfile: ActiveProfile | null = null
let inMemoryUser: ActiveUser | null = null

export function extractUsername(emailOrPrefix: string): string {
  if (!emailOrPrefix) return ""
  return emailOrPrefix.split("@")[0].trim().toLowerCase()
}

export function getActiveProfile(): ActiveProfile | null {
  return inMemoryProfile
}

export function setActiveProfile(profile: ActiveProfile | null) {
  if (profile && !profile.username && inMemoryUser?.username) {
    profile.username = inMemoryUser.username
  }
  inMemoryProfile = profile
  console.log("🚀 [TEMPORARY CONSOLE PROFILE SAVED - RESETS ON REFRESH]:", profile)
}

export function getActiveUser(): ActiveUser | null {
  return inMemoryUser
}

export function setActiveUser(user: ActiveUser | null) {
  if (user && !user.username) {
    user.username = extractUsername(user.email)
  }
  inMemoryUser = user
  console.log("🚀 [TEMPORARY CONSOLE AUTH USER (USERNAME: @" + user?.username + ") - RESETS ON REFRESH]:", user)
}

// Blocked Users in temporary console memory
let inMemoryBlockedUsers: Set<string> = new Set()

export function getBlockedUsers(): string[] {
  return Array.from(inMemoryBlockedUsers)
}

export function blockUser(identifier: string) {
  if (!identifier) return
  inMemoryBlockedUsers.add(identifier.trim().toLowerCase())
  console.log("⛔ [USER BLOCKED]:", identifier)
}

export function unblockUser(identifier: string) {
  if (!identifier) return
  inMemoryBlockedUsers.delete(identifier.trim().toLowerCase())
  console.log("🔓 [USER UNBLOCKED]:", identifier)
}

export function isUserBlocked(identifier: string): boolean {
  if (!identifier) return false
  return inMemoryBlockedUsers.has(identifier.trim().toLowerCase())
}

// Clear any old saved profiles, emails, and mock communities from browser storage
export function clearAllPersistentProfiles() {
  try {
    localStorage.removeItem("vertex_profile_v1")
    localStorage.removeItem("vertex_current_user")
    localStorage.removeItem("vertex_preview_profile")
    localStorage.removeItem("vertex_mock_communities_v1")
    sessionStorage.removeItem("vertex_profile_v1")
    sessionStorage.removeItem("vertex_current_user")
    inMemoryBlockedUsers.clear()
    console.log("🧹 [PREVIOUS PROFILES, EMAILS & COMMUNITIES CLEARED FROM STORAGE]")
  } catch (err) {
    console.warn("Could not clear storage", err)
  }
}
