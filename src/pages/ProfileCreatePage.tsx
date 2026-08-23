import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { type ProfileData } from "../components/EditProfileModal"
import { getActiveProfile, setActiveProfile, getActiveUser, extractFirstNameFromBmuEmail } from "../lib/tempStore"
import { saveStudentProfile, uploadAvatarImage } from "../lib/supabaseService"
import { supabase } from "../lib/supabase"
import { COMMUNITY_CLUBS, MAJOR_CLUBS, MINOR_CLUBS } from "../lib/clubsData"
import { ShieldCheck } from "lucide-react"

const START_YEARS = [2022, 2023, 2024, 2025, 2026]
const END_YEARS = [2027, 2028, 2029, 2030, 2031]

export const COURSE_OPTIONS = [
  "B.Tech in Computer Science & Engineering",
  "B.Tech in Mechanical Engineering",
  "B.Tech in Electronics & Communication Engineering",
  "BBA",
  "BBA (Hons.)",
  "B.Com (Hons.)",
  "BA (Hons.) Economics",
  "BA (Hons.) Psychology",
  "BA (Hons.) Sociology",
  "BA (Hons.) Literature",
  "BA (Hons.) History",
  "LL.B.",
  "BA LL.B. (Hons.)",
  "BBA LL.B. (Hons.)",
  "Integrated BBA–MBA",
  "MBA",
  "Executive MBA",
  "MA in Public Policy",
  "Ph. D.",
  "Others",
]

function ProfileSetup() {
  const navigate = useNavigate()

  const activeUser = getActiveUser()
  const compulsoryFirstName = extractFirstNameFromBmuEmail(activeUser?.email || activeUser?.username || "")

  const defaultLastName = (() => {
    if (!activeUser?.username) return ""
    const parts = activeUser.username.split(".")
    if (parts.length > 1) {
      const rest = parts[1].replace(/\d+$/, "").trim()
      if (rest) return rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase()
    }
    return ""
  })()

  const [middleAndLastName, setMiddleAndLastName] = useState(defaultLastName)
  const [startYear, setStartYear] = useState<number | "">(START_YEARS[2]) // Default 2024
  const [endYear, setEndYear] = useState<number | "">(END_YEARS[1]) // Default 2028
  const [course, setCourse] = useState("")
  const [otherCourse, setOtherCourse] = useState("")
  const [instagram, setInstagram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [bio, setBio] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Clubs & Sports (Optional)
  const [majorClub, setMajorClub] = useState("")
  const [majorSport, setMajorSport] = useState("")
  const [minorClub, setMinorClub] = useState("")
  const [minorSport, setMinorSport] = useState("")
  const [communityClub, setCommunityClub] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkExistingProfile() {
      const active = getActiveProfile()
      if (active && active.display_name && active.branch) {
        navigate("/home", { replace: true })
        return
      }

      const user = getActiveUser()
      if (user?.email) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", user.email.toLowerCase())
            .maybeSingle()

          if (data && data.display_name && data.branch) {
            setActiveProfile(data)
            navigate("/home", { replace: true })
            return
          }
        } catch (err) {
          console.warn("Could not query profile on create page:", err)
        }
      }
    }
    checkExistingProfile()
  }, [navigate])

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
      setError(null)
    } catch (err) {
      console.warn("Avatar processing notice:", err)
    }
  }

  function validateBatch() {
    if (course === "Ph. D.") return true
    if (startYear === "" || endYear === "") return false
    if (typeof startYear !== "number" || typeof endYear !== "number") return false
    return endYear >= startYear + 1
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const finalDisplayName = `${compulsoryFirstName} ${middleAndLastName.trim()}`.trim()
    if (!finalDisplayName) {
      setError("Full name is required.")
      return
    }
    if (!course) {
      setError("Please select your course/branch.")
      return
    }
    if (!bio.trim()) {
      setError("Bio / Headline is required.")
      return
    }
    if (course !== "Ph. D." && !validateBatch()) {
      setError("Please choose a valid batch: graduation year must be at least one year after start year.")
      return
    }
    const finalBranch = course === "Others" ? otherCourse.trim() || "Others" : course

    setLoading(true)

    const batchStr = course === "Ph. D." ? "Ph.D. Scholar" : `${startYear}\u2013${endYear}` // en-dash

    const localProfile: ProfileData = {
      display_name: finalDisplayName,
      bio: bio.trim(),
      branch: finalBranch,
      batch: batchStr,
      avatar_url: avatarPreview || "",
      instagram_url: instagram.trim(),
      linkedin_url: linkedin.trim(),
      major_club: majorClub || undefined,
      major_sport: majorClub === "Sports" ? majorSport.trim() : undefined,
      minor_club: majorClub !== "Sports" ? minorClub || undefined : undefined,
      minor_sport: majorClub === "Sports" ? minorSport.trim() || undefined : undefined,
      community_club: communityClub || undefined,
    }

    try {
      await saveStudentProfile(localProfile)
    } catch (err) {
      console.warn("Supabase profile save notice:", err)
      setActiveProfile(localProfile)
    }

    setTimeout(() => {
      setLoading(false)
      navigate("/profile")
    }, 350)
  }

  return (
    <div className="setup-container mx-auto max-w-2xl px-4 py-8">
      {/* Editorial Header */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#141c2b]">
          Complete Your Student Profile
        </h1>
        <p className="text-sm text-[#545e6d] max-w-md mx-auto">
          Set up your vertex profile to join communities, discover peers, and showcase your interests.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#faf7f2] border-2 border-[#141c2b] p-6 sm:p-8 rounded-lg shadow-[6px_6px_0px_#141c2b]">
        {error && (
          <div className="p-3 bg-[#fbe8e6] border-2 border-[#d84c23] text-[#d84c23] rounded-xs text-xs font-mono font-bold shadow-[2px_2px_0px_#d84c23]">
            ⚠ {error}
          </div>
        )}

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center gap-3 pb-4 border-b-2 border-[#141c2b]">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-28 h-28 rounded-xs border-2 border-[#141c2b] bg-[#eae2d5] overflow-hidden flex items-center justify-center cursor-pointer shadow-[3px_3px_0px_#141c2b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-mono text-xs font-bold text-[#545e6d] text-center p-2">
                + Upload Photo
              </span>
            )}
          </div>
          <input
            type="file"
            ref={fileRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <span className="font-mono text-[10px] text-[#8892a0]">
            Click above to choose profile picture (Max 5MB)
          </span>
        </div>

        {/* Display Name — Compulsory First Name Locked */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b]">
              Student Name <span className="text-[#d84c23]">*</span>
            </label>
            <span className="font-mono text-[10px] font-bold text-[#545e6d] uppercase bg-[#eae2d5] px-2 py-0.5 border border-[#141c2b] rounded-2xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#d84c23]" /> First Name Verified
            </span>
          </div>

          <div className="flex items-center bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] overflow-hidden focus-within:ring-2 focus-within:ring-[#141c2b]">
            <div
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#eae2d5] border-r-2 border-[#141c2b] text-sm font-bold text-[#141c2b] select-none shrink-0"
              title="First name is permanently locked to your verified BMU student ID"
            >
              <span>{compulsoryFirstName}</span>
            </div>
            <input
              type="text"
              value={middleAndLastName}
              onChange={(e) => setMiddleAndLastName(e.target.value)}
              placeholder="Middle & Last Name (e.g. Meshram)"
              className="w-full px-3.5 py-2.5 bg-transparent text-sm text-[#141c2b] placeholder-[#8892a0] font-medium focus:outline-none"
            />
          </div>
          <p className="mt-1 font-mono text-[11px] text-[#545e6d]">
            Full Profile Name: <strong className="text-[#141c2b]">{compulsoryFirstName} {middleAndLastName.trim()}</strong>
          </p>
        </div>

        {/* Course / Branch — Shifted above Batch selection */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
            Program / Branch <span className="text-[#d84c23]">*</span>
          </label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
          >
            <option value="">-- Select Course / Program --</option>
            {COURSE_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {course === "Others" && (
            <input
              type="text"
              placeholder="Specify your program / branch"
              value={otherCourse}
              onChange={(e) => setOtherCourse(e.target.value)}
              className="w-full mt-2 px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
            />
          )}
        </div>

        {/* Batch Selection — Hidden if Ph. D. is selected */}
        {course === "Ph. D." ? (
          <div className="p-3.5 bg-[#eae2d5] border-2 border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] flex items-center justify-between shadow-[2px_2px_0px_#141c2b]">
            <span className="font-bold uppercase">Doctoral Program:</span>
            <span className="text-[#545e6d]">No fixed batch years required</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Start Year <span className="text-[#d84c23]">*</span>
              </label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
              >
                {START_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Graduation Year <span className="text-[#d84c23]">*</span>
              </label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
              >
                {END_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Clubs & Sports Affiliations (Optional) */}
        <div className="pt-2 border-t-2 border-[#141c2b] space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase text-[#141c2b]">
              Clubs & Sports Affiliations (Optional)
            </span>
            <span className="font-mono text-[10px] text-[#8892a0] uppercase">
              Helps peers connect with you
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Major Club / Sport */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Major Club / Sport
              </label>
              <select
                value={majorClub}
                onChange={(e) => {
                  const val = e.target.value
                  setMajorClub(val)
                  if (val !== "Sports") {
                    setMajorSport("")
                  }
                  if (minorClub === val) {
                    setMinorClub("")
                    setMinorSport("")
                  }
                }}
                className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
              >
                <option value="">-- None / Select Major Club --</option>
                {MAJOR_CLUBS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {majorClub === "Sports" && (
                <input
                  type="text"
                  value={majorSport}
                  onChange={(e) => setMajorSport(e.target.value)}
                  placeholder="Specify your major sport (e.g. Football, Cricket, Badminton)"
                  className="w-full mt-2 px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] placeholder-[#8892a0] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
                />
              )}
            </div>

            {/* Minor Club / Sport */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Minor Club / Sport
              </label>
              <select
                value={minorClub}
                onChange={(e) => {
                  const val = e.target.value
                  setMinorClub(val)
                  if (val !== "Sports") {
                    setMinorSport("")
                  }
                }}
                className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
              >
                <option value="">-- None / Select Minor Club --</option>
                {MINOR_CLUBS.filter((c) => !majorClub || c !== majorClub).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {minorClub === "Sports" && (
                <input
                  type="text"
                  value={minorSport}
                  onChange={(e) => setMinorSport(e.target.value)}
                  placeholder="Specify your minor sport (e.g. Table Tennis, Chess, Swimming)"
                  className="w-full mt-2 px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] placeholder-[#8892a0] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
                />
              )}
            </div>
          </div>

          {/* Community Club (Exclusively 3 Welfare Clubs) */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
              Community Club
            </label>
            <select
              value={communityClub}
              onChange={(e) => setCommunityClub(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              <option value="">-- None / Select Community Club --</option>
              {COMMUNITY_CLUBS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio — Mandatory */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
            Bio / Headline <span className="text-[#d84c23]">*</span>
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow students about your interests, hobbies, and communities.."
            required
            className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] focus:outline-none shadow-[2px_2px_0px_#141c2b] resize-none"
          />
        </div>

        {/* Social URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
              Instagram Profile URL
            </label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/username"
              className="w-full px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] placeholder-[#8892a0] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] placeholder-[#8892a0] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="primary-action w-full font-mono uppercase tracking-wider font-bold cursor-pointer"
          style={{ padding: "0.85rem 1.5rem" }}
        >
          {loading ? "Creating Profile..." : "Create Profile →"}
        </button>
      </form>
    </div>
  )
}

export default ProfileSetup
