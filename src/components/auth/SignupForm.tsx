import { useAuth } from "@/context/AuthContext"
import { RegisterFormSchema } from "@/validation/rules"
import { isAxiosError } from "axios"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function SignupForm() {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[] | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()

    // reset errors
    setUsernameError(null)
    setDisplayNameError(null)
    setPasswordErrors(null)
    setServerError(null)

    // client-side validation
    const result = RegisterFormSchema.safeParse({
      username,
      display_name: displayName,
      password,
    })

    if (!result.success) {
      const fields = result.error.flatten().fieldErrors

      if (fields.username) setUsernameError(fields.username[0])
      if (fields.display_name) setDisplayNameError(fields.display_name[0])
      if (fields.password) {
        const raw = fields.password[0]
        try {
          setPasswordErrors(JSON.parse(raw))
        } catch {
          setPasswordErrors([raw])
        }
      }
      return
    }

    setIsLoading(true)

    try {
      await signup(username, displayName, password)
      navigate("/chat")
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        if (status === 409) {
          setServerError("Username already taken.")
        } else if (status === 422) {
          setServerError("Invalid input. Please check your details.")
        } else {
          setServerError("Something went wrong. Please try again.")
        }
      } else {
        setServerError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-6 w-full max-w-100 md:max-w-1/2">
      <h1 className="title">Sign up</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <p role="alert" className="error">
            {serverError}
          </p>
        )}

        <div>
          <label htmlFor="signup-username">Username</label>

          <input
            type="text"
            id="signup-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            aria-describedby={usernameError ? "username-error" : undefined}
          />

          {usernameError && (
            <p
              id="username-error"
              role="alert"
              className="text-[12px] text-state-error"
            >
              {usernameError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-displayName">Display Name</label>

          <input
            type="text"
            id="signup-displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            aria-describedby={
              displayNameError ? "displayname-error" : undefined
            }
          />

          {displayNameError && (
            <p
              id="displayname-error"
              role="alert"
              className="text-[12px] text-state-error"
            >
              {displayNameError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-password">Password</label>
          <input
            type="password"
            id="signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            aria-describedby={passwordErrors ? "password-error" : undefined}
          />

          {passwordErrors && (
            <div className="text-[12px]" id="password-error" role="alert">
              <p className="text-state-error">Password must:</p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                {passwordErrors.map((err: string) => (
                  <li key={err} className="text-state-error">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </button>

          <Link to="/login" className="text-link">
            or login here
          </Link>
        </div>
      </form>
    </div>
  )
}
