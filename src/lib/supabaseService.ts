import { supabase } from "./supabase"
import type { ActiveProfile, ActiveUser } from "./tempStore"
import { setActiveUser, setActiveProfile } from "./tempStore"

// ── PERSISTED SESSION & CACHE HELPERS ───────────────────────────────────────
const USER_CACHE_KEY = "vertex_auth_user"
const PROFILE_CACHE_KEY = "vertex_auth_profile"

export function getCachedUser(): ActiveUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedUser(user: ActiveUser | null) {
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_CACHE_KEY)
  }
  setActiveUser(user)
}

export function getCachedProfile(): ActiveProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedProfile(profile: ActiveProfile | null) {
  if (profile) {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  } else {
    localStorage.removeItem(PROFILE_CACHE_KEY)
  }
  setActiveProfile(profile)
}

// ── AUTHENTICATION ─────────────────────────────────────────────────────────

export async function signUpStudent(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      },
    },
  })

  if (error) {
    throw error
  }

  const user: ActiveUser = {
    email,
    name: username.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
    username,
    id: data.user?.id,
  }
  setCachedUser(user)
  return user
}

export async function signInStudent(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  const username = email.split("@")[0].toLowerCase()
  const user: ActiveUser = {
    email,
    name: data.user?.user_metadata?.display_name || username.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
    username,
    id: data.user?.id,
  }
  setCachedUser(user)

  // Fetch student profile from Supabase if exists
  if (data.user?.id) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle()

      if (profile) {
        setCachedProfile(profile)
      }
    } catch (err) {
      console.warn("Could not fetch remote profile on sign in:", err)
    }
  }

  return user
}

export async function signOutStudent() {
  await supabase.auth.signOut()
  setCachedUser(null)
  setCachedProfile(null)
}

// ── PROFILES TABLE CRUD ───────────────────────────────────────────────────

export async function saveStudentProfile(profileData: ActiveProfile, userId?: string) {
  setCachedProfile(profileData)

  const uid = userId || getCachedUser()?.id
  if (!uid) {
    // If no Supabase user ID yet, keep cached in localStorage
    return profileData
  }

  const payload = {
    id: uid,
    email: getCachedUser()?.email || `${profileData.username || "student"}@bmu.edu.in`,
    username: profileData.username || getCachedUser()?.username || "",
    display_name: profileData.display_name,
    bio: profileData.bio,
    branch: profileData.branch,
    batch: profileData.batch,
    avatar_url: profileData.avatar_url || null,
    instagram_url: profileData.instagram_url || null,
    linkedin_url: profileData.linkedin_url || null,
    major_club: profileData.major_club || null,
    major_sport: profileData.major_sport || null,
    minor_club: profileData.minor_club || null,
    minor_sport: profileData.minor_sport || null,
    community_club: profileData.community_club || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single()

  if (error) {
    console.error("Supabase upsert profile error:", error)
    // Non-fatal: local cache is already saved
  }

  return data || profileData
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.warn("Could not fetch profiles from Supabase, using local cache:", error)
    const cached = getCachedProfile()
    return cached ? [cached] : []
  }

  return data || []
}

// ── COMMUNITIES TABLE CRUD ────────────────────────────────────────────────

export interface SupabaseCommunity {
  id?: string
  name: string
  description: string
  image: string
  whatsapp_link: string
  instagram_link?: string
  created_by?: string
  members_count?: number
  created_at?: string
}

export async function fetchCommunitiesFromDb() {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.warn("Supabase fetch communities error:", error)
    return null
  }
  return data
}

export async function createCommunityInDb(comm: SupabaseCommunity) {
  const user = getCachedUser()
  const payload = {
    ...comm,
    created_by: user?.id || null,
    members_count: 1,
  }

  const { data, error } = await supabase
    .from("communities")
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error("Supabase create community error:", error)
    throw error
  }

  // Automatically add creator as founder member
  if (data?.id && user?.id) {
    await supabase.from("community_members").insert({
      community_id: data.id,
      user_id: user.id,
      role: "founder",
    })
  }

  return data
}

// ── ANNOUNCEMENTS TABLE CRUD ──────────────────────────────────────────────

export interface SupabaseAnnouncement {
  id?: string
  community_id: string
  author_id?: string
  title: string
  content: string
  tag?: string
  image?: string
  likes?: number
  dislikes?: number
}

export async function fetchAnnouncementsFromDb(communityId: string) {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })

  if (error) {
    console.warn("Supabase fetch announcements error:", error)
    return null
  }
  return data
}

export async function postAnnouncementToDb(ann: SupabaseAnnouncement) {
  const user = getCachedUser()
  const payload = {
    ...ann,
    author_id: user?.id || null,
    likes: 0,
    dislikes: 0,
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error("Supabase post announcement error:", error)
    throw error
  }
  return data
}
