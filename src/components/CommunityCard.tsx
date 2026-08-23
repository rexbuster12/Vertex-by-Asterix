import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Crown, LogOut, Users } from "lucide-react"
import { WhatsAppIcon, InstagramIcon } from "./Icons"
import { joinCommunityInDb, leaveCommunityInDb } from "../lib/supabaseService"
import { addNotification } from "../lib/notificationStore"

export type CommunityCardProps = {
  id?: string | number
  name: string
  members?: number
  members_count?: number
  description?: string
  whatsapp_link?: string
  instagram_link?: string
  image?: string
  isPreview?: boolean
  isJoined?: boolean
  isHead?: boolean
  onToggleJoin?: (name: string, nextJoined: boolean) => void
}

const DEFAULT_CAMPUS_BANNER = "/default-banner.jpg"

function CommunityCard({
  name,
  members = 1,
  members_count,
  description = "A campus community for students to collaborate, share ideas, and build together.",
  whatsapp_link,
  instagram_link,
  image,
  isPreview = false,
  isJoined: initialIsJoined = false,
  isHead = false,
  onToggleJoin,
}: CommunityCardProps) {
  const initialMembers = members_count ?? members ?? 1
  const [joined, setJoined] = useState(isHead || initialIsJoined)
  const [memberCount, setMemberCount] = useState(initialMembers)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    setJoined(isHead || initialIsJoined)
  }, [isHead, initialIsJoined])

  useEffect(() => {
    setMemberCount(members_count ?? members ?? 1)
  }, [members_count, members])

  const handleToggleJoin = async () => {
    if (isHead || isJoining) return

    setIsJoining(true)
    const nextJoined = !joined
    setJoined(nextJoined)
    setMemberCount((prev) => (nextJoined ? prev + 1 : Math.max(1, prev - 1)))

    if (onToggleJoin) {
      onToggleJoin(name, nextJoined)
    }

    try {
      if (nextJoined) {
        await joinCommunityInDb(name)
        addNotification({
          type: "member_joined",
          title: `Joined ${name}`,
          message: `You joined ${name}. You will receive announcements from this hub.`,
          linkUrl: `/communities/${encodeURIComponent(name)}`,
          communityName: name,
        })
      } else {
        await leaveCommunityInDb(name)
      }
    } catch (err) {
      console.warn("Toggle join error:", err)
    } finally {
      setTimeout(() => {
        setIsJoining(false)
      }, 600)
    }
  }

  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "CM"

  const photoUrl = image || DEFAULT_CAMPUS_BANNER
  const hasSocialLinks = !!(whatsapp_link || instagram_link)

  return (
    <article className="flex flex-col h-full bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg overflow-hidden shadow-[5px_5px_0px_#141c2b] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#141c2b]">
      {/* Prominent High-Visibility Image Banner */}
      <div
        className="relative w-full h-48 sm:h-52 bg-cover bg-center border-b-2 border-[#141c2b]"
        style={{ backgroundImage: `url(${photoUrl})` }}
      >
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#141c2b] text-white font-serif font-black text-xs border border-white/20 rounded-xs shadow-[2px_2px_0px_#141c2b]">
          {initials}
        </span>
      </div>

      {/* Community Card Body */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        {/* Top Header: Clean Member Counter & Head Tag */}
        <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider">
          <span className="text-[#141c2b] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#d84c23]" />
            <span>{memberCount === 1 ? "1 Member" : `${memberCount} Members`}</span>
          </span>
          {isHead && (
            <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#141c2b] text-white border border-[#141c2b] rounded-2xs flex items-center gap-1 shadow-[1px_1px_0px_#d84c23]">
              <Crown className="w-2.5 h-2.5 text-[#d84c23]" /> Head
            </span>
          )}
        </div>

        <h3 className="font-serif text-xl sm:text-2xl font-black text-[#141c2b] leading-snug">
          {isPreview ? (
            <span>{name}</span>
          ) : (
            <Link
              to={`/communities/${encodeURIComponent(name)}`}
              className="hover:text-[#d84c23] transition-colors"
            >
              {name}
            </Link>
          )}
        </h3>

        <p className="text-xs text-[#545e6d] leading-relaxed flex-1 line-clamp-3">
          {description}
        </p>

        {/* Action Row - Hidden in preview mode */}
        {!isPreview ? (
          <div className="pt-3 border-t-2 border-[#d8cebe] flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-2">
              <Link
                to={`/communities/${encodeURIComponent(name)}`}
                className="font-mono text-xs font-bold uppercase px-3 py-1.5 bg-[#141c2b] text-white rounded-xs border-2 border-[#141c2b] shadow-[2px_2px_0px_#d84c23] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
              >
                View Community
              </Link>

              {isHead ? (
                <span className="font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-2 border-[#141c2b] bg-[#eae2d5] text-[#141c2b] flex items-center gap-1 shadow-[1px_1px_0px_#141c2b]">
                  <Crown className="w-3.5 h-3.5 text-[#d84c23]" />
                  <span>Head</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isJoining}
                  onClick={handleToggleJoin}
                  className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-2 border-[#141c2b] cursor-pointer transition-all flex items-center gap-1.5 ${
                    joined
                      ? "bg-[#fbe8e6] text-[#d84c23] hover:bg-[#d84c23] hover:text-white shadow-[2px_2px_0px_#141c2b]"
                      : "bg-[#faf7f2] text-[#141c2b] shadow-[2px_2px_0px_#141c2b] hover:bg-[#141c2b] hover:text-white"
                  } ${isJoining ? "opacity-75 cursor-not-allowed" : ""}`}
                  title={joined ? "Leave this community" : "Join this community"}
                >
                  {joined && <LogOut className="w-3.5 h-3.5" />}
                  <span>{isJoining ? "..." : joined ? "Leave" : "+ Join"}</span>
                </button>
              )}
            </div>

            {hasSocialLinks && (
              <div className="flex items-center gap-1.5">
                {whatsapp_link && (
                  <a
                    href={whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-[#25D366] text-white border-1.5 border-[#141c2b] rounded-xs shadow-[1px_1px_0px_#141c2b] hover:scale-105 transition-transform"
                    title="Join WhatsApp Group"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </a>
                )}
                {instagram_link && (
                  <a
                    href={instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] text-white border-1.5 border-[#141c2b] rounded-xs shadow-[1px_1px_0px_#141c2b] hover:scale-105 transition-transform"
                    title="Visit Instagram Profile"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="pt-2 border-t border-[#d8cebe] flex items-center justify-between font-mono text-[10px] text-[#8892a0]">
            <span className="text-[#d84c23] font-bold">● LIVE CARD PREVIEW</span>
            <span>VERTEX NOTICEBOARD</span>
          </div>
        )}
      </div>
    </article>
  )
}

export default CommunityCard