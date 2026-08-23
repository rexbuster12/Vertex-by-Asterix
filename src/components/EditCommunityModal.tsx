import { useState, useRef, useEffect } from "react"
import { Image as ImageIcon, Sparkles } from "lucide-react"
import { WhatsAppIcon, InstagramIcon } from "./Icons"
import { type MockCommunity } from "../lib/mockStore"

interface Props {
  community: MockCommunity
  onSave: (updates: {
    name: string
    description: string
    image?: string
    whatsapp_link?: string
    instagram_link?: string
  }) => void
  onClose: () => void
}

export default function EditCommunityModal({ community, onSave, onClose }: Props) {
  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description)
  const [whatsappLink, setWhatsappLink] = useState(community.whatsapp_link || "")
  const [instagramLink, setInstagramLink] = useState(community.instagram_link || "")
  const [bannerPreview, setBannerPreview] = useState<string | null>(community.image || null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image must be under 5 MB.")
      return
    }
    setBannerPreview(URL.createObjectURL(file))
    setError(null)
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Community name is required.")
      return
    }

    setSaving(true)
    onSave({
      name: name.trim(),
      description: description.trim(),
      image: bannerPreview || undefined,
      whatsapp_link: whatsappLink.trim() || undefined,
      instagram_link: instagramLink.trim() || undefined,
    })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#141c2b]/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-lg bg-[#faf7f2] sm:rounded-lg rounded-t-lg border-2 border-[#141c2b] shadow-[8px_8px_0px_#141c2b] max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f5f1ea] border-b-2 border-[#141c2b]">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#d84c23] uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              COMMUNITY SETTINGS // NOTICEBOARD
            </span>
            <h2 className="font-serif text-xl font-extrabold text-[#141c2b]">Edit Community</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xs border-1.5 border-[#141c2b] bg-[#faf7f2] font-mono font-bold text-sm text-[#141c2b] hover:bg-[#d84c23] hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="edit-community-form" onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#fbe8e6] border-2 border-[#d84c23] font-mono text-xs font-bold text-[#d84c23] rounded-xs shadow-[2px_2px_0px_#d84c23]">
                ⚠ {error}
              </div>
            )}

            {/* Banner Image */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
                Community Banner
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-36 bg-[#f5f1ea] border-2 border-dashed border-[#141c2b] rounded-xs flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors overflow-hidden group shadow-[2px_2px_0px_#141c2b]"
                title="Click to update banner photo"
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#141c2b]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-xs font-bold">
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
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Community Name <span className="text-[#d84c23]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b]"
              />
            </div>

            {/* Description / Bio */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1">
                Community Description / Bio
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="What is this community about..."
                className="w-full px-3.5 py-2.5 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-sm text-[#141c2b] focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b] resize-none"
              />
            </div>

            {/* WhatsApp Link */}
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#141c2b] mb-1">
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp Group URL</span>
              </label>
              <input
                type="url"
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
              />
            </div>

            {/* Instagram Link */}
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#141c2b] mb-1">
                <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                <span>Instagram Profile URL</span>
              </label>
              <input
                type="url"
                value={instagramLink}
                onChange={(e) => setInstagramLink(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b]"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#f5f1ea] border-t-2 border-[#141c2b]">
          <button
            type="button"
            onClick={onClose}
            className="secondary-action text-xs font-mono cursor-pointer"
            style={{ padding: "0.55rem 1.1rem" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-community-form"
            disabled={saving}
            className="primary-action text-xs font-mono cursor-pointer"
            style={{ padding: "0.55rem 1.4rem" }}
          >
            {saving ? "Saving..." : "Save Community →"}
          </button>
        </div>
      </div>
    </div>
  )
}
