import { useState, useRef, useEffect } from "react"
import { screenFields, validateInstagramLink, validateLinkedInLink } from "../lib/contentFilter"
import { COMMUNITY_CLUBS, MAJOR_CLUBS, REGULAR_CLUBS } from "../lib/clubsData"

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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be under 5 MB.")
      return
    }
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!avatarPreview && !form.avatar_url) {
      setError("A profile photo is required to complete your student badge.")
      return
    }

    const screenResult = screenFields([
      { label: "display name", value: form.display_name },
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

    if (!form.display_name.trim()) {
      setError("Student name is required.")
      return
    }

    setSaving(true)

    try {
      const finalAvatarUrl = avatarPreview || form.avatar_url
      const saved: ProfileData = { ...form, avatar_url: finalAvatarUrl }
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
        className="w-full sm:max-w-lg bg-[#faf7f2] sm:rounded-lg rounded-t-lg border-2 border-[#141c2b] shadow-[8px_8px_0px_#141c2b] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f5f1ea] border-b-2 border-[#141c2b]">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase">
              STUDENT PROFILE // SETTINGS
            </span>
            <h2 className="font-serif text-xl font-extrabold text-[#141c2b]">Edit Student Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xs border-1.5 border-[#141c2b] bg-[#faf7f2] font-mono font-bold text-sm text-[#141c2b] hover:bg-[#d84c23] hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="edit-profile-form" onSubmit={handleSave} className="space-y-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-2.5 pb-3 border-b border-[#d8cebe]">
              <div className="relative group">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Badge photo"
                    className="w-24 h-24 rounded-xs object-cover border-2 border-[#141c2b] shadow-[3px_3px_0px_#141c2b]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xs bg-[#141c2b] flex items-center justify-center font-serif text-2xl font-black text-[#faf7f2] border-2 border-[#141c2b] shadow-[3px_3px_0px_#141c2b]">
                    {form.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-[#141c2b]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Change
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-xs font-bold text-[#d84c23] hover:underline cursor-pointer uppercase"
              >
                {avatarPreview ? "Upload new photo" : "Upload Badge Photo *"}
              </button>
            </div>

            {/* Display Name */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Student Name <span className="text-[#d84c23]">*</span>
              </label>
              <input
                type="text"
                maxLength={40}
                required
                value={form.display_name}
                onChange={(e) => handleField("display_name", e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] font-medium focus:outline-none shadow-[2px_2px_0px_#141c2b]"
              />
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
                      minor_sport: val === "Sports" ? prev.minor_sport : undefined,
                      minor_club: val !== "Sports" && prev.minor_club === val ? undefined : prev.minor_club,
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
                    placeholder="Specify your major sport (e.g. Football, Basketball)"
                    className="w-full mt-2 px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none"
                  />
                )}
              </div>

              {/* Minor Field: Minor Sport (if Sports) OR Minor Club (if regular club) */}
              {form.major_club === "Sports" ? (
                <div>
                  <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                    Minor Sport
                  </label>
                  <input
                    type="text"
                    value={form.minor_sport || ""}
                    onChange={(e) => handleField("minor_sport", e.target.value)}
                    placeholder="e.g. Badminton, Table Tennis, Swimming (optional)"
                    className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-mono text-[11px] font-bold text-[#545e6d] mb-1">
                    Minor Club
                  </label>
                  <select
                    value={form.minor_club || ""}
                    onChange={(e) => handleField("minor_club", e.target.value)}
                    className="w-full px-3 py-2 bg-[#f5f1ea] border-1.5 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] shadow-[1.5px_1.5px_0px_#141c2b] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- None / Select Minor Club --</option>
                    {REGULAR_CLUBS.filter((c) => c !== form.major_club).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Community Club */}
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
        </div>

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
