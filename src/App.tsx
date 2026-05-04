import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import { HomePage } from "./pages/home"
import { Login } from "./pages/login"
import { Signup } from "./pages/signup"

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App
