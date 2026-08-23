import { useState } from "react"
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert, X } from "lucide-react"
import { submitReportToDb } from "../lib/supabaseService"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: "profile" | "community"
  targetId: string
  targetName: string
}

const PROFILE_REASONS = [
  "Impersonation or Fake Student Account",
  "Harassment, Bullying or Abusive Behavior",
  "Spam, Scam or Commercial Promotion",
  "Inappropriate Profile Picture or Bio",
  "Academic Dishonesty or Cheating",
  "Hate Speech or Discrimination",
  "Other Policy Violation",
]

const COMMUNITY_REASONS = [
  "Spam, Scam or Misleading Information",
  "Harassment, Bullying or Unmoderated Chat",
  "Inappropriate Content or Banner Image",
  "Unauthorized or Misrepresented Club/Group",
  "Promotion of Prohibited Campus Activities",
  "Hate Speech or Discrimination",
  "Other Community Guideline Violation",
]

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const reasonsList = targetType === "profile" ? PROFILE_REASONS : COMMUNITY_REASONS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      setErrorMsg("Please select a primary reason for the report.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      await submitReportToDb({
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        reason: selectedReason,
        details: details.trim() || undefined,
      })

      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setSelectedReason("")
        setDetails("")
        onClose()
      }, 1800)
    } catch (err: any) {
      console.warn("Report error:", err)
      setErrorMsg("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-[#141c2b]/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_#141c2b] space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[#141c2b] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-[#d84c23]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Campus Safety & Moderation</span>
            </div>
            <h3 className="font-serif text-2xl font-black text-[#141c2b]">
              Report {targetType === "profile" ? "Student Profile" : "Community"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xs hover:bg-[#eae2d5] text-[#545e6d] hover:text-[#141c2b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#eae2d5] border-2 border-[#141c2b] flex items-center justify-center mx-auto text-[#141c2b]">
              <CheckCircle2 className="w-7 h-7 text-[#22c55e]" />
            </div>
            <h4 className="font-serif text-xl font-bold text-[#141c2b]">
              Report Submitted Successfully
            </h4>
            <p className="text-xs text-[#545e6d] max-w-sm mx-auto leading-relaxed">
              Thank you for helping keep Vertex BMU safe and authentic. Campus administrators and student moderators will review this matter confidentially.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target identifier info */}
            <div className="p-3 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs flex items-center justify-between font-mono text-xs">
              <span className="text-[#545e6d] uppercase font-bold">Target:</span>
              <span className="font-bold text-[#141c2b] truncate max-w-[280px]">
                {targetName} ({targetType.toUpperCase()})
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-[#fbe8e6] border-2 border-[#d84c23] rounded-xs text-xs font-mono font-bold text-[#d84c23] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b]">
                Select Primary Reason <span className="text-[#d84c23]">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#141c2b] rounded-xs text-xs font-mono font-bold text-[#141c2b] focus:outline-none shadow-[2px_2px_0px_#141c2b] cursor-pointer"
              >
                <option value="">-- Choose a Violation Category --</option>
                {reasonsList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-[#141c2b]">
                Additional Details / Evidence (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any context, links, screenshots description, or timestamps that will help moderators..."
                className="w-full px-3 py-2 bg-[#f5f1ea] border-2 border-[#141c2b] rounded-xs text-xs font-mono text-[#141c2b] placeholder-[#8892a0] focus:outline-none focus:bg-white shadow-[2px_2px_0px_#141c2b] resize-none"
              />
            </div>

            {/* Notice Footer */}
            <p className="text-[11px] text-[#545e6d] leading-relaxed font-mono">
              🛡️ Reports are strictly confidential and forwarded to the student affairs moderation handler in the database.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#d8cebe]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="secondary-action text-xs font-mono cursor-pointer"
                style={{ padding: "0.55rem 1.1rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="font-mono text-xs font-bold uppercase px-4 py-2.5 bg-[#d84c23] text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
