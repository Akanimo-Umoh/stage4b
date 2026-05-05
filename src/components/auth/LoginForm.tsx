import { useAuth } from "@/context/AuthContext"
import { LoginFormSchema } from "@/validation/rules"
import { isAxiosError } from "axios"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import z from "zod"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()

    setUsernameError(null)
    setPasswordError(null)
    setServerError(null)

    const result = LoginFormSchema.safeParse({
      username: username.toLowerCase(),
      password,
    })

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error)
      // const fields = result.error.flatten().fieldErrors
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
        const status = err.response?.status
        if (status === 401) {
          setServerError("Invalid username or password.")
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
    <div className="container mx-6 w-full max-w-100 border md:max-w-1/2">
      <h1 className="title">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <p role="alert" className="error">
            {serverError}
          </p>
        )}

        <div>
          <label htmlFor="login-username">Username</label>
          <input
            type="text"
            id="login-username"
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
          <label htmlFor="login-password">Password</label>

          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            aria-describedby={passwordError ? "password-error" : undefined}
          />

          {passwordError && (
            <p
              id="password-error"
              role="alert"
              className="text-[12px] text-state-error"
            >
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <button
            type="submit"
            data-testid="auth-login-submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <Link to="/signup" className="text-link">
            or sign up here
          </Link>
        </div>
      </form>
    </div>
  )
}
