import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router"
import EditProfileModal, { type ProfileData } from "../components/EditProfileModal"
import { getActiveProfile, setActiveProfile } from "../lib/tempStore"

function Profile() {
  const [searchParams] = useSearchParams()
  const previewParam = searchParams.get("preview")
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState("")
  const [isAddingInterest, setIsAddingInterest] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  useEffect(() => {
    try {
      if (previewParam) {
        const previewRaw = localStorage.getItem("vertex_preview_profile")
        if (previewRaw) {
          const parsed = JSON.parse(previewRaw) as ProfileData
          setProfile(parsed)
          setIsPreviewing(true)
          setInterests([])
          return
        }
      }

      // Read from temporary in-memory store (resets on refresh)
      const active = getActiveProfile()
      if (active) {
        setProfile(active)
        setIsPreviewing(false)
        setInterests([])
      } else {
        // No saved profile on fresh load/refresh
        setProfile(null)
        setIsPreviewing(false)
        setInterests([])
      }
    } catch {
      setProfile(null)
    }
  }, [previewParam])

  function handleSave(data: ProfileData) {
    setProfile(data)
    setActiveProfile(data)
    console.log("🚀 [PROFILE UPDATED - SAVED TO TEMPORARY CONSOLE (RESETS ON REFRESH)]:", data)
    setIsEditOpen(false)
  }

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault()
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()])
      setNewInterest("")
      setIsAddingInterest(false)
    }
  }

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item))
  }

  const initials =
    (profile?.display_name || "")
      .split(" ")
      .slice(0, 2)
      .map((w) => (w ? w[0] : ""))
      .join("")
      .toUpperCase() || "ST"

  if (!profile) {
    return (
      <div className="editorial-shell space-y-6">
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-8 sm:p-10 shadow-[6px_6px_0px_#141c2b] space-y-4 text-center">
          <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
            STATUS // NO ACTIVE PROFILE
          </span>
          <h2 className="font-serif text-3xl font-black text-[#141c2b]">
            No student profile found
          </h2>
          <p className="text-sm text-[#545e6d] max-w-xl mx-auto">
            You are starting fresh from the beginning. Create your student profile to browse and join communities.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Link to="/profile/create" className="primary-action" style={{ padding: "0.65rem 1.25rem" }}>
              + Create Profile
            </Link>
            <Link to="/communities" className="secondary-action" style={{ padding: "0.65rem 1.25rem" }}>
              Explore Communities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="editorial-shell space-y-6">
        {/* ── STUDENT PROFILE HEADER ─────────── */}
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[6px_6px_0px_#141c2b] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#141c2b] pb-3">
            <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
              {isPreviewing
                ? `STUDENT DIRECTORY PROFILE // ${profile.display_name.toUpperCase()}`
                : "VERTEX STUDENT IDENTIFICATION // PROFILE"}
            </span>
            <span className="font-mono text-[11px] font-bold text-[#141c2b] bg-[#eae2d5] px-2 py-0.5 border border-[#141c2b]">
              VERIFIED CAMPUS STUDENT
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Photo */}
            <div className="relative flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-sm object-cover border-2 border-[#141c2b] shadow-[3px_3px_0px_#141c2b]"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-sm bg-[#141c2b] text-[#faf7f2] font-serif font-black flex items-center justify-center text-3xl border-2 border-[#141c2b] shadow-[3px_3px_0px_#141c2b]">
                  {initials}
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.username && (
                  <span className="font-mono text-xs font-bold text-[#d84c23] bg-[#fbe8e6] border border-[#d84c23] px-2 py-0.5 rounded-xs">
                    @{profile.username}
                  </span>
                )}
                {profile.branch && (
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-[#141c2b] text-white rounded-xs">
                    {profile.branch}
                  </span>
                )}
                {profile.batch && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#eae2d5] text-[#141c2b] border border-[#141c2b] rounded-xs">
                    {profile.batch}
                  </span>
                )}
              </div>

              {/* Clubs & Sports Affiliations */}
              {(profile.major_club || profile.major_sport || profile.minor_club || profile.minor_sport || profile.community_club) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {(profile.major_club || profile.major_sport) && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#d84c23] text-white rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      ★ Major: {profile.major_club === "Sports" ? `Sport — ${profile.major_sport || "Sports"}` : profile.major_club}
                    </span>
                  )}
                  {profile.minor_club && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#141c2b] text-white rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      ✧ Minor Club: {profile.minor_club}
                    </span>
                  )}
                  {profile.minor_sport && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#2563eb] text-white rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      ⚽ Minor Sport: {profile.minor_sport}
                    </span>
                  )}
                  {profile.community_club && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 bg-[#eae2d5] text-[#141c2b] border-1.5 border-[#141c2b] rounded-xs flex items-center gap-1 shadow-[1.5px_1.5px_0px_#141c2b]">
                      🤝 Community Club: {profile.community_club}
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm text-[#545e6d] max-w-2xl leading-relaxed">
                {profile.bio || "Student member on Vertex Campus."}
              </p>

              {/* Social Links */}
              {(profile.instagram_url || profile.linkedin_url) && (
                <div className="flex items-center gap-2 pt-1">
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill"
                    >
                      INSTAGRAM ↗
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill"
                    >
                      LINKEDIN ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {!isPreviewing && (
              <div className="flex flex-col gap-2.5 self-start sm:self-center">
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="primary-action text-xs font-mono cursor-pointer"
                  style={{ padding: "0.65rem 1.25rem" }}
                >
                  ✏ Edit Profile
                </button>
                <Link
                  to="/create-community"
                  className="secondary-action text-xs font-mono"
                  style={{ padding: "0.65rem 1.25rem", textAlign: "center" }}
                >
                  + Create Community
                </Link>
              </div>
            )}
          </div>

          {/* Clean Real Stats Bar: 0 Initial Joined Communities, 0 Connections, 0 Interests */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-[#141c2b] max-w-md">
            <div>
              <p className="font-serif text-2xl font-black text-[#141c2b]">0</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Joined Communities</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-black text-[#d84c23]">0</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Connections</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-black text-[#141c2b]">{interests.length}</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Interests</p>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN SECTION: JOINED COMMUNITIES & INTERESTS ──────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Joined Communities (7 cols) */}
          <div className="md:col-span-7 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 shadow-[4px_4px_0px_#141c2b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8cebe] pb-2">
              <h2 className="font-serif text-xl font-bold text-[#141c2b]">
                Joined Communities
              </h2>
              <Link to="/communities" className="font-mono text-xs font-bold text-[#d84c23] hover:underline">
                Explore Communities →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="text-center py-8 px-4 bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg space-y-2">
                <p className="font-serif font-bold text-base text-[#141c2b]">No communities joined yet</p>
                <p className="text-xs text-[#545e6d]">Browse campus communities and join the ones that match your interests.</p>
                <div className="pt-2">
                  <Link to="/communities" className="primary-action text-xs font-mono" style={{ padding: "0.5rem 1rem" }}>
                    Explore Communities →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Interests & Skills (5 cols) */}
          <div className="md:col-span-5 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 shadow-[4px_4px_0px_#141c2b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8cebe] pb-2">
              <h2 className="font-serif text-xl font-bold text-[#141c2b]">
                Interests & Tags
              </h2>
              <button
                onClick={() => setIsAddingInterest(!isAddingInterest)}
                className="font-mono text-xs font-bold text-[#d84c23] hover:underline cursor-pointer"
              >
                {isAddingInterest ? "Cancel [✕]" : "+ Add Tag"}
              </button>
            </div>

            {isAddingInterest && (
              <form onSubmit={handleAddInterest} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AI, Web3, Chess"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#f5f1ea] border border-[#141c2b] rounded-xs font-mono text-xs text-[#141c2b] focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="primary-action text-xs" style={{ padding: "0.4rem 0.8rem" }}>
                  Add
                </button>
              </form>
            )}

            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f5f1ea] border border-[#141c2b] rounded-xs font-mono text-xs font-bold text-[#141c2b] shadow-[1px_1px_0px_#141c2b]"
                  >
                    <span>#{interest}</span>
                    <button
                      onClick={() => handleRemoveInterest(interest)}
                      className="text-[#8892a0] hover:text-[#d84c23] ml-1 cursor-pointer"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-[#8892a0] italic py-2">
                No tags added yet. Click "+ Add Tag" to add your skills and interests.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ────────────────────────────────────── */}
      {isEditOpen && (
        <EditProfileModal
          initialData={profile}
          onSave={handleSave}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </>
  )
}

export default Profile