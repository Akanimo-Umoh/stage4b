import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div>
      <Link to="/login">Login</Link>
      <Link to="/signup">Signup</Link>
    </div>
  )
}
