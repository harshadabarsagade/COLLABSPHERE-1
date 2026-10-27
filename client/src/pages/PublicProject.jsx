import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Markdown from '../components/Markdown';

// Read-only public page, no login needed
export default function PublicProject() {
  const { publicId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPublicProject(publicId).then(setProject).catch((e) => setError(e.message));
  }, [publicId]);

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!project) return <div className="container"><p className="muted">Loading…</p></div>;

  return (
    <div className="container narrow">
      <h1>{project.name}</h1>
      <p className="muted">
        by {project.owner?.name} · updated {new Date(project.updatedAt).toLocaleDateString()}
      </p>
      <p>{project.description}</p>
      <hr />
      {project.readme ? <Markdown text={project.readme} /> : <p className="muted">No README published yet.</p>}
    </div>
  );
}
