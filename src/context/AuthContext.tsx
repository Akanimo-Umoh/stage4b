import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import api from "@/services/api"
import {
  login as loginService,
  signup as signupService,
} from "@/services/auth.service"
import { getKeyPair } from "@/crypto/storage"
import {
  deriveAesKwKey,
  unwrapPrivateKey,
  importPublicKey,
  fromBase64,
} from "@/crypto/keyPair"

type UserProfile = {
  id: string
  username: string
  display_name: string
  public_key: string
  wrapped_private_key: string
  pbkdf2_salt: string
  created_at: string
}

type AuthState = {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}

type AuthContextType = AuthState & {
  login: (username: string, password: string) => Promise<void>
  signup: (
    username: string,
    display_name: string,
    password: string
  ) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const restoreCryptoSession = async (
  user: UserProfile,
  password?: string
): Promise<void> => {
  // check if keys already in IndexedDB
  const existing = await getKeyPair(user.id)
  if (existing) return // already restored, nothing to do

  // keys not in IndexedDB — need password to re-derive and unwrap
  // this only happens if user cleared IndexedDB manually
  if (!password) return

  const saltBuffer = fromBase64(user.pbkdf2_salt)
  const saltArray = new Uint8Array(saltBuffer) as Uint8Array<ArrayBuffer>
  const aesKwKey = await deriveAesKwKey(password, saltArray)
  const privateKey = await unwrapPrivateKey(
    fromBase64(user.wrapped_private_key),
    aesKwKey
  )
  const publicKey = await importPublicKey(user.public_key)

  const { storeKeyPair } = await import("@/crypto/storage")
  await storeKeyPair(user.id, publicKey, privateKey)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })
  // on mount — check for existing token and restore session
  useEffect(() => {
    const restoreSession = async () => {
      const token = sessionStorage.getItem("token")

      if (!token) {
        setState({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      try {
        const { data } = await api.get<UserProfile>("/auth/me")
        await restoreCryptoSession(data) // restore from IndexedDB if keys exist
        setState({ user: data, isAuthenticated: true, isLoading: false })
      } catch {
        // token is invalid or expired
        sessionStorage.removeItem("token")
        sessionStorage.removeItem("refresh_token")
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }

    restoreSession()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginService({ username, password })
    sessionStorage.setItem("refresh_token", data.refresh_token)
    setState({ user: data.user, isAuthenticated: true, isLoading: false })
  }, [])

  const signup = useCallback(
    async (username: string, display_name: string, password: string) => {
      const data = await signupService({ username, display_name, password })
      sessionStorage.setItem("refresh_token", data.refresh_token)
      setState({ user: data.user, isAuthenticated: true, isLoading: false })
    },
    []
  )

  const logout = useCallback(async () => {
    const storedRefreshToken = sessionStorage.getItem("refresh_token")
    try {
      await api.post("/auth/logout", { refresh_token: storedRefreshToken })
    } catch {
      // proceed with local logout even if server call fails
    } finally {
      sessionStorage.removeItem("token")
      sessionStorage.removeItem("refresh_token")
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = sessionStorage.getItem("refresh_token")
    if (!storedRefreshToken) return

    try {
      const { data } = await api.post("/auth/refresh", {
        refresh_token: storedRefreshToken,
      })
      sessionStorage.setItem("token", data.access_token)
    } catch {
      // refresh failed — log user out
      await logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
