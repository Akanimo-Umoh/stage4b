import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import { HomePage } from "./pages/home"
import { Login } from "./pages/login"
import { Signup } from "./pages/signup"
import { PublicRoute } from "./routes/PublicRoute"
// import { Chat } from "./pages/chat"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { Chat } from "./pages/chat"

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route element={<PublicRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
