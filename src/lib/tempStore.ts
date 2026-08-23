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

// ── CONNECTION REQUESTS & TWO-WAY CONNECTIONS ────────────────────────────────

export interface ConnectionRequest {
  id: string
  fromName: string
  fromBranch?: string
  fromBatch?: string
  fromAvatar?: string
  toName: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
}

function loadAllConnectionRequests(): ConnectionRequest[] {
  try {
    const raw = localStorage.getItem("vertex_connection_requests_v2")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAllConnectionRequests(list: ConnectionRequest[]) {
  try {
    localStorage.setItem("vertex_connection_requests_v2", JSON.stringify(list))
  } catch { }
}

function loadAllTwoWayConnections(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem("vertex_two_way_connections_v2")
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAllTwoWayConnections(map: Record<string, string[]>) {
  try {
    localStorage.setItem("vertex_two_way_connections_v2", JSON.stringify(map))
  } catch { }
}

export function areUsersConnected(userA: string, userB: string): boolean {
  if (!userA || !userB) return false
  const keyA = userA.trim().toLowerCase()
  const keyB = userB.trim().toLowerCase()
  const map = loadAllTwoWayConnections()
  const listA = map[keyA] || []
  return listA.includes(keyB)
}

export type UserConnectionStatus = "connected" | "request_sent" | "request_received" | "none"

export function getConnectionStatus(
  currentUserName: string,
  targetStudentName: string
): { status: UserConnectionStatus; requestId?: string } {
  if (!currentUserName || !targetStudentName) return { status: "none" }
  if (currentUserName.trim().toLowerCase() === targetStudentName.trim().toLowerCase()) {
    return { status: "none" }
  }

  if (areUsersConnected(currentUserName, targetStudentName)) {
    return { status: "connected" }
  }

  const keyCurrent = currentUserName.trim().toLowerCase()
  const keyTarget = targetStudentName.trim().toLowerCase()
  const allRequests = loadAllConnectionRequests()

  // 1. Check if target student sent request to current user
  const incoming = allRequests.find(
    (r) =>
      r.status === "pending" &&
      r.fromName.trim().toLowerCase() === keyTarget &&
      r.toName.trim().toLowerCase() === keyCurrent
  )
  if (incoming) {
    return { status: "request_received", requestId: incoming.id }
  }

  // 2. Check if current user sent request to target student
  const outgoing = allRequests.find(
    (r) =>
      r.status === "pending" &&
      r.fromName.trim().toLowerCase() === keyCurrent &&
      r.toName.trim().toLowerCase() === keyTarget
  )
  if (outgoing) {
    return { status: "request_sent", requestId: outgoing.id }
  }

  return { status: "none" }
}

export function getIncomingConnectionRequests(currentUserName: string): ConnectionRequest[] {
  if (!currentUserName) return []
  const keyCurrent = currentUserName.trim().toLowerCase()
  const allRequests = loadAllConnectionRequests()
  return allRequests.filter(
    (r) => r.status === "pending" && r.toName.trim().toLowerCase() === keyCurrent
  )
}

export function getConnectedStudentNames(currentUserName: string): string[] {
  if (!currentUserName) return []
  const keyCurrent = currentUserName.trim().toLowerCase()
  const map = loadAllTwoWayConnections()
  return map[keyCurrent] || []
}

export function sendConnectionRequest(
  fromName: string,
  toName: string,
  fromInfo?: { branch?: string; batch?: string; avatar?: string }
): ConnectionRequest {
  const all = loadAllConnectionRequests()
  const newReq: ConnectionRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fromName: fromName.trim(),
    fromBranch: fromInfo?.branch,
    fromBatch: fromInfo?.batch,
    fromAvatar: fromInfo?.avatar,
    toName: toName.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  const filtered = all.filter(
    (r) =>
      !(
        r.fromName.trim().toLowerCase() === fromName.trim().toLowerCase() &&
        r.toName.trim().toLowerCase() === toName.trim().toLowerCase()
      )
  )
  saveAllConnectionRequests([newReq, ...filtered])
  return newReq
}

export function acceptConnectionRequest(requestId: string): boolean {
  const all = loadAllConnectionRequests()
  const targetReq = all.find((r) => r.id === requestId)
  if (!targetReq) return false

  targetReq.status = "accepted"
  saveAllConnectionRequests(all)

  // Establish two-way connection
  const keyA = targetReq.fromName.trim().toLowerCase()
  const keyB = targetReq.toName.trim().toLowerCase()
  const map = loadAllTwoWayConnections()

  const listA = new Set(map[keyA] || [])
  listA.add(keyB)
  map[keyA] = Array.from(listA)

  const listB = new Set(map[keyB] || [])
  listB.add(keyA)
  map[keyB] = Array.from(listB)

  saveAllTwoWayConnections(map)
  return true
}

export function declineConnectionRequest(requestId: string): boolean {
  const all = loadAllConnectionRequests()
  const targetReq = all.find((r) => r.id === requestId)
  if (!targetReq) return false

  targetReq.status = "declined"
  saveAllConnectionRequests(all.filter((r) => r.id !== requestId))
  return true
}

export function disconnectUsers(userA: string, userB: string) {
  if (!userA || !userB) return
  const keyA = userA.trim().toLowerCase()
  const keyB = userB.trim().toLowerCase()
  const map = loadAllTwoWayConnections()

  if (map[keyA]) {
    map[keyA] = map[keyA].filter((k) => k !== keyB)
  }
  if (map[keyB]) {
    map[keyB] = map[keyB].filter((k) => k !== keyA)
  }
  saveAllTwoWayConnections(map)
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
