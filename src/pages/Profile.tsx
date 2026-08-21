import { useState, useEffect } from "react"
import { Link } from "react-router"
import EditProfileModal, { type ProfileData } from "../components/EditProfileModal"

const PROFILE_KEY = "vertex_profile_v1"

const DEFAULT_PROFILE: ProfileData = {
  display_name: "Alex Chen",
  bio: "Passionate about full-stack architectures, distributed systems, open-source campus tools, and weekend blitz chess.",
  branch: "B.Tech CSE",
  batch: "2026–2030",
  avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  instagram_url: "https://instagram.com/alexchen_dev",
  linkedin_url: "https://linkedin.com/in/alexchen-campus",
}

const MY_COMMUNITIES = [
  { name: "Full-Stack & Systems Guild", members: 148, role: "Founder / Core" },
  { name: "Campus Chess & Blitz Guild", members: 92, role: "Active Member" },
]

function Profile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [interests, setInterests] = useState<string[]>([
    "Full-Stack Dev",
    "Rust",
    "UI/UX Design",
    "Chess Tactics",
    "Open Source",
  ])
  const [newInterest, setNewInterest] = useState("")
  const [isAddingInterest, setIsAddingInterest] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ProfileData
        setProfile(parsed)
      }
    } catch {
      // Keep default
    }
  }, [])

  function handleSave(data: ProfileData) {
    setProfile(data)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
    } catch {
      console.warn("localStorage save failed")
    }
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
    profile.display_name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "AC"

  return (
    <>
      <div className="editorial-shell space-y-6">
        {/* ── EDITORIAL STUDENT PRESS PASS / BADGE HEADER ─────────── */}
        <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[6px_6px_0px_#141c2b] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#141c2b] pb-3">
            <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
              VERTEX STUDENT IDENTIFICATION // BADGE #VX-8429
            </span>
            <span className="font-mono text-[11px] font-bold text-[#141c2b] bg-[#eae2d5] px-2 py-0.5 border border-[#141c2b]">
              VERIFIED CAMPUS MEMBER
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Photo Stamp */}
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
            <div className="flex flex-col gap-2.5 self-start sm:self-center">
              <button
                onClick={() => setIsEditOpen(true)}
                className="primary-action text-xs font-mono"
                style={{ padding: "0.65rem 1.25rem" }}
              >
                ✏ Edit Badge
              </button>
              <Link
                to="/profile/create"
                className="secondary-action text-xs font-mono"
                style={{ padding: "0.65rem 1.25rem", textAlign: "center" }}
              >
                + Create Profile
              </Link>
              <Link
                to="/create-community"
                className="secondary-action text-xs font-mono"
                style={{ padding: "0.65rem 1.25rem", textAlign: "center" }}
              >
                + Pin Community
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-[#141c2b] max-w-md">
            <div>
              <p className="font-serif text-2xl font-black text-[#141c2b]">{MY_COMMUNITIES.length}</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Joined Hubs</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-black text-[#d84c23]">18</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Connections</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-black text-[#141c2b]">{interests.length}</p>
              <p className="font-mono text-[10px] font-bold text-[#8892a0] uppercase">Interests</p>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN SECTION: JOINED HUBS & INTERESTS ──────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Joined Communities (7 cols) */}
          <div className="md:col-span-7 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 shadow-[4px_4px_0px_#141c2b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8cebe] pb-2">
              <h2 className="font-serif text-xl font-bold text-[#141c2b]">
                Active Memberships
              </h2>
              <Link to="/communities" className="font-mono text-xs font-bold text-[#d84c23] hover:underline">
                Explore All Noticeboards →
              </Link>
            </div>

            <div className="space-y-3">
              {MY_COMMUNITIES.map((comm, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-[#f5f1ea] border border-[#141c2b] rounded-sm shadow-[2px_2px_0px_#141c2b]"
                >
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#141c2b]">{comm.name}</h4>
                    <p className="font-mono text-xs text-[#545e6d] mt-0.5">{comm.members} active students</p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#faf7f2] text-[#141c2b] border border-[#141c2b] rounded-xs">
                    {comm.role}
                  </span>
                </div>
              ))}
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
                  placeholder="e.g. ROS2, Moot Court, AI"
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