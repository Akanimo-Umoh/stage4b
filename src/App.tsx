import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom"
import { Login } from "./pages/login"
import { Signup } from "./pages/signup"
import { PublicRoute } from "./routes/PublicRoute"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { Chat } from "./pages/chat"
import { SplashScreen } from "./pages/splash-screen"

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
        </Route>

        <Route element={<PublicRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
