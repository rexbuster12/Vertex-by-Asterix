import { useState, useRef } from "react"
import { X, Image as ImageIcon, Sparkles, Megaphone } from "lucide-react"
import { screenFields } from "../lib/contentFilter"

interface CreateAnnouncementModalProps {
  communityName: string
  isOpen: boolean
  onClose: () => void
  onPublish: (announcement: {
    title: string
    content: string
    tag: string
    image?: string
  }) => void
}

const TAG_OPTIONS = [
  "NOTICE",
  "EVENT",
  "WORKSHOP",
  "URGENT",
  "HACKATHON",
  "MEETING",
  "GENERAL",
]

function CreateAnnouncementModal({
  communityName,
  isOpen,
  onClose,
  onPublish,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tag, setTag] = useState("NOTICE")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Announcement image must be under 5 MB.")
      return
    }
    setImagePreview(URL.createObjectURL(file))
    setErrorMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage("Please enter an announcement title.")
      return
    }
    if (!content.trim()) {
      setErrorMessage("Please enter announcement details.")
      return
    }

    const screen = screenFields([
      { label: "title", value: title },
      { label: "content", value: content },
    ])
    if (!screen.ok) {
      setErrorMessage(screen.reason || "Content did not pass safety screening.")
      return
    }

    onPublish({
      title: title.trim(),
      content: content.trim(),
      tag,
      image: imagePreview || undefined,
    })

    // Reset state
    setTitle("")
    setContent("")
    setTag("NOTICE")
    setImagePreview("")
    setErrorMessage(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[999] bg-[#141c2b]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg max-w-lg w-full shadow-[8px_8px_0px_#141c2b] overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-[#141c2b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#d84c23]" />
            <div>
              <span className="font-mono text-[10px] text-[#8892a0] uppercase tracking-wider block">
                {communityName}
              </span>
              <h2 className="font-serif text-xl font-bold">Publish Announcement</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#fbe8e6] border-2 border-[#d84c23] rounded-xs font-mono text-xs text-[#d84c23] font-bold">
              ⚠ {errorMessage}
            </div>
          )}

          {/* Tag Selector */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
              Announcement Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTag(t)}
                  className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-xs border-2 border-[#141c2b] transition-all cursor-pointer ${tag === t
                    ? "bg-[#141c2b] text-white shadow-[2px_2px_0px_#d84c23]"
                    : "bg-[#f5f1ea] text-[#141c2b] hover:bg-white"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
              Title <span className="text-[#d84c23] font-bold">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hackathon Kickoff Meeting This Friday"
              className="w-full bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs px-3 py-2 text-sm text-[#141c2b] focus:outline-hidden focus:bg-white shadow-[2px_2px_0px_#141c2b]"
              maxLength={120}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
              Announcement Details <span className="text-[#d84c23] font-bold">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the details of the announcement, links, venue, schedule, or rules for members..."
              rows={4}
              className="w-full bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs px-3 py-2 text-sm text-[#141c2b] focus:outline-hidden focus:bg-white shadow-[2px_2px_0px_#141c2b]"
              maxLength={1000}
              required
            />
          </div>

          {/* Optional Image Upload */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#141c2b] mb-1.5">
              Announcement Image <span className="text-[#8892a0] font-normal">— Optional</span>
            </label>
            {imagePreview ? (
              <div className="relative border-2 border-[#141c2b] rounded-xs overflow-hidden h-36 bg-[#141c2b]">
                <img
                  src={imagePreview}
                  alt="Announcement preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview("")}
                  className="absolute top-2 right-2 bg-[#d84c23] text-white p-1 rounded-xs border border-[#141c2b] font-mono text-[10px] uppercase font-bold hover:bg-red-700 cursor-pointer shadow-[1px_1px_0px_#141c2b]"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#141c2b] bg-[#f5f1ea] rounded-xs p-4 text-center cursor-pointer hover:bg-white transition-colors group shadow-[2px_2px_0px_#141c2b]"
              >
                <div className="flex flex-col items-center gap-1 text-[#545e6d] group-hover:text-[#141c2b]">
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-mono text-xs font-bold uppercase">+ Attach Poster / Image</span>
                  <span className="font-mono text-[10px] text-[#8892a0]">JPG, PNG under 5 MB</span>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#d8cebe]">
            <button
              type="button"
              onClick={onClose}
              className="secondary-action font-mono text-xs uppercase"
              style={{ padding: "0.55rem 1.1rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-action font-mono text-xs uppercase inline-flex items-center gap-1.5"
              style={{ padding: "0.55rem 1.25rem" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Broadcast Bulletin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAnnouncementModal
