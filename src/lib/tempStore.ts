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
  id?: string
}

function loadInitialProfile(): ActiveProfile | null {
  try {
    const raw = localStorage.getItem("vertex_auth_profile")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadInitialUser(): ActiveUser | null {
  try {
    const raw = localStorage.getItem("vertex_auth_user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadInitialBlocked(): Set<string> {
  try {
    const raw = localStorage.getItem("vertex_blocked_users")
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

let inMemoryProfile: ActiveProfile | null = loadInitialProfile()
let inMemoryUser: ActiveUser | null = loadInitialUser()
let inMemoryBlockedUsers: Set<string> = loadInitialBlocked()

export function extractUsername(emailOrPrefix: string): string {
  if (!emailOrPrefix) return ""
  return emailOrPrefix.split("@")[0].trim().toLowerCase()
}

export function getActiveProfile(): ActiveProfile | null {
  if (!inMemoryProfile) inMemoryProfile = loadInitialProfile()
  return inMemoryProfile
}

export function setActiveProfile(profile: ActiveProfile | null) {
  if (profile && !profile.username && inMemoryUser?.username) {
    profile.username = inMemoryUser.username
  }
  inMemoryProfile = profile
  if (profile) {
    localStorage.setItem("vertex_auth_profile", JSON.stringify(profile))
  } else {
    localStorage.removeItem("vertex_auth_profile")
  }
}

export function getActiveUser(): ActiveUser | null {
  if (!inMemoryUser) inMemoryUser = loadInitialUser()
  return inMemoryUser
}

export function setActiveUser(user: ActiveUser | null) {
  if (user && !user.username) {
    user.username = extractUsername(user.email)
  }
  inMemoryUser = user
  if (user) {
    localStorage.setItem("vertex_auth_user", JSON.stringify(user))
  } else {
    localStorage.removeItem("vertex_auth_user")
  }
}

export function getBlockedUsers(): string[] {
  return Array.from(inMemoryBlockedUsers)
}

export function blockUser(identifier: string) {
  if (!identifier) return
  inMemoryBlockedUsers.add(identifier.trim().toLowerCase())
  localStorage.setItem("vertex_blocked_users", JSON.stringify(Array.from(inMemoryBlockedUsers)))
}

export function unblockUser(identifier: string) {
  if (!identifier) return
  inMemoryBlockedUsers.delete(identifier.trim().toLowerCase())
  localStorage.setItem("vertex_blocked_users", JSON.stringify(Array.from(inMemoryBlockedUsers)))
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
