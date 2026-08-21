import { useState } from "react"
import { Link } from "react-router"

export type CommunityCardProps = {
  id?: string | number
  name: string
  members?: number
  members_count?: number
  description?: string
  tags?: string[] | string
  whatsapp_link?: string
  instagram_link?: string
  image?: string
}

const FALLBACK_CAMPUS_PHOTOS = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517486800579-88f1f1d0d2a6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
]

function CommunityCard({
  name,
  members = 1,
  members_count,
  description = "A campus community for students to collaborate, share ideas, and build together.",
  tags,
  whatsapp_link,
  instagram_link,
  image,
}: CommunityCardProps) {
  const initialMembers = members_count ?? members ?? 1
  const [joined, setJoined] = useState(false)
  const [memberCount, setMemberCount] = useState(initialMembers)

  const handleToggleJoin = () => {
    if (joined) {
      setJoined(false)
      setMemberCount((prev) => Math.max(0, prev - 1))
    } else {
      setJoined(true)
      setMemberCount((prev) => prev + 1)
    }
  }

  const normalizedTags: string[] = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      : []

  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "VX"

  // Pick deterministic fallback photo based on name
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const photoUrl = image || FALLBACK_CAMPUS_PHOTOS[hash % FALLBACK_CAMPUS_PHOTOS.length]

  const primaryTag = normalizedTags[0] ?? "campus"
  const mediaStyle = {
    backgroundImage: `url(${photoUrl})`,
  }

  const hasSocialLinks = !!(whatsapp_link || instagram_link)

  return (
    <article className="community-card">
      <div className="community-card__media" style={mediaStyle}>
        <span className="community-card__pill">#{primaryTag}</span>
        <span className="community-card__stamp" title={name}>{initials}</span>
      </div>

      <div className="community-card__body">
        <div className="community-card__meta">
          <span className="status">{memberCount} active</span>
          <span>{memberCount === 1 ? "1 member" : `${memberCount} members`}</span>
        </div>

        <h3 className="community-card__title">
          <Link to={`/communities/${encodeURIComponent(name)}`}>{name}</Link>
        </h3>
        <p className="community-card__description">{description}</p>

        {normalizedTags.length > 0 && (
          <div className="community-card__tags">
            {normalizedTags.slice(0, 4).map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="community-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="community-card__actions">
          <Link
            to={`/communities/${encodeURIComponent(name)}`}
            className="community-card__cta"
          >
            View circle
          </Link>
          <button
            type="button"
            onClick={handleToggleJoin}
            className={`community-card__cta ${joined ? "is-joined" : ""}`}
          >
            {joined ? "Joined ✓" : "+ Join Club"}
          </button>

          {hasSocialLinks && (
            <div className="community-card__social">
              {whatsapp_link && (
                <a
                  href={whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="social-pill"
                  title="Join WhatsApp group"
                >
                  WA ↗
                </a>
              )}
              {instagram_link && (
                <a
                  href={instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="social-pill"
                  title="View Instagram profile"
                >
                  IG ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default CommunityCard