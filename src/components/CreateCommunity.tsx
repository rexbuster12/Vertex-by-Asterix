import { useState } from "react"
import { useNavigate } from "react-router"
import { supabase } from "../lib/supabase"
import CommunityCard from "./CommunityCard"
import {
  screenFields,
  validateWhatsAppLink,
  validateInstagramLink,
} from "../lib/contentFilter"

function CreateCommunity() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tagsInput, setTagsInput] = useState("Technology, Campus")
  const [whatsappLink, setWhatsappLink] = useState("")
  const [instagramLink, setInstagramLink] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const tagsArray = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a community name." })
      return
    }

    // ── Content Screening ──────────────────────────────────────────────
    const screenResult = screenFields([
      { label: "community name", value: name },
      { label: "description", value: description },
      { label: "tags", value: tagsInput },
    ])
    if (!screenResult.ok) {
      setStatusMessage({ type: "error", text: screenResult.reason! })
      return
    }

    // ── URL Validation ─────────────────────────────────────────────────
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
      const { error } = await supabase.from("communities").insert([
        {
          name: fullName,
          description: description.trim() || "A campus student community on Vertex.",
          tags: tagsArray,
          members: 1,
          whatsapp_link: whatsappLink.trim() || null,
          instagram_link: instagramLink.trim() || null,
        },
      ])

      if (error) throw error

      setStatusMessage({
        type: "success",
        text: `Community "${fullName}" is now pinned on the Vertex noticeboard! Redirecting...`,
      })
      setTimeout(() => navigate("/communities"), 1200)
    } catch (err: any) {
      console.error("Error creating community:", err)
      setStatusMessage({
        type: "error",
        text:
          err.message ||
          "Failed to pin community. Please check your connection.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="editorial-shell space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b]">
        <span className="font-mono text-xs font-bold text-[#d84c23] uppercase tracking-wider">
          PIN A NEW CIRCLE // NOTICEBOARD REGISTRY
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight mt-1">
          Launch a Campus Community
        </h1>
        <p className="text-sm text-[#545e6d] max-w-2xl mt-1">
          Create an open space for students to meet, collaborate, hack, or discuss shared interests.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-sm border-2 font-mono text-xs font-bold ${
            statusMessage.type === "success"
              ? "bg-[#eae2d5] border-[#141c2b] text-[#141c2b] shadow-[3px_3px_0px_#141c2b]"
              : "bg-[#fbe8e6] border-[#d84c23] text-[#d84c23] shadow-[3px_3px_0px_#d84c23]"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Form (7 cols) ─────────────────────────────────── */}
        <div className="lg:col-span-7 bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-7 shadow-[5px_5px_0px_#141c2b]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Community Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono text-xs font-bold uppercase text-[#141c2b]">
                <label>
                  Circle Name <span className="text-[#d84c23]">*</span>
                </label>
                <span className="text-[#8892a0]">{name.length}/25</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Web3 Developers, Legal Tech Guild, Jazz Collective"
                maxLength={25}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
              />
              <p className="font-mono text-[10px] text-[#8892a0] mt-1">
                "Community" suffix will be automatically attached if not specified.
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                Tags <span className="text-[#8892a0] font-normal">(comma separated)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Coding, AI, Law, Chess, Design, Robotics"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono text-xs font-bold uppercase text-[#141c2b]">
                <label>Description</label>
                <span className="text-[#8892a0]">{description.length}/300</span>
              </div>
              <textarea
                placeholder="Describe what your community is about, upcoming sessions, and who should join..."
                maxLength={300}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-sans font-medium focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b] resize-none"
              />
            </div>

            {/* ── Social Links ──────────────────────────────── */}
            <div className="pt-3 border-t-2 border-[#141c2b] space-y-4">
              <span className="font-mono text-xs font-bold uppercase text-[#141c2b] block">
                Social Links & Invites <span className="text-[#8892a0] font-normal">— Optional</span>
              </span>

              {/* WhatsApp */}
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#141c2b] mb-1">
                  💬 WhatsApp Group Invite URL
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] placeholder-[#8892a0] font-mono text-xs focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#141c2b] mb-1">
                  📸 Instagram Page URL
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
              className="primary-action w-full"
              style={{ padding: "0.9rem 1.5rem" }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Pinning Community to Board...</span>
                </>
              ) : (
                <span>Pin Community to Noticeboard →</span>
              )}
            </button>
          </form>
        </div>

        {/* ── Live Preview (5 cols) ─────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-[#141c2b]">
            <span>Live Bulletin Card Preview</span>
            <span className="text-[#8892a0]">Updates Live</span>
          </div>

          <div>
            <CommunityCard
              name={
                name.trim()
                  ? name.trim().endsWith("Community")
                    ? name.trim()
                    : `${name.trim()} Community`
                  : "Your Community Name"
              }
              description={
                description.trim() ||
                "Your community description will appear here as you type in the form."
              }
              members={1}
              tags={tagsArray.length > 0 ? tagsArray : ["Campus"]}
              whatsapp_link={whatsappLink.trim() || undefined}
              instagram_link={instagramLink.trim() || undefined}
            />
          </div>

          <div className="p-4 bg-[#eae2d5] border-2 border-[#141c2b] rounded-sm font-mono text-xs text-[#141c2b] leading-relaxed shadow-[2px_2px_0px_#141c2b]">
            <b>★ VERTEX DISPATCH NOTE:</b> When submitted, your circle is instantly indexed on the live campus bulletin for students to discover, join, and connect.
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCommunity
