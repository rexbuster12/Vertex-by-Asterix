import { supabase } from "./supabase"
import type { ActiveProfile, ActiveUser } from "./tempStore"
import { setActiveUser, setActiveProfile, getActiveProfile } from "./tempStore"

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

  if (error || !data) {
    console.warn("Supabase fetch communities error:", error)
    return null
  }

  // Fetch creator profiles to attach created_by_name
  const creatorIds = data.map((c: any) => c.created_by).filter((id: any) => id && isUUID(id))
  const profileMap = new Map<string, string>()
  if (creatorIds.length > 0) {
    try {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", creatorIds)
      if (profs) {
        profs.forEach((p) => profileMap.set(p.id, p.display_name))
      }
    } catch (e) {
      console.warn("Could not fetch creator profile names:", e)
    }
  }

  return data.map((c: any) => {
    const creatorName = c.created_by ? profileMap.get(c.created_by) || "" : ""
    return {
      ...c,
      created_by_name: creatorName,
      created_by: c.created_by
        ? { id: c.created_by, name: creatorName }
        : undefined,
    }
  })
}

export async function createCommunityInDb(comm: SupabaseCommunity) {
  const user = getCachedUser()
  const profile = getActiveProfile()

  // Resolve creator's profile UUID in Supabase
  let creatorUserId: string | null = null
  if (user?.id && isUUID(user.id)) {
    creatorUserId = user.id
  } else {
    try {
      if (profile?.display_name) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .ilike("display_name", profile.display_name.trim())
          .maybeSingle()
        if (prof?.id) creatorUserId = prof.id
      }
      if (!creatorUserId && user?.email) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email.trim())
          .maybeSingle()
        if (prof?.id) creatorUserId = prof.id
      }
    } catch (e) {
      console.warn("Could not resolve profile id for creator:", e)
    }
  }

  const payload = {
    ...comm,
    created_by: creatorUserId,
    members_count: 1,
  }

  // Cache head community name locally
  try {
    const saved = localStorage.getItem("vertex_head_community_names")
    const list: string[] = saved ? JSON.parse(saved) : []
    if (!list.includes(comm.name.trim().toLowerCase())) {
      list.push(comm.name.trim().toLowerCase())
      localStorage.setItem("vertex_head_community_names", JSON.stringify(list))
    }
  } catch { }

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
  if (data?.id && creatorUserId) {
    await supabase.from("community_members").upsert(
      {
        community_id: data.id,
        user_id: creatorUserId,
        role: "founder",
      },
      { onConflict: "community_id,user_id" }
    )
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

  let creatorInfo = {
    name: "Student Leader",
    branch: "BML Munjal University",
    batch: "Student",
    email: undefined as string | undefined,
    avatar_url: undefined as string | undefined,
    instagram_url: undefined as string | undefined,
    linkedin_url: undefined as string | undefined,
  }

  // 1. If created_by is a valid UUID, fetch creator's actual profile from Supabase
  if (comm.created_by && isUUID(comm.created_by)) {
    try {
      const { data: creator } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", comm.created_by)
        .maybeSingle()
      if (creator) {
        creatorInfo = {
          name: creator.display_name || "Student Leader",
          branch: creator.branch || "BML Munjal University",
          batch: creator.batch || "Student",
          email: creator.email,
          avatar_url: creator.avatar_url,
          instagram_url: creator.instagram_url,
          linkedin_url: creator.linkedin_url,
        }
      }
    } catch (e) {
      console.warn("Could not fetch creator info:", e)
    }
  } else {
    // 2. If created_by is missing/null, check community_members table for who joined as 'founder' or 'head'
    try {
      const { data: founderMember } = await supabase
        .from("community_members")
        .select("user_id, role")
        .eq("community_id", comm.id)
        .in("role", ["founder", "head"])
        .maybeSingle()

      if (founderMember?.user_id) {
        const { data: creator } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", founderMember.user_id)
          .maybeSingle()
        if (creator) {
          creatorInfo = {
            name: creator.display_name || "Student Leader",
            branch: creator.branch || "BML Munjal University",
            batch: creator.batch || "Student",
            email: creator.email,
            avatar_url: creator.avatar_url,
            instagram_url: creator.instagram_url,
            linkedin_url: creator.linkedin_url,
          }
        }
      }
    } catch (e) {
      console.warn("Could not find founder member:", e)
    }
  }

  // Fetch real members from community_members table
  let membersList: any[] = []
  try {
    const { data: memberRows } = await supabase
      .from("community_members")
      .select("id, user_id, role, created_at")
      .eq("community_id", comm.id)

    if (memberRows && memberRows.length > 0) {
      const userIds = memberRows.map((m) => m.user_id).filter(Boolean)
      const profileMap = new Map<string, any>()
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds)
        if (profs) {
          for (const p of profs) {
            profileMap.set(p.id, p)
          }
        }
      }

      membersList = memberRows.map((m) => {
        const p = profileMap.get(m.user_id)
        const isHeadRole = m.role === "founder" || m.role === "head"
        return {
          id: m.user_id || m.id,
          name: p?.display_name || (isHeadRole ? creatorInfo.name : "Student Member"),
          branch: p?.branch || (isHeadRole ? creatorInfo.branch : "BML Munjal University"),
          batch: p?.batch || (isHeadRole ? creatorInfo.batch : "Student"),
          avatar_url: p?.avatar_url || (isHeadRole ? creatorInfo.avatar_url : undefined),
          instagram_url: p?.instagram_url || undefined,
          linkedin_url: p?.linkedin_url || undefined,
          is_founder: isHeadRole,
          is_head: isHeadRole,
          role: isHeadRole ? "head" : m.role || "member",
        }
      })
    }
  } catch (err) {
    console.warn("Could not load community members from DB:", err)
  }

  // Ensure Head is included as first member
  const hasHead = membersList.some((m) => m.is_head || m.is_founder)
  if (!hasHead) {
    membersList.unshift({
      id: comm.created_by || "head",
      name: creatorInfo.name,
      branch: creatorInfo.branch,
      batch: creatorInfo.batch,
      avatar_url: creatorInfo.avatar_url,
      instagram_url: creatorInfo.instagram_url,
      linkedin_url: creatorInfo.linkedin_url,
      is_founder: true,
      is_head: true,
      role: "head" as const,
    })
  }

  const finalMemberCount = Math.max(comm.members_count || 1, membersList.length)

  return {
    id: comm.id,
    name: comm.name,
    description: comm.description,
    members_count: finalMemberCount,
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
    members: membersList,
  }
}

export async function joinCommunityInDb(
  communityIdOrName: string
): Promise<{ success: boolean; members_count?: number }> {
  const user = getCachedUser()
  const clean = decodeURIComponent(communityIdOrName).trim()

  try {
    let commId = clean
    let currentMembersCount = 1
    if (!isUUID(clean)) {
      const { data: comm } = await supabase
        .from("communities")
        .select("id, members_count")
        .ilike("name", clean)
        .maybeSingle()
      if (comm?.id) {
        commId = comm.id
        currentMembersCount = comm.members_count || 1
      }
    }

    // Resolve user's profile UUID in Supabase
    const profile = getActiveProfile()
    let memberUserId: string | null = null
    if (user?.id && isUUID(user.id)) {
      memberUserId = user.id
    } else {
      try {
        if (profile?.display_name) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .ilike("display_name", profile.display_name.trim())
            .maybeSingle()
          if (prof?.id) memberUserId = prof.id
        }
        if (!memberUserId && user?.email) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", user.email.trim())
            .maybeSingle()
          if (prof?.id) memberUserId = prof.id
        }
      } catch (e) {
        console.warn("Could not resolve profile ID for join:", e)
      }
    }

    // Insert into community_members table
    if (isUUID(commId) && memberUserId) {
      await supabase.from("community_members").upsert(
        {
          community_id: commId,
          user_id: memberUserId,
          role: "member",
        },
        { onConflict: "community_id,user_id" }
      )
    }

    // Update members_count in communities table
    const nextCount = currentMembersCount + 1
    if (isUUID(commId)) {
      await supabase
        .from("communities")
        .update({ members_count: nextCount })
        .eq("id", commId)
    } else {
      await supabase
        .from("communities")
        .update({ members_count: nextCount })
        .ilike("name", clean)
    }

    // Cache locally
    const saved = localStorage.getItem("vertex_joined_community_names")
    const list: string[] = saved ? JSON.parse(saved) : []
    if (!list.includes(clean.toLowerCase())) {
      list.push(clean.toLowerCase())
      localStorage.setItem("vertex_joined_community_names", JSON.stringify(list))
    }

    return { success: true, members_count: nextCount }
  } catch (err) {
    console.warn("Supabase join community notice:", err)
    return { success: true }
  }
}

export async function leaveCommunityInDb(
  communityIdOrName: string
): Promise<{ success: boolean; members_count?: number }> {
  const user = getCachedUser()
  const clean = decodeURIComponent(communityIdOrName).trim()

  try {
    let commId = clean
    let currentMembersCount = 1
    if (!isUUID(clean)) {
      const { data: comm } = await supabase
        .from("communities")
        .select("id, members_count")
        .ilike("name", clean)
        .maybeSingle()
      if (comm?.id) {
        commId = comm.id
        currentMembersCount = comm.members_count || 1
      }
    }

    const profile = getActiveProfile()
    let memberUserId: string | null = null
    if (user?.id && isUUID(user.id)) {
      memberUserId = user.id
    } else {
      try {
        if (profile?.display_name) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .ilike("display_name", profile.display_name.trim())
            .maybeSingle()
          if (prof?.id) memberUserId = prof.id
        }
        if (!memberUserId && user?.email) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", user.email.trim())
            .maybeSingle()
          if (prof?.id) memberUserId = prof.id
        }
      } catch (e) {
        console.warn("Could not resolve profile ID for leave:", e)
      }
    }

    // Delete from community_members table
    if (isUUID(commId) && memberUserId) {
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", commId)
        .eq("user_id", memberUserId)
    }

    // Update members_count in communities table
    const nextCount = Math.max(1, currentMembersCount - 1)
    if (isUUID(commId)) {
      await supabase
        .from("communities")
        .update({ members_count: nextCount })
        .eq("id", commId)
    } else {
      await supabase
        .from("communities")
        .update({ members_count: nextCount })
        .ilike("name", clean)
    }

    // Remove from local cache
    const saved = localStorage.getItem("vertex_joined_community_names")
    if (saved) {
      const list: string[] = JSON.parse(saved)
      const filtered = list.filter((k) => k !== clean.toLowerCase())
      localStorage.setItem("vertex_joined_community_names", JSON.stringify(filtered))
    }

    return { success: true, members_count: nextCount }
  } catch (err) {
    console.warn("Supabase leave community notice:", err)
    return { success: true }
  }
}

export async function fetchUserJoinedCommunityNames(): Promise<string[]> {
  const user = getCachedUser()
  const profile = getActiveProfile()
  const names = new Set<string>()

  try {
    const saved = localStorage.getItem("vertex_joined_community_names")
    if (saved) {
      const list: string[] = JSON.parse(saved)
      list.forEach((n) => names.add(n.toLowerCase()))
    }
  } catch { }

  let currentProfileId: string | null = null
  if (user?.id && isUUID(user.id)) {
    currentProfileId = user.id
  } else {
    try {
      if (profile?.display_name) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .ilike("display_name", profile.display_name.trim())
          .maybeSingle()
        if (prof?.id) currentProfileId = prof.id
      }
      if (!currentProfileId && user?.email) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email.trim())
          .maybeSingle()
        if (prof?.id) currentProfileId = prof.id
      }
    } catch { }
  }

  if (currentProfileId) {
    try {
      const { data: memberRows } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", currentProfileId)

      if (memberRows && memberRows.length > 0) {
        const commIds = memberRows.map((r: any) => r.community_id).filter(Boolean)
        if (commIds.length > 0) {
          const { data: comms } = await supabase
            .from("communities")
            .select("id, name")
            .in("id", commIds)

          if (comms) {
            for (const c of comms) {
              if (c.name) names.add(c.name.trim().toLowerCase())
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch user joined communities:", e)
    }
  }

  return Array.from(names)
}

export async function fetchUserHeadCommunityNames(): Promise<string[]> {
  const user = getCachedUser()
  const profile = getActiveProfile()
  const names = new Set<string>()

  // 1. Check local storage cache
  try {
    const saved = localStorage.getItem("vertex_head_community_names")
    if (saved) {
      const list: string[] = JSON.parse(saved)
      list.forEach((n) => names.add(n.toLowerCase()))
    }
  } catch { }

  // 2. Check local mockStore communities where created_by matches active user or profile
  try {
    const rawLocal = localStorage.getItem("vertex_mock_communities")
    if (rawLocal) {
      const localList = JSON.parse(rawLocal)
      if (Array.isArray(localList)) {
        localList.forEach((c: any) => {
          if (
            (profile?.display_name && c.created_by?.name && c.created_by.name.trim().toLowerCase() === profile.display_name.trim().toLowerCase()) ||
            (user?.id && c.created_by && c.created_by === user.id) ||
            (user?.name && c.created_by?.name && c.created_by.name.trim().toLowerCase() === user.name.trim().toLowerCase())
          ) {
            names.add(c.name.trim().toLowerCase())
          }
        })
      }
    }
  } catch { }

  // Resolve user's profile UUID in Supabase
  let currentProfileId: string | null = null
  if (user?.id && isUUID(user.id)) {
    currentProfileId = user.id
  } else {
    try {
      if (profile?.display_name) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .ilike("display_name", profile.display_name.trim())
          .maybeSingle()
        if (prof?.id) currentProfileId = prof.id
      }
      if (!currentProfileId && user?.email) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email.trim())
          .maybeSingle()
        if (prof?.id) currentProfileId = prof.id
      }
    } catch { }
  }

  // 3. Check Supabase community_members table for role in ('founder', 'head')
  if (currentProfileId) {
    try {
      const { data: headRows } = await supabase
        .from("community_members")
        .select("community_id, communities(name)")
        .eq("user_id", currentProfileId)
        .in("role", ["founder", "head"])

      if (headRows) {
        for (const row of headRows as any[]) {
          if (row.communities?.name) {
            names.add(row.communities.name.trim().toLowerCase())
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch user head communities from members:", e)
    }

    // 4. Check Supabase communities table for created_by == currentProfileId
    try {
      const { data: createdComms } = await supabase
        .from("communities")
        .select("name")
        .eq("created_by", currentProfileId)

      if (createdComms) {
        for (const c of createdComms) {
          if (c.name) names.add(c.name.trim().toLowerCase())
        }
      }
    } catch (e) {
      console.warn("Could not fetch user created communities:", e)
    }
  }

  return Array.from(names)
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

export interface ReportPayload {
  target_type: "profile" | "community"
  target_id: string
  target_name: string
  reason: string
  details?: string
}

export async function submitReportToDb(
  report: ReportPayload
): Promise<{ success: boolean; error?: string }> {
  const user = getCachedUser()
  const profile = getActiveProfile()
  const reporterId = user?.id || null
  const reporterName = profile?.display_name || user?.name || "Anonymous Student"
  const reporterEmail = user?.email || undefined

  const payload = {
    target_type: report.target_type,
    target_id: report.target_id,
    target_name: report.target_name,
    reason: report.reason,
    details: report.details || "",
    reporter_id: reporterId,
    reporter_name: reporterName,
    reporter_email: reporterEmail,
    status: "pending",
    created_at: new Date().toISOString(),
  }

  // 1. Save locally in resilient audit cache
  try {
    const existingRaw = localStorage.getItem("vertex_reports_log")
    const existing = existingRaw ? JSON.parse(existingRaw) : []
    existing.unshift({ id: `rep-${Date.now()}`, ...payload })
    localStorage.setItem("vertex_reports_log", JSON.stringify(existing.slice(0, 50)))
    console.log("🛡️ [REPORT LOGGED LOCALLY]:", payload)
  } catch (e) {
    console.warn("Local report log notice:", e)
  }

  // 2. Persist to Supabase reports table
  try {
    const { error } = await supabase.from("reports").insert(payload)
    if (error) {
      console.warn("Supabase insert report table notice (persisted to resilient audit log):", error.message)
    } else {
      console.log("🛡️ [REPORT SAVED TO DATABASE HANDLER]:", payload.target_name)
    }
    return { success: true }
  } catch (err: any) {
    console.warn("Supabase report submission notice:", err)
    return { success: true }
  }
}

