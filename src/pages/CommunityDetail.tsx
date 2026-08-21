import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { supabase } from "../lib/supabase"
import type { CommunityCardProps } from "../components/CommunityCard"

const FALLBACK_COMMUNITIES: CommunityCardProps[] = [
  {
    name: "Full-Stack & Systems Guild",
    members: 148,
    description: "Building production web apps, exploring Rust & Go distributed systems, and shipping weekend open-source tools.",
    tags: ["Coding", "FullStack", "Rust", "Hackathons"],
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    whatsapp_link: "https://chat.whatsapp.com/demo-guild",
  },
  {
    name: "Campus Moot Court Society",
    members: 86,
    description: "Briefing constitutional law cases, mock trials, bilateral negotiation rounds, and national debate training.",
    tags: ["Law", "Debating", "MootCourt", "Policy"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://instagram.com/mootcourtsociety",
  },
  {
    name: "Human-Centered Design Lab",
    members: 112,
    description: "Weekly design critiques, Figma jams, physical typography zine printing, and UX testing on real campus projects.",
    tags: ["Design", "UIUX", "Typography", "Figma"],
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://instagram.com/designlab_campus",
  },
  {
    name: "Autonomous Robotics & Drone Cell",
    members: 74,
    description: "ROS2 development, LiDAR mapping, PCB soldering, and competitive drone racing across inter-college circuits.",
    tags: ["Robotics", "Hardware", "ROS2", "AI"],
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    whatsapp_link: "https://chat.whatsapp.com/demo-robotics",
  },
]

function CommunityDetail() {
  const { communityName } = useParams()
  const [community, setCommunity] = useState<CommunityCardProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    async function loadCommunity() {
      const name = communityName ? decodeURIComponent(communityName) : ""

      try {
        const { data, error } = await supabase
          .from("communities")
          .select("*")
          .eq("name", name)
          .maybeSingle()

        if (!error && data) {
          setCommunity(data)
        } else {
          setCommunity(FALLBACK_COMMUNITIES.find((item) => item.name === name) ?? null)
        }
      } catch {
        setCommunity(FALLBACK_COMMUNITIES.find((item) => item.name === name) ?? null)
      } finally {
        setLoading(false)
      }
    }

    loadCommunity()
  }, [communityName])

  if (loading) {
    return <div className="py-20 text-center font-mono text-sm text-[#545e6d]">Loading circle...</div>
  }

  if (!community) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
        <p className="font-mono text-xs font-bold uppercase text-[#d84c23]">404 // CIRCLE NOT FOUND</p>
        <h1 className="font-serif text-4xl font-black text-[#141c2b]">That community has moved.</h1>
        <Link to="/communities" className="primary-action inline-flex">Back to noticeboard</Link>
      </div>
    )
  }

  const tags = Array.isArray(community.tags)
    ? community.tags
    : community.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? []
  const memberCount = community.members_count ?? community.members ?? 0

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to="/communities" className="font-mono text-xs font-bold uppercase text-[#d84c23] hover:underline">
        ← Back to noticeboard
      </Link>

      <section className="grid overflow-hidden rounded-lg border-2 border-[#141c2b] bg-[#faf7f2] shadow-[6px_6px_0px_#141c2b] lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="min-h-[280px] bg-cover bg-center lg:min-h-[460px]"
          style={{ backgroundImage: `url(${community.image})` }}
          role="img"
          aria-label={`${community.name} community cover`}
        />
        <div className="flex flex-col justify-between gap-8 p-6 sm:p-10">
          <div className="space-y-5">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#d84c23]">BMLMU // STUDENT CIRCLE</p>
            <h1 className="font-serif text-4xl font-black leading-tight text-[#141c2b] sm:text-5xl">{community.name}</h1>
            <p className="text-base leading-7 text-[#545e6d]">{community.description}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => <span key={tag} className="border border-[#141c2b] px-2 py-1 font-mono text-xs font-bold uppercase">#{tag}</span>)}
            </div>
          </div>

          <div className="space-y-4 border-t-2 border-[#d8cebe] pt-5">
            <p className="font-mono text-sm font-bold text-[#141c2b]">{memberCount} active members</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setJoined((current) => !current)}
                className="primary-action"
              >
                {joined ? "Joined ✓" : "+ Join this circle"}
              </button>
              {community.whatsapp_link && (
                <a href={community.whatsapp_link} target="_blank" rel="noopener noreferrer" className="secondary-action">
                  WhatsApp ↗
                </a>
              )}
              {community.instagram_link && (
                <a href={community.instagram_link} target="_blank" rel="noopener noreferrer" className="secondary-action">
                  Instagram ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CommunityDetail
