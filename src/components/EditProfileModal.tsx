import { useState, useRef, useEffect } from "react"
import { screenFields, validateInstagramLink, validateLinkedInLink } from "../lib/contentFilter"
import { COMMUNITY_CLUBS, MAJOR_CLUBS, MINOR_CLUBS } from "../lib/clubsData"
import { uploadAvatarImage } from "../lib/supabaseService"
import { getActiveUser, extractFirstNameFromBmuEmail } from "../lib/tempStore"
import { ShieldCheck } from "lucide-react"

export type ProfileData = {
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

type Props = {
  initialData: ProfileData
  onSave: (data: ProfileData) => void
  onClose: () => void
}

const BRANCHES = [
  "B.Tech CSE",
  "B.Tech AI & DS",
  "B.Tech ECE",
  "B.Tech ME",
  "B.Tech CE",
  "B.Tech EE",
  "B.Tech IT",
  "B.Com",
  "BBA",
  "MBA",
  "LLB",
  "LLM",
  "B.Des",
  "B.Sc",
  "M.Sc",
  "MCA",
  "Ph. D.",
  "Other",
]

const BATCHES = [
  "2023–2027", "2024–2028", "2025–2029", "2026–2030",
  "2027–2031", "2028–2032",
]

export default function EditProfileModal({ initialData, onSave, onClose }: Props) {
  const user = getActiveUser()
  const compulsoryFirstName = extractFirstNameFromBmuEmail(user?.email || user?.username || initialData.username || "")
  const [middleAndLastName, setMiddleAndLastName] = useState(() =>
    initialData.display_name.replace(new RegExp(`^${compulsoryFirstName}\\s*`, "i"), "")
  )
  const [form, setForm] = useState<ProfileData>({ ...initialData })
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData.avatar_url)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  function handleField(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be under 5 MB.")
      return
    }
    try {
      const user = getActiveUser()
      const permanentUrl = await uploadAvatarImage(file, user?.username || "student")
      setAvatarPreview(permanentUrl)
      setForm((prev) => ({ ...prev, avatar_url: permanentUrl }))
      setError(null)
    } catch (err) {
      console.warn("Avatar upload notice:", err)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!avatarPreview && !form.avatar_url) {
      setError("A profile photo is required to complete your student badge.")
      return
    }

    const finalDisplayName = `${compulsoryFirstName} ${middleAndLastName.trim()}`.trim()
    if (!finalDisplayName) {
      setError("Student name is required.")
      return
    }

    const screenResult = screenFields([
      { label: "display name", value: finalDisplayName },
      { label: "bio", value: form.bio },
    ])
    if (!screenResult.ok) {
      setError(screenResult.reason!)
      return
    }

    const igCheck = validateInstagramLink(form.instagram_url)
    if (!igCheck.ok) { setError(igCheck.reason!); return }
    const liCheck = validateLinkedInLink(form.linkedin_url)
    if (!liCheck.ok) { setError(liCheck.reason!); return }

    setSaving(true)

    try {
      const finalAvatarUrl = avatarPreview || form.avatar_url
      const saved: ProfileData = { ...form, display_name: finalDisplayName, avatar_url: finalAvatarUrl }
      onSave(saved)
    } catch (err: any) {
      setError(err.message || "Failed to save student profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#141c2b]/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-[#faf7f2] border-t-2 sm:border-2 border-[#141c2b] rounded-t-xl sm:rounded-lg shadow-[6px_6px_0px_#141c2b] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#141c2b] bg-[#faf7f2] shrink-0">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase tracking-wider block">
              STUDENT PROFILE // EDIT
            </span>
            <h2 className="font-serif text-xl font-black text-[#141c2b]">
              Edit Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border-2 border-[#141c2b] bg-[#eae2d5] hover:bg-[#d84c23] hover:text-white rounded-xs font-mono font-bold text-sm transition-colors cursor-pointer shadow-[1px_1px_0px_#141c2b]"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#fbe8e6] border-2 border-[#d84c23] font-mono text-xs text-[#d84c23] font-bold rounded-xs shadow-[2px_2px_0px_#d84c23]">
              ⚠ {error}
            </div>
          )}

          {/* Section: Profile Info */}
          <div className="space-y-3">
            {/* Avatar Picker */}
            <div className="flex items-center gap-4 pb-3 border-b border-[#d8cebe]">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-xs bg-[#eae2d5] border-2 border-[#141c2b] overflow-hidden flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#141c2b] group hover:border-[#d84c23] transition-colors shrink-0"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif font-black text-xl text-[#141c2b]">
                    {initialData.display_name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#eae2d5] hover:bg-[#141c2b] hover:text-white border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#141c2b] cursor-pointer"
              >
                {avatarPreview ? "Upload new photo" : "Upload Badge Photo *"}
              </button>
            </div>

            {/* Display Name — Compulsory First Name Locked */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-mono text-xs font-bold uppercase text-[#141c2b]">
                  Student Name <span className="text-[#d84c23]">*</span>
                </label>
                <span className="font-mono text-[10px] font-bold text-[#545e6d] uppercase bg-[#eae2d5] px-2 py-0.5 border border-[#141c2b] rounded-2xs flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#d84c23]" /> First Name Verified
                </span>
              </div>

              <div className="flex items-center bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] overflow-hidden focus-within:ring-2 focus-within:ring-[#141c2b]">
                <div
                  className="flex items-center gap-1 px-3 py-2 bg-[#eae2d5] border-r-2 border-[#141c2b] text-sm font-bold text-[#141c2b] select-none shrink-0"
                  title="First name is permanently locked to your verified BMU student ID"
                >
                  <span>{compulsoryFirstName}</span>
                </div>
                <input
                  type="text"
                  maxLength={40}
                  value={middleAndLastName}
                  onChange={(e) => setMiddleAndLastName(e.target.value)}
                  placeholder="Middle & Last Name (e.g. Meshram)"
                  className="w-full px-3 py-2 bg-transparent text-sm text-[#141c2b] font-medium focus:outline-none"
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-[#545e6d]">
                Full Name: <strong className="text-[#141c2b]">{compulsoryFirstName} {middleAndLastName.trim()}</strong>
              </p>
            </div>        
          </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                <label>Bio / Campus Side Quests</label>
                <span className="text-[#8892a0]">{form.bio.length}/160</span>
              </div>
              <textarea
                maxLength={160}
                rows={3}
                value={form.bio}
                onChange={(e) => handleField("bio", e.target.value)}
                placeholder="What are you building, researching, or playing on campus?"
                className="w-full px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] font-medium focus:outline-none shadow-[2px_2px_0px_#141c2b] resize-none"
              />
            </div>

            {/* Branch & Batch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                  Branch
                </label>
                <select
                  value={form.branch}
                  onChange={(e) => handleField("branch", e.target.value)}
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                  Batch Year
                </label>
                <select
                  value={form.batch}
                  onChange={(e) => handleField("batch", e.target.value)}
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
                >
                  <option value="">Select batch</option>
                  {BATCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clubs & Sports Affiliations */}
            <div className="pt-2 border-t border-[#d8cebe] space-y-3">
              <span className="font-mono text-xs font-bold uppercase text-[#141c2b] block">
                Clubs & Sports Affiliations (Optional)
              </span>

              {/* Major Club / Sport */}
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                  Major Club / Sport
                </label>
                <select
                  value={form.major_club || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((prev) => ({
                      ...prev,
                      major_club: val,
                      major_sport: val === "Sports" ? prev.major_sport : undefined,
                      minor_club: prev.minor_club === val ? undefined : prev.minor_club,
                      minor_sport: prev.minor_club === val ? undefined : prev.minor_sport,
                    }))
                  }}
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none cursor-pointer"
                >
                  <option value="">-- None / Select Major Club --</option>
                  {MAJOR_CLUBS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {form.major_club === "Sports" && (
                  <input
                    type="text"
                    value={form.major_sport || ""}
                    onChange={(e) => handleField("major_sport", e.target.value)}
                    placeholder="Specify your major sport (e.g. Football, Cricket, Badminton)"
                    className="w-full mt-2 px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none"
                  />
                )}
              </div>

              {/* Minor Club / Sport */}
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                  Minor Club / Sport
                </label>
                <select
                  value={form.minor_club || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((prev) => ({
                      ...prev,
                      minor_club: val,
                      minor_sport: val === "Sports" ? prev.minor_sport : undefined,
                    }))
                  }}
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none cursor-pointer"
                >
                  <option value="">-- None / Select Minor Club --</option>
                  {MINOR_CLUBS.filter((c) => !form.major_club || c !== form.major_club).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {form.minor_club === "Sports" && (
                  <input
                    type="text"
                    value={form.minor_sport || ""}
                    onChange={(e) => handleField("minor_sport", e.target.value)}
                    placeholder="Specify your minor sport (e.g. Table Tennis, Chess, Swimming)"
                    className="w-full mt-2 px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none"
                  />
                )}
              </div>

              {/* Community Club (Exclusively 3 Welfare Clubs) */}
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                  Community Club
                </label>
                <select
                  value={form.community_club || ""}
                  onChange={(e) => handleField("community_club", e.target.value)}
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none cursor-pointer"
                >
                  <option value="">-- None / Select Community Club --</option>
                  {COMMUNITY_CLUBS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2 border-t border-[#d8cebe] space-y-3">
              <span className="font-mono text-xs font-bold uppercase text-[#141c2b] block">
                Social Profiles
              </span>

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={form.instagram_url}
                  onChange={(e) => handleField("instagram_url", e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => handleField("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[#fbe8e6] border-1.5 border-[#d84c23] text-xs font-mono font-bold text-[#d84c23]">
                ⚠ {error}
              </div>
            )}
          </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-[#f5f1ea] border-t-2 border-[#141c2b]">
          <button
            type="button"
            onClick={onClose}
            className="secondary-action text-xs font-mono"
            style={{ padding: "0.55rem 1rem" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={saving}
            className="primary-action text-xs font-mono cursor-pointer"
            style={{ padding: "0.55rem 1.4rem" }}
          >
            {saving ? "Saving..." : "Save Profile →"}
          </button>
        </div>
      </div>
    </div>
  )
}
