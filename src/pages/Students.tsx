import { useState, useMemo } from "react"
import { Link } from "react-router"

export type StudentProfile = {
  id: string | number
  name: string
  branch: string
  batchYear: string
  bio: string
  communities: string[]
  interests: string[]
  avatarPhoto?: string
}

const SAMPLE_STUDENTS: StudentProfile[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    branch: "B.Tech CSE",
    batchYear: "2026 - 2030",
    bio: "Passionate about distributed systems, Rust tooling, and weekend competitive programming sprints.",
    communities: ["Full-Stack & Systems Guild", "Competitive Coding"],
    interests: ["React", "Rust", "Docker", "Algorithms"],
    avatarPhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Ananya Iyer",
    id: 2,
    branch: "LLB (Law)",
    batchYear: "2024 - 2029",
    bio: "Focusing on cyber policy, open-source licensing, and AI ethics. Active moot court trial counsel.",
    communities: ["Campus Moot Court Society", "Legal Tech & Policy"],
    interests: ["Cyber Law", "IPR", "Debating", "Public Policy"],
    avatarPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Rohan Varma",
    id: 3,
    branch: "B.Tech AI & DS",
    batchYear: "2025 - 2029",
    bio: "Building vision-language agents and autonomous drone controllers. Hardware tinkerer.",
    communities: ["Autonomous Robotics Cell", "AI Lab"],
    interests: ["PyTorch", "ROS2", "Computer Vision", "LLMs"],
    avatarPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Meera Nair",
    id: 4,
    branch: "B.Des (Design)",
    batchYear: "2026 - 2030",
    bio: "Editorial layout & typography designer. Exploring physical print zines and tactile web design systems.",
    communities: ["Human-Centered Design Lab", "Creative Arts"],
    interests: ["Figma", "Typography", "Zines", "Design Systems"],
    avatarPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Kabir Mehta",
    id: 5,
    branch: "BBA",
    batchYear: "2025 - 2028",
    bio: "Student founder exploring micro-fintech tools and community commerce on campus.",
    communities: ["Campus Entrepreneurship Cell", "Fintech & Markets"],
    interests: ["Fintech", "Product Strategy", "Startups", "Economics"],
    avatarPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Diya Sengupta",
    id: 6,
    branch: "B.Tech ECE",
    batchYear: "2023 - 2027",
    bio: "Soldering microcontrollers, designing custom PCBs, and configuring LoRa sensor networks.",
    communities: ["Autonomous Robotics Cell", "Hardware Hackers"],
    interests: ["Embedded C", "Arduino", "FPGA", "IoT"],
    avatarPhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  },
]

const BRANCH_OPTIONS = [
  "All Branches",
  "B.Tech CSE",
  "B.Tech AI & DS",
  "B.Tech ECE",
  "LLB (Law)",
  "BBA",
  "B.Des (Design)",
]

const BATCH_OPTIONS = [
  "All Batches",
  "2026 - 2030",
  "2025 - 2029",
  "2024 - 2028",
  "2023 - 2027",
]

function Students() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("All Branches")
  const [selectedBatch, setSelectedBatch] = useState("All Batches")
  const [connectedIds, setConnectedIds] = useState<Record<string | number, boolean>>({})

  const toggleConnect = (id: string | number) => {
    setConnectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const filteredStudents = useMemo(() => {
    return SAMPLE_STUDENTS.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.communities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        student.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesBranch =
        selectedBranch === "All Branches" ||
        student.branch.toLowerCase() === selectedBranch.toLowerCase()

      const matchesBatch =
        selectedBatch === "All Batches" || student.batchYear === selectedBatch

      return matchesSearch && matchesBranch && matchesBatch
    })
  }, [searchQuery, selectedBranch, selectedBatch])

  return (
    <div className="editorial-shell space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
            ROSTER // ISSUE 03
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight">
            Student Roster & Directory
          </h1>
          <p className="text-sm text-[#545e6d] max-w-xl">
            Meet builders, moot trial counsel, musicians, and creators across departments and cohorts.
          </p>
        </div>

        <Link to="/profile" className="secondary-action self-start sm:self-auto">
          <span>View My Badge</span>
        </Link>
      </div>

      {/* ── FILTER & SEARCH BAR ──────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-4 sm:p-5 shadow-[4px_4px_0px_#141c2b] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input (6 cols) */}
          <div className="md:col-span-6 relative">
            <input
              type="text"
              placeholder="Search by student name, branch, interest, or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-[#ffffff] shadow-[2px_2px_0px_#141c2b]"
            />
          </div>

          {/* Branch Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Year Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-sm text-xs font-mono font-bold uppercase text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
            >
              {BATCH_OPTIONS.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between font-mono text-xs text-[#545e6d] pt-1">
          <span>
            SHOWING <b className="text-[#141c2b]">{filteredStudents.length}</b> PROFILES
          </span>
          {(selectedBranch !== "All Branches" || selectedBatch !== "All Batches" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBranch("All Branches")
                setSelectedBatch("All Batches")
                setSearchQuery("")
              }}
              className="text-[#d84c23] font-bold hover:underline cursor-pointer uppercase"
            >
              Reset Filters [✕]
            </button>
          )}
        </div>
      </div>

      {/* ── STUDENT CARDS GRID ───────────────────────────────────── */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const isConnected = !!connectedIds[student.id]
            const initials = student.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()

            return (
              <div key={student.id} className="student-badge-card">
                {/* Header: Photo Stamp + Info */}
                <div className="student-badge-header">
                  {student.avatarPhoto ? (
                    <img
                      src={student.avatarPhoto}
                      alt={student.name}
                      className="student-badge-photo object-cover"
                    />
                  ) : (
                    <div className="student-badge-photo">
                      {initials}
                    </div>
                  )}

                  <div className="student-badge-info flex-1">
                    <span className="student-badge-tag">
                      {student.branch}
                    </span>
                    <h3 className="student-badge-name mt-1">
                      {student.name}
                    </h3>
                    <span className="student-badge-batch">
                      Batch {student.batchYear}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-[#545e6d] leading-relaxed">
                  {student.bio}
                </p>

                {/* Communities Joined */}
                <div className="space-y-1 pt-2 border-t border-[#d8cebe]">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#8892a0]">
                    Communities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {student.communities.map((comm, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-[11px] font-bold text-[#141c2b] bg-[#f5f1ea] px-2 py-0.5 border border-[#141c2b] rounded-xs"
                      >
                        {comm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {student.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[10px] text-[#545e6d] bg-[#faf7f2] px-1.5 py-0.5 border border-[#d8cebe] rounded-xs"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>

                {/* Connect Action */}
                <div className="pt-3 border-t border-[#d8cebe] flex items-center justify-between mt-auto">
                  <span className="font-mono text-[11px] text-[#545e6d]">
                    {student.communities.length} hubs
                  </span>

                  <button
                    onClick={() => toggleConnect(student.id)}
                    className={`font-mono text-xs font-bold uppercase px-3.5 py-1.5 rounded-xs border-1.5 border-[#141c2b] transition-all cursor-pointer ${
                      isConnected
                        ? "bg-[#eae2d5] text-[#141c2b] shadow-[1px_1px_0px_#141c2b]"
                        : "bg-[#141c2b] text-[#ffffff] shadow-[2px_2px_0px_#d84c23] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    }`}
                  >
                    {isConnected ? "Connected ✓" : "+ Connect"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg space-y-3">
          <p className="font-serif text-xl font-bold text-[#141c2b]">
            No student profiles found for "{searchQuery || selectedBranch}"
          </p>
          <p className="text-xs text-[#545e6d] font-mono">
            Try adjusting your search query or reset branch filters.
          </p>
        </div>
      )}
    </div>
  )
}

export default Students
