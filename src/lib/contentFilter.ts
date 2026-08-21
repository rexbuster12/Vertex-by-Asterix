/**
 * contentFilter.ts
 * Client-side content screening for Vertex.
 * Checks text for inappropriate content before any Supabase write.
 */

// Curated blocklist — English profanity + common Hinglish slurs
// Kept intentionally minimal but effective for a campus demo.
const BLOCKED_TERMS = [
  // English profanity
  "fuck", "f**k", "fck", "fucker", "fucking", "fucked",
  "shit", "sh!t", "sht",
  "bitch", "b!tch",
  "ass", "asshole", "arse",
  "bastard",
  "cunt", "c*nt",
  "dick", "d!ck",
  "cock", "c0ck",
  "pussy",
  "whore",
  "slut",
  "nigger", "nigga",
  "faggot", "fag",
  "retard",
  "rape", "rapist",
  "nazi",
  "kill yourself", "kys",
  "suicide",
  "porn", "porno", "pornography",
  "sex", "sexy", "nsfw",
  "nude", "nudes",
  "masturbat",
  "pedophile", "pedo",
  // Hinglish / Hindi slang
  "bhosdike", "bhosdi", "bsdk",
  "madarchod", "mc",
  "behenchod", "bc",
  "chutiya", "chutiye", "chut",
  "lund", "lauda",
  "gaand", "gand",
  "randi",
  "harami",
  "kamina",
  "saala",
  "bakwaas",
]

/** Normalise text: lowercase + remove most special chars to catch l33t-speak */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // strip punctuation
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/@/g, "a")
    .replace(/!/g, "i")
    .replace(/\*/g, "")
}

export interface ScreenResult {
  ok: boolean
  reason?: string
}

/**
 * Screen a single string for inappropriate content.
 * Returns { ok: true } if clean, or { ok: false, reason } if flagged.
 */
export function screenText(text: string): ScreenResult {
  if (!text || !text.trim()) return { ok: true }
  const normed = normalise(text)
  for (const term of BLOCKED_TERMS) {
    const normedTerm = normalise(term)
    if (normed.includes(normedTerm)) {
      return {
        ok: false,
        reason: `Content contains inappropriate language. Please keep Vertex respectful.`,
      }
    }
  }
  return { ok: true }
}

/**
 * Screen multiple fields at once. Returns first failure found.
 */
export function screenFields(
  fields: { label: string; value: string }[]
): ScreenResult {
  for (const field of fields) {
    const result = screenText(field.value)
    if (!result.ok) {
      return {
        ok: false,
        reason: `Your ${field.label} contains inappropriate language. Please keep Vertex respectful.`,
      }
    }
  }
  return { ok: true }
}

/**
 * Validate a WhatsApp group invite link.
 * Must be a chat.whatsapp.com link.
 */
export function validateWhatsAppLink(url: string): ScreenResult {
  if (!url || !url.trim()) return { ok: true } // optional field
  try {
    const parsed = new URL(url)
    if (
      parsed.hostname !== "chat.whatsapp.com" &&
      !parsed.hostname.endsWith(".whatsapp.com")
    ) {
      return {
        ok: false,
        reason: "WhatsApp link must be a valid chat.whatsapp.com invite URL.",
      }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      reason: "WhatsApp link is not a valid URL.",
    }
  }
}

/**
 * Validate an Instagram profile or post URL.
 */
export function validateInstagramLink(url: string): ScreenResult {
  if (!url || !url.trim()) return { ok: true } // optional field
  try {
    const parsed = new URL(url)
    if (
      parsed.hostname !== "instagram.com" &&
      parsed.hostname !== "www.instagram.com"
    ) {
      return {
        ok: false,
        reason: "Instagram link must be a valid instagram.com URL.",
      }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      reason: "Instagram link is not a valid URL.",
    }
  }
}

/**
 * Validate a LinkedIn profile URL.
 */
export function validateLinkedInLink(url: string): ScreenResult {
  if (!url || !url.trim()) return { ok: true } // optional field
  try {
    const parsed = new URL(url)
    if (
      parsed.hostname !== "linkedin.com" &&
      parsed.hostname !== "www.linkedin.com"
    ) {
      return {
        ok: false,
        reason: "LinkedIn link must be a valid linkedin.com URL.",
      }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      reason: "LinkedIn link is not a valid URL.",
    }
  }
}
