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

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export async function uploadAvatarImage(file: File, filenamePrefix?: string): Promise<string> {
  // 1. Convert to Base64 so it can be rendered instantly and survive refreshes
  const base64Url = await fileToBase64(file)
  
  // 2. Also try uploading to Supabase Storage 'avatars' bucket
  try {
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${filenamePrefix || 'avatar'}_${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)
      
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl
      }
    }
  } catch (err) {
    console.warn("Supabase storage upload notice:", err)
  }

  return base64Url
}

// ── AUTHENTICATION ─────────────────────────────────────────────────────────

export async function signUpStudent(email: string, password: string, username: string) {
  const cleanEmail = email.trim().toLowerCase()
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
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
    email: cleanEmail,
    name: username.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
    username,
    id: data.user?.id,
  }
  setCachedUser(user)
  return user
}

export async function signInStudent(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  })

  if (error) {
    throw error
  }

  const username = cleanEmail.split("@")[0].toLowerCase()
  const user: ActiveUser = {
    email: cleanEmail,
    name: data.user?.user_metadata?.display_name || username.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
    username,
    id: data.user?.id,
  }
  setCachedUser(user)

  // Fetch student profile from Supabase by user.id OR email
  try {
    let query = supabase.from("profiles").select("*")
    if (data.user?.id) {
      query = query.or(`id.eq.${data.user.id},email.eq.${cleanEmail}`)
    } else {
      query = query.eq("email", cleanEmail)
    }

    const { data: profile, error: profileErr } = await query.maybeSingle()

    if (profile && !profileErr) {
      console.log("📥 [PROFILE RESTORED FROM SUPABASE FOR @" + username + "]:", profile)
      setCachedProfile(profile)
    }
  } catch (err) {
    console.warn("Could not fetch remote profile on sign in:", err)
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

  let uid = userId || getCachedUser()?.id

  // If no UID yet, check Supabase auth session
  if (!uid) {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user?.id) {
      uid = authData.user.id
      const currentUser = getCachedUser()
      if (currentUser) {
        setCachedUser({ ...currentUser, id: uid })
      }
    }
  }

  if (!uid) {
    return profileData
  }

  const cleanEmail = getCachedUser()?.email?.toLowerCase() || `${profileData.username || "student"}@bmu.edu.in`

  const payload = {
    id: uid,
    email: cleanEmail,
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
    console.warn("Supabase upsert profile notice:", error)
  } else if (data) {
    console.log("💾 [PROFILE PERSISTED TO SUPABASE DATABASE]:", data)
    setCachedProfile(data)
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
