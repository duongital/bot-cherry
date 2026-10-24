import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="card">
        <h1>🍒 404</h1>
        <p className="subtitle">That page rolled away.</p>
        <Link to="/" className="btn">
          Back home
        </Link>
      </div>
    </div>
  );
}
