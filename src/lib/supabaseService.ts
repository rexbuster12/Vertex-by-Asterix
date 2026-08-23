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

  // Fetch student profile from Supabase by cleanEmail (and fallback to username)
  try {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle()

    if (profile && !profileErr) {
      console.log("📥 [PROFILE RESTORED FROM SUPABASE FOR @" + username + "]:", profile)
      setCachedProfile(profile)
      studentProfile = profile
    } else {
      // Fallback by username
      const { data: profileByUsername } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle()
      if (profileByUsername) {
        console.log("📥 [PROFILE RESTORED BY USERNAME FOR @" + username + "]:", profileByUsername)
        setCachedProfile(profileByUsername)
        studentProfile = profileByUsername
      }
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

export function isUUID(str: string): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str.trim())
}

export async function deleteCommunityInDb(communityIdOrName: string) {
  const clean = decodeURIComponent(communityIdOrName).trim()
  try {
    if (isUUID(clean)) {
      await supabase.from("communities").delete().eq("id", clean)
    } else {
      await supabase.from("communities").delete().ilike("name", clean)
    }
  } catch (err) {
    console.warn("Supabase delete community notice:", err)
  }
}

async function formatCommunityPayload(comm: any) {
  // Fetch announcements for this community
  const { data: annList } = await supabase
    .from("announcements")
    .select("*")
    .eq("community_id", comm.id)
    .order("created_at", { ascending: false })

  // Fetch founder profile if available
  let creatorInfo = {
    name: "Student Leader",
    branch: "BML Munjal University",
    batch: "Student",
    email: undefined as string | undefined,
  }

  if (comm.created_by && isUUID(comm.created_by)) {
    try {
      const { data: creator } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", comm.created_by)
        .maybeSingle()
      if (creator) {
        creatorInfo = {
          name: creator.display_name,
          branch: creator.branch,
          batch: creator.batch,
          email: creator.email,
        }
      }
    } catch (e) {
      console.warn("Could not fetch creator info:", e)
    }
  }

  return {
    id: comm.id,
    name: comm.name,
    description: comm.description,
    members_count: comm.members_count || 1,
    whatsapp_link: comm.whatsapp_link,
    instagram_link: comm.instagram_link,
    image: comm.image || "/default-banner.jpg",
    created_at: comm.created_at || new Date().toISOString(),
    created_by: creatorInfo,
    announcements: (annList || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      date: a.created_at
        ? new Date(a.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Today",
      author: creatorInfo.name,
      tag: a.tag || "NOTICE",
      image: a.image,
      likes: a.likes || 0,
      dislikes: a.dislikes || 0,
    })),
    members: [
      {
        id: comm.created_by || "founder",
        name: creatorInfo.name,
        branch: creatorInfo.branch,
        batch: creatorInfo.batch,
        is_founder: true,
        role: "founder" as const,
      },
    ],
  }
}

export async function fetchCommunityDetailFromDb(nameOrId: string) {
  const clean = decodeURIComponent(nameOrId).trim()
  if (!clean) return null

  try {
    // 1. If UUID, query strictly by id
    if (isUUID(clean)) {
      const { data: commById } = await supabase
        .from("communities")
        .select("*")
        .eq("id", clean)
        .maybeSingle()
      if (commById) return await formatCommunityPayload(commById)
    }

    // 2. Query by case-insensitive name
    const { data: commByName, error: errName } = await supabase
      .from("communities")
      .select("*")
      .ilike("name", clean)
      .maybeSingle()

    if (!errName && commByName) {
      return await formatCommunityPayload(commByName)
    }

    // 3. Fallback: Exact name match
    const { data: commExact } = await supabase
      .from("communities")
      .select("*")
      .eq("name", clean)
      .maybeSingle()

    if (commExact) {
      return await formatCommunityPayload(commExact)
    }

    // 4. Fallback: Check with or without " Community" suffix
    const alt = clean.toLowerCase().endsWith(" community")
      ? clean.slice(0, -10).trim()
      : `${clean} Community`

    const { data: commAlt } = await supabase
      .from("communities")
      .select("*")
      .ilike("name", alt)
      .maybeSingle()

    if (commAlt) {
      return await formatCommunityPayload(commAlt)
    }

    // 5. Ultimate Fallback: Fetch all and find in memory
    const { data: allComms } = await supabase.from("communities").select("*")
    if (allComms && allComms.length > 0) {
      const match = allComms.find(
        (c: any) =>
          c.name.toLowerCase() === clean.toLowerCase() ||
          c.name.toLowerCase().includes(clean.toLowerCase()) ||
          clean.toLowerCase().includes(c.name.toLowerCase())
      )
      if (match) {
        return await formatCommunityPayload(match)
      }
    }
  } catch (err) {
    console.error("Supabase fetch community detail error:", err)
  }

  return null
}

export async function deleteAnnouncementInDb(id: string) {
  try {
    await supabase.from("announcements").delete().eq("id", id)
  } catch (err) {
    console.warn("Supabase delete announcement error:", err)
  }
}
