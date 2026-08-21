import { useState } from "react"
import { useNavigate } from "react-router"
import { supabase } from "../lib/supabase"

function ProfileSetup() {
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState("")
  const [batch, setBatch] = useState("")
  const [course, setCourse] = useState("")
  const [section, setSection] = useState("")
  const [instagram, setInstagram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setLoading(true)
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to create a profile.")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        batch: batch,
        course: course,
        section: section,
        links: {
          instagram,
          linkedin,
        },
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error saving profile:", error)
      setError("Could not save your profile.")
    } else {
      navigate("/profile")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-2 text-3xl font-bold">
          Set Up Your Profile
        </h1>

        <p className="mb-6 text-gray-600">
          Tell other students a little about yourself.
        </p>

        {/* Display Name */}
        <div className="mb-4">
          <label className="mb-1 block font-medium">
            Display Name
          </label>

          <input
            type="text"
            value={displayName}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
            placeholder="Your name"
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        {/* Batch */}
        <div className="mb-4">
          <label className="mb-1 block font-medium">
            Batch
          </label>

          <input
            type="text"
            value={batch}
            onChange={(event) =>
              setBatch(event.target.value)
            }
            placeholder="2026"
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        {/* Course */}
        <div className="mb-4">
          <label className="mb-1 block font-medium">
            Course / Branch
          </label>

          <input
            type="text"
            value={course}
            onChange={(event) =>
              setCourse(event.target.value)
            }
            placeholder="Computer Science"
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        {/* Section */}
        <div className="mb-4">
          <label className="mb-1 block font-medium">
            Section
          </label>

          <input
            type="text"
            value={section}
            onChange={(event) =>
              setSection(event.target.value)
            }
            placeholder="A"
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        {/* Instagram */}
        <div className="mb-4">
          <label className="mb-1 block font-medium">
            Instagram
          </label>

          <input
            type="text"
            value={instagram}
            onChange={(event) =>
              setInstagram(event.target.value)
            }
            placeholder="@yourusername"
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        {/* LinkedIn */}
        <div className="mb-6">
          <label className="mb-1 block font-medium">
            LinkedIn
          </label>

          <input
            type="text"
            value={linkedin}
            onChange={(event) =>
              setLinkedin(event.target.value)
            }
            placeholder="LinkedIn profile URL"
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        {error && (
          <p className="mb-4 text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  )
}

export default ProfileSetup