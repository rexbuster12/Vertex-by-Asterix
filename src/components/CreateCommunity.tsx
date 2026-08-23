import { useState, useRef } from "react"
import { useNavigate } from "react-router"
import { CheckCircle2, Image as ImageIcon } from "lucide-react"
import { WhatsAppIcon, InstagramIcon } from "./Icons"
import CommunityCard from "./CommunityCard"
import { createMockCommunity } from "../lib/mockStore"
import {
  screenFields,
  validateWhatsAppLink,
  validateInstagramLink,
} from "../lib/contentFilter"

function CreateCommunity() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [whatsappLink, setWhatsappLink] = useState("")
  const [instagramLink, setInstagramLink] = useState("")
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Banner image must be under 5 MB." })
      return
    }
    setBannerPreview(URL.createObjectURL(file))
    setStatusMessage(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!bannerPreview) {
      setStatusMessage({ type: "error", text: "Please upload a community banner image to proceed." })
      return
    }
    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a community name." })
      return
    }

    if (!description.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a description for your community." })
      return
    }
    if (!whatsappLink.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a WhatsApp group invite URL." })
      return
    }

    // Content Screening
    const screenResult = screenFields([
      { label: "community name", value: name },
      { label: "description", value: description },
    ])
    if (!screenResult.ok) {
      setStatusMessage({ type: "error", text: screenResult.reason! })
      return
    }

    // URL Validation
    const waResult = validateWhatsAppLink(whatsappLink)
    if (!waResult.ok) {
      setStatusMessage({ type: "error", text: waResult.reason! })
      return
    }
    const igResult = validateInstagramLink(instagramLink)
    if (!igResult.ok) {
      setStatusMessage({ type: "error", text: igResult.reason! })
      return
    }

    const fullName = name.trim().endsWith("Community")
      ? name.trim()
      : `${name.trim()} Community`

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const created = createMockCommunity({
        name: fullName,
        description: description.trim() || "A campus student community on Vertex.",
        whatsapp_link: whatsappLink.trim() || undefined,
        instagram_link: instagramLink.trim() || undefined,
        image: bannerPreview || undefined,
      })

      setStatusMessage({
        type: "success",
        text: `Community "${fullName}" launched successfully! Opening community page...`,
      })

      setTimeout(() => {
        navigate(`/communities/${encodeURIComponent(created.name)}`)
      }, 900)
    } catch (err: any) {
      console.error("Error creating community:", err)
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to create community.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const previewName = name.trim()
    ? name.trim().endsWith("Community")
      ? name.trim()
      : `${name.trim()} Community`
    : "Your Community Name"

  return (
    <div className="editorial-shell space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b]">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
          <span>CREATE A COMMUNITY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight mt-1 font-serif">
          Launch a Campus Community
        </h1>
        <p className="text-sm text-[#545e6d] max-w-2xl mt-1">
          Establish an open space for students to meet, collaborate, hack, or discuss shared interests.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-sm border-2 font-mono text-xs font-bold flex items-center gap-2 ${statusMessage.type === "success"
            ? "bg-[#eae2d5] border-[#141c2b] text-[#141c2b] shadow-[3px_3px_0px_#141c2b]"
            : "bg-[#fbe8e6] border-[#d84c23] text-[#d84c23] shadow-[3px_3px_0px_#d84c23]"
            }`}
        >
          {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-[#141c2b]" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-7 shadow-[5px_5px_0px_#141c2b]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Community Banner Image Upload */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                Community Banner Image <span className="text-[#d84c23] font-bold">* Mandatory</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-36 bg-[#f5f1ea] border-2 border-dashed border-[#141c2b] rounded-xs flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors overflow-hidden group shadow-[2px_2px_0px_#141c2b]"
                title="Click to upload banner photo"
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#141c2b]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-xs font-bold">
                      Click to Change Banner
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-1.5 text-[#545e6d] group-hover:text-[#141c2b]">
                    <ImageIcon className="w-6 h-6" />
                    <span className="font-mono text-xs font-bold uppercase">+ Upload Community Banner</span>
                    <span className="font-mono text-[10px] text-[#8892a0]">JPG, PNG or WebP under 5 MB</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>

            {/* Community Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono text-xs font-bold uppercase text-[#141c2b]">
                <label>
                  Community Name <span className="text-[#d84c23]">*</span>
                </label>
                <span className="text-[#8892a0]">{name.length}/40</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Chess, Robotics, Film, MCU, etc."
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
              />
              <p className="font-mono text-[10px] text-[#8892a0] mt-1">
                "Community" will be automatically appended if not already present.
              </p>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono text-xs font-bold uppercase text-[#141c2b]">
                <label>Description <span className="text-[#d84c23]">*</span></label>
                <span className="text-[#8892a0]">{description.length}/300</span>
              </div>
              <textarea
                placeholder="Describe what your community is about, meetups, collaborations, and who should join..."
                maxLength={300}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b] resize-none"
              />
            </div>

            {/* Social Links */}
            <div className="pt-3 border-t-2 border-[#141c2b] space-y-4">
              <span className="font-mono text-xs font-bold uppercase text-[#141c2b] block">
                Social Links & Group Invites
              </span>

              {/* WhatsApp */}
              <div>
                <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#141c2b] mb-1">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp Group Invite URL</span><span className="text-[#d84c23] font-bold">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/your-invite-code"
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-mono text-xs focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#141c2b] mb-1">
                  <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                  <span>Instagram Handle / Profile URL</span><span className="text-[#8892a0] font-normal">— Optional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/your_community"
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-mono text-xs focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action w-full font-mono uppercase tracking-wider font-bold cursor-pointer"
              style={{ padding: "0.9rem 1.5rem" }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Launching Community...</span>
                </div>
              ) : (
                <span>Launch Community →</span>
              )}
            </button>
          </form>
        </div>

        {/* Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-[#141c2b]">
            <span>Live Noticeboard Preview</span>
            <span className="text-[#d84c23] animate-pulse">● Live Sync</span>
          </div>

          <div>
            <CommunityCard
              name={previewName}
              description={
                description.trim() ||
                "Your community description will appear here on the campus noticeboard as you type."
              }
              members={1}
              whatsapp_link={whatsappLink.trim() || undefined}
              instagram_link={instagramLink.trim() || undefined}
              image={bannerPreview || "/default-banner.jpg"}
              isPreview={true}
            />
          </div>

          <div className="p-4 bg-[#eae2d5] border-2 border-[#141c2b] rounded-sm font-mono text-xs text-[#141c2b] leading-relaxed shadow-[2px_2px_0px_#141c2b]">
            <b>★ VERTEX NOTICEBOARD NOTE:</b> When launched, your community immediately appears in the campus communities list with announcements, member list, and direct social links.
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCommunity
