import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="container narrow hero">
      <h1>Build together. Document with AI.</h1>
      <p className="muted">
        CollabSphere is a mini GitHub + Notion for developers: projects, markdown notes, file sharing
        and Gemini-powered explanations, docs and READMEs.
      </p>
      <div className="row center">
        {user ? (
          <Link className="btn" to="/dashboard">Go to dashboard</Link>
        ) : (
          <>
            <Link className="btn" to="/register">Get started</Link>
            <Link className="btn btn-ghost" to="/login">Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
