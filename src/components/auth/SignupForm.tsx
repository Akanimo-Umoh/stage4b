import { useAuth } from "@/context/AuthContext"
import { RegisterFormSchema } from "@/validation/rules"
import { isAxiosError } from "axios"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import z from "zod"

export default function SignupForm() {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[] | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setPassword(value)

    if (!hasSubmitted) return

    const result = RegisterFormSchema.pick({ password: true }).safeParse({
      password: value,
    })

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error)
      if (fieldErrors.password) {
        const raw = fieldErrors.password[0]
        try {
          setPasswordErrors(JSON.parse(raw))
        } catch {
          setPasswordErrors([raw])
        }
      }
    } else {
      setPasswordErrors(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    setUsernameError(null)
    setDisplayNameError(null)
    setPasswordErrors(null)
    setServerError(null)

    const result = RegisterFormSchema.safeParse({
      username,
      display_name: displayName,
      password,
    })

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error)

      if (fieldErrors.username) setUsernameError(fieldErrors.username[0])
      if (fieldErrors.display_name)
        setDisplayNameError(fieldErrors.display_name[0])

      if (fieldErrors.password) {
        const raw = fieldErrors.password[0]
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
    <div className="auth-card">
      <h1 className="auth-title">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <p className="auth-error">{serverError}</p>}

        <div>
          <label className="auth-label">Username</label>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (usernameError) setUsernameError(null)
            }}
            className="auth-input"
          />
          {usernameError && (
            <p className="text-xs text-red-400">{usernameError}</p>
          )}
        </div>

        <div>
          <label className="auth-label">Display Name</label>
          <input
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              if (displayNameError) setDisplayNameError(null)
            }}
            className="auth-input"
          />
          {displayNameError && (
            <p className="text-xs text-red-400">{displayNameError}</p>
          )}
        </div>

        <div>
          <label className="auth-label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              className="auth-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-[#8696A0]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {passwordErrors && (
            <div className="text-xs">
              <p className="text-red-400">Password must:</p>
              <ul className="ml-4 list-disc text-red-400">
                {passwordErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="auth-btn">
          {isLoading ? "Creating account..." : "Sign up"}
        </button>

        <p className="text-center text-xs text-[#8696A0]">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
