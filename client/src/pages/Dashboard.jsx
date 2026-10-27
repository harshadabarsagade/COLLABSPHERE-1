import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    api
      .getProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createProject(form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="row between">
        <h2>Your projects</h2>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={create}>
          <input className="input" placeholder="Project name (e.g. MyWebApp)" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="input" rows={3} placeholder="Describe the scope of your project" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn">Create project</button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}
      {!loading && projects.length === 0 && <p className="muted">No projects yet. Create your first one!</p>}

      <div className="grid3">
        {projects.map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`} className="card project-card">
            <h3>{p.name}</h3>
            <p className="muted">{p.description || 'No description'}</p>
            <div className="row">
              <span className="badge">{p.owner._id === user._id ? 'Owner' : 'Member'}</span>
              {p.isPublic && <span className="badge badge-green">Public</span>}
              <small className="muted">{p.members.length + 1} member(s)</small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
