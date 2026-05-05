import { useAuth } from "@/context/AuthContext"
import { LoginFormSchema } from "@/validation/rules"
import { isAxiosError } from "axios"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import z from "zod"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value)
    if (hasSubmitted && usernameError) setUsernameError(null)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    if (hasSubmitted && passwordError) setPasswordError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    setUsernameError(null)
    setPasswordError(null)
    setServerError(null)

    const result = LoginFormSchema.safeParse({
      username: username.toLowerCase(),
      password,
    })

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error)
      if (fieldErrors.username) setUsernameError(fieldErrors.username[0])
      if (fieldErrors.password) setPasswordError(fieldErrors.password[0])
      return
    }

    setIsLoading(true)

    try {
      await login(username.toLowerCase(), password)
      navigate("/chat")
    } catch (err) {
      if (isAxiosError(err)) {
        setServerError(
          err.response?.status === 401
            ? "Invalid username or password."
            : "Something went wrong. Please try again."
        )
      } else {
        setServerError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Welcome Back</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <p className="auth-error">{serverError}</p>}

        <div>
          <label className="auth-label">Username</label>
          <input
            value={username}
            onChange={handleUsernameChange}
            className="auth-input"
          />
          {usernameError && (
            <p className="text-xs text-red-400">{usernameError}</p>
          )}
        </div>

        <div>
          <label className="auth-label">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              className="auth-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-[#8696A0]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-400">{passwordError}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="auth-btn">
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-xs text-[#8696A0]">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
