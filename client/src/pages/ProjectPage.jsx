import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import NotesPanel from '../components/NotesPanel';
import FilesPanel from '../components/FilesPanel';
import OverviewPanel from '../components/OverviewPanel';

const TABS = ['Overview', 'Notes', 'Files'];

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [error, setError] = useState('');

  const load = () =>
    api
      .getProject(id)
      .then(setProject)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, [id]);

  const remove = async () => {
    if (!confirm('Delete this project with all its notes and files?')) return;
    try {
      await api.deleteProject(id);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    }
  };

  if (error && !project) return <div className="container"><p className="error">{error}</p></div>;
  if (!project) return <div className="container"><p className="muted">Loading…</p></div>;

  return (
    <div className="container">
      <div className="row between">
        <div>
          <h2>{project.name}</h2>
          <p className="muted">{project.description}</p>
        </div>
        {project.isOwner && <button className="btn btn-danger" onClick={remove}>Delete project</button>}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewPanel project={project} reload={load} />}
      {tab === 'Notes' && <NotesPanel projectId={id} />}
      {tab === 'Files' && <FilesPanel projectId={id} />}
    </div>
  );
}
