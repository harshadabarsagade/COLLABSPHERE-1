import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Markdown from './Markdown';
import AiResult from './AiResult';

// Overview tab: analytics, members, README generator, public share
export default function OverviewPanel({ project, reload }) {
  const [analytics, setAnalytics] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [ai, setAi] = useState({ loading: false, error: '', result: '' });
  const [overview, setOverview] = useState('');

  useEffect(() => {
    api.getAnalytics(project._id).then(setAnalytics).catch((e) => setError(e.message));
  }, [project._id]);

  const publicUrl = project.publicId ? `${window.location.origin}/p/${project.publicId}` : '';

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.addMember(project._id, email);
      setEmail('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (id) => {
    try {
      await api.removeMember(project._id, id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleShare = async () => {
    try {
      await api.toggleShare(project._id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const genReadme = async () => {
    const input = `Name: ${project.name}\nDescription: ${project.description}\n\n${overview}`;
    setAi({ loading: true, error: '', result: '' });
    try {
      const { result } = await api.readme(input);
      setAi({ loading: false, error: '', result });
    } catch (e) {
      setAi({ loading: false, error: e.message, result: '' });
    }
  };

  const saveReadme = async (text) => {
    try {
      await api.updateProject(project._id, { readme: text });
      setInfo('README saved to project');
      reload();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="grid2">
      <div className="card">
        <h3>Contribution analytics</h3>
        {analytics ? (
          <>
            <div className="stats">
              <div><b>{analytics.totalNotes}</b><span>Notes</span></div>
              <div><b>{analytics.totalFiles}</b><span>Files</span></div>
              <div><b>{analytics.contributors.length}</b><span>Members</span></div>
            </div>
            <table className="table">
              <thead><tr><th>Member</th><th>Notes</th><th>Files</th></tr></thead>
              <tbody>
                {analytics.contributors.map((c) => (
                  <tr key={c.userId}><td>{c.name}</td><td>{c.notes}</td><td>{c.files}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </div>

      <div className="card">
        <h3>Team</h3>
        <ul className="list plain">
          <li>{project.owner.name} <span className="badge">Owner</span></li>
          {project.members.map((m) => (
            <li key={m._id}>
              {m.name} <small className="muted">{m.email}</small>
              {project.isOwner && (
                <button className="icon-btn" onClick={() => removeMember(m._id)} title="Remove">✕</button>
              )}
            </li>
          ))}
        </ul>
        {project.isOwner && (
          <form className="row" onSubmit={addMember}>
            <input
              className="input"
              type="email"
              placeholder="Member email (must be registered)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn">Add</button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h3>Public page</h3>
        {project.isOwner ? (
          <>
            <p className="muted small">Public page is read-only and shows the name, description and README.</p>
            <button className="btn" onClick={toggleShare}>
              {project.isPublic ? 'Make private' : 'Make public'}
            </button>
          </>
        ) : (
          <p className="muted small">Only the owner can change sharing.</p>
        )}
        {project.isPublic && publicUrl && (
          <p>
            <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
          </p>
        )}
      </div>

      <div className="card">
        <h3>README</h3>
        {project.readme ? <Markdown text={project.readme} /> : <p className="muted">No README yet.</p>}
        {project.isOwner && (
          <>
            <textarea
              className="input"
              rows={3}
              placeholder="Optional: add tech stack, features, or a code overview to help Gemini write the README"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
            />
            <button className="btn" onClick={genReadme}>✨ Generate README with Gemini</button>
            <AiResult
              {...ai}
              onClear={() => setAi({ loading: false, error: '', result: '' })}
              onUse={saveReadme}
              useLabel="Save as project README"
            />
            {info && <p className="success">{info}</p>}
          </>
        )}
      </div>
    </div>
  );
}
