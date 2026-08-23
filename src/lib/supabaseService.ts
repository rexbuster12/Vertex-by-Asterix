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

export function compressImage(
  file: File,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.8
): Promise<{ file: File; base64: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return resolve({ file, base64: e.target?.result as string })
        }
        ctx.drawImage(img, 0, 0, width, height)

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
              })
              resolve({ file: compressedFile, base64: compressedBase64 })
            } else {
              resolve({ file, base64: compressedBase64 })
            }
          },
          "image/jpeg",
          quality
        )
      }
      img.onerror = () => resolve({ file, base64: e.target?.result as string })
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve({ file, base64: "" })
    reader.readAsDataURL(file)
  })
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
  try {
    const { file: compressedFile, base64: compressedBase64 } = await compressImage(file, 320, 320, 0.8)

    // Try Supabase Storage upload
    const fileExt = "jpg"
    const fileName = `${filenamePrefix || "avatar"}_${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, compressedFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpeg",
      })

    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path)

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl
      }
    }

    // Fallback to small 25KB compressed Base64
    return compressedBase64
  } catch (err) {
    console.warn("Avatar processing fallback:", err)
    return fileToBase64(file)
  }
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

  let studentProfile: ActiveProfile | null = null

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
      studentProfile = profile
    }
  } catch (err) {
    console.warn("Could not fetch remote profile on sign in:", err)
  }

  return { user, profile: studentProfile }
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

  // 1. If no UID yet, check Supabase auth session
  if (!uid) {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user?.id) {
        uid = authData.user.id
      }
    } catch (e) {
      console.warn("Could not retrieve auth user id:", e)
    }
  }

  const cleanEmail = getCachedUser()?.email?.toLowerCase() || `${profileData.username || "student"}@bmu.edu.in`
  const cleanUsername = profileData.username || getCachedUser()?.username || cleanEmail.split("@")[0]

  // 2. If still no UID, lookup existing profile by email
  if (!uid) {
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle()
      if (existing?.id) {
        uid = existing.id
      }
    } catch (e) {
      console.warn("Could not lookup profile id by email:", e)
    }
  }

  // 3. If still no UID, generate a deterministic/standard UUID
  if (!uid) {
    uid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined
  }

  const payload: Record<string, unknown> = {
    email: cleanEmail,
    username: cleanUsername,
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

  if (uid) {
    payload.id = uid
  }

  try {
    // Attempt upsert by email first
    const { data: byEmailData, error: byEmailErr } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "email" })
      .select()
      .single()

    if (!byEmailErr && byEmailData) {
      console.log("✅ [PROFILE SUCCESSFULLY PERSISTED IN SUPABASE]:", byEmailData)
      setCachedProfile(byEmailData)
      return byEmailData
    }

    // Fallback attempt upsert by id
    if (uid) {
      const { data: byIdData, error: byIdErr } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single()

      if (!byIdErr && byIdData) {
        console.log("✅ [PROFILE SUCCESSFULLY PERSISTED IN SUPABASE VIA ID]:", byIdData)
        setCachedProfile(byIdData)
        return byIdData
      } else if (byIdErr) {
        console.error("❌ Supabase profile upsert error:", byIdErr.message, byIdErr.details)
      }
    }
  } catch (err) {
    console.error("❌ Supabase profile unexpected exception:", err)
  }

  return profileData
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
