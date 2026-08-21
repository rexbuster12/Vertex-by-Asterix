import { useMemo, useState } from "react"
import { useNavigate } from "react-router"

const PROFILE_KEY = "vertex_profile_v1"

const BATCH_OPTIONS = [
  "2023–2027",
  "2024–2028",
  "2025–2029",
  "2026–2030",
  "2027–2031",
  "2028–2032",
]

const COURSE_OPTIONS = [
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
  "PhD",
  "Other",
]

const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"]

type ProfileSetupForm = {
  display_name: string
  email: string
  batch: string
  course: string
  section: string
  links: string
  created_at: string
  profile_picture: string
}

function getEmailPrefix(email: string) {
  const clean = email.trim().toLowerCase()
  if (!clean || !clean.includes("@")) return ""
  return clean.split("@")[0].trim()
}

function ProfileCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ProfileSetupForm>({
    display_name: "",
    email: "",
    batch: "2026–2030",
    course: "B.Tech CSE",
    section: "A",
    links: "",
    created_at: new Date().toISOString(),
    profile_picture: "",
  })
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const emailPrefix = useMemo(() => getEmailPrefix(form.email), [form.email])

  const handleField = (field: keyof ProfileSetupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be under 5 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profile_picture: typeof reader.result === "string" ? reader.result : "",
      }))
      setError("")
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const prefix = getEmailPrefix(form.email)
    if (!prefix) {
      setError("Enter your BMU Gmail ID to generate your student profile.")
      return
    }

    const fullName = form.display_name.trim()
    if (!fullName) {
      setError("Enter the student's full name.")
      return
    }

    if (!form.email.toLowerCase().includes("bmu") && !form.email.toLowerCase().includes("gmail")) {
      setError("Use your BMU email or BMU-linked Gmail ID.")
      return
    }

    const rawLinks = form.links
      .split(/[\n,]+/)
      .map((link) => link.trim())
      .filter(Boolean)

    const instagramUrl = rawLinks.find((link) => /instagram/i.test(link)) || ""
    const linkedinUrl = rawLinks.find((link) => /linkedin/i.test(link)) || ""
    const portfolioUrl = rawLinks.find(
      (link) => !/instagram|linkedin/i.test(link) && /^https?:\/\//i.test(link),
    )

    const formData = {
      display_name: fullName,
      username: prefix,
      email: form.email.trim().toLowerCase(),
      batch: form.batch,
      course: form.course,
      section: form.section,
      links: rawLinks.join(", "),
      created_at: form.created_at || new Date().toISOString(),
      profile_picture: form.profile_picture,
      bio: `BMU ${form.course} student • Batch ${form.batch} • Section ${form.section}.`,
      branch: form.course,
      avatar_url: form.profile_picture || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      instagram_url: instagramUrl,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl || "",
    }

    setIsSaving(true)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(formData))
      navigate("/profile")
    } catch (saveError) {
      console.error("Profile save failed:", saveError)
      setError("Unable to save your profile right now. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="editorial-shell max-w-5xl mx-auto">
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-5 sm:p-8 shadow-[6px_6px_0px_#141c2b]">
        <div className="flex flex-col gap-3 border-b-2 border-[#141c2b] pb-4 mb-6">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#d84c23]">
            STUDENT REGISTRATION // BMU PROFILE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#141c2b] tracking-[-0.04em]">
            Create your profile
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {form.profile_picture ? (
                <img
                  src={form.profile_picture}
                  alt="Profile preview"
                  className="w-44 h-44 rounded-sm object-cover border-2 border-[#141c2b] shadow-[4px_4px_0px_#141c2b]"
                />
              ) : (
                <div className="w-44 h-44 rounded-sm bg-[#141c2b] text-[#faf7f2] font-serif text-5xl font-black border-2 border-[#141c2b] shadow-[4px_4px_0px_#141c2b] flex items-center justify-center">
                  {emailPrefix ? emailPrefix.slice(0, 2).toUpperCase() : "BM"}
                </div>
              )}
            </div>

            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border-2 border-[#141c2b] bg-[#f5f1ea] text-[#141c2b] font-mono text-[11px] font-bold uppercase tracking-[0.1em] shadow-[3px_3px_0px_#141c2b] transition-transform hover:-translate-y-0.5">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <div className="w-full rounded-sm border-2 border-[#141c2b] bg-[#f5f1ea] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#545e6d]">Identity</p>
              <p className="mt-2 font-serif text-2xl font-black text-[#141c2b] tracking-[-0.04em]">
                {form.display_name.trim() || emailPrefix || "your-name"}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  BMU Email ID
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleField("email", e.target.value)}
                  placeholder="yourname@bmu.ac.in"
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#f5f1ea] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] shadow-[2px_2px_0px_#141c2b] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => handleField("display_name", e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#f5f1ea] rounded-sm text-sm text-[#141c2b] shadow-[2px_2px_0px_#141c2b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={emailPrefix || ""}
                  readOnly
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#e9e1d8] rounded-sm text-sm text-[#141c2b] shadow-[2px_2px_0px_#141c2b] outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  Batch
                </label>
                <select
                  value={form.batch}
                  onChange={(e) => handleField("batch", e.target.value)}
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#f5f1ea] rounded-sm text-sm text-[#141c2b] shadow-[2px_2px_0px_#141c2b] focus:outline-none"
                >
                  {BATCH_OPTIONS.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  Course
                </label>
                <select
                  value={form.course}
                  onChange={(e) => handleField("course", e.target.value)}
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#f5f1ea] rounded-sm text-sm text-[#141c2b] shadow-[2px_2px_0px_#141c2b] focus:outline-none"
                >
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  Section
                </label>
                <select
                  value={form.section}
                  onChange={(e) => handleField("section", e.target.value)}
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#f5f1ea] rounded-sm text-sm text-[#141c2b] shadow-[2px_2px_0px_#141c2b] focus:outline-none"
                >
                  {SECTION_OPTIONS.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                  Created At
                </label>
                <input
                  type="text"
                  value={new Date(form.created_at).toLocaleString()}
                  readOnly
                  className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#e9e1d8] rounded-sm text-sm text-[#141c2b] shadow-[2px_2px_0px_#141c2b] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#141c2b] mb-2">
                Links
              </label>
              <textarea
                value={form.links}
                onChange={(e) => handleField("links", e.target.value)}
                rows={3}
                placeholder="Paste Instagram, LinkedIn, portfolio, or GitHub links separated by commas"
                className="w-full px-3.5 py-2.5 border-2 border-[#141c2b] bg-[#f5f1ea] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] shadow-[2px_2px_0px_#141c2b] focus:outline-none resize-none"
              />
            </div>

            {error && (
              <div className="rounded-sm border-2 border-[#141c2b] bg-[#fbe6df] px-3 py-2 font-mono text-xs font-bold text-[#8a2b19]">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="secondary-action text-xs font-mono"
              >
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="primary-action text-xs font-mono disabled:opacity-60">
                {isSaving ? "Saving..." : "Create Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileCreatePage
