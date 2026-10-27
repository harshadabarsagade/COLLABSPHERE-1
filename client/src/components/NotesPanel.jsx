import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Markdown from './Markdown';
import AiResult from './AiResult';

export default function NotesPanel({ projectId }) {
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null); // note being edited, or {} for new
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [ai, setAi] = useState({ loading: false, error: '', result: '' });

  const load = () => api.getNotes(projectId).then(setNotes).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [projectId]);

  const open = (note) => {
    setActive(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setAi({ loading: false, error: '', result: '' });
    setError('');
  };

  const save = async () => {
    if (!title.trim()) return setError('Title is required');
    try {
      setError('');
      const saved = active._id
        ? await api.updateNote(projectId, active._id, { title, content })
        : await api.createNote(projectId, { title, content });
      setActive(saved);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (note) => {
    if (!confirm(`Delete note "${note.title}"?`)) return;
    try {
      await api.deleteNote(projectId, note._id);
      if (active?._id === note._id) setActive(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const runAi = async (mode) => {
    if (!content.trim()) return setAi({ loading: false, error: 'Write some note content first', result: '' });
    setAi({ loading: true, error: '', result: '' });
    try {
      const { result } = await api.explain(content, mode);
      setAi({ loading: false, error: '', result });
    } catch (e) {
      setAi({ loading: false, error: e.message, result: '' });
    }
  };

  return (
    <div className="split">
      <aside className="side">
        <button className="btn full" onClick={() => open({})}>+ New note</button>
        <ul className="list">
          {notes.map((n) => (
            <li key={n._id} className={active?._id === n._id ? 'active' : ''}>
              <button className="link-btn" onClick={() => open(n)}>
                {n.title}
                <small className="muted"> · {n.author?.name}</small>
              </button>
              <button className="icon-btn" title="Delete" onClick={() => remove(n)}>🗑</button>
            </li>
          ))}
          {notes.length === 0 && <li className="muted">No notes yet</li>}
        </ul>
      </aside>

      <section className="main">
        {!active ? (
          <p className="muted">Select a note or create a new one.</p>
        ) : (
          <>
            <input
              className="input"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="editor">
              <textarea
                className="input mono"
                placeholder="Write Markdown here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="preview">
                <Markdown text={content} />
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <button className="btn" onClick={save}>Save note</button>
              <button className="btn btn-ghost" onClick={() => runAi('note')}>✨ Explain this note content</button>
              <button className="btn btn-ghost" onClick={() => runAi('improve')}>✨ Suggest improvements</button>
            </div>
            <AiResult
              {...ai}
              onClear={() => setAi({ loading: false, error: '', result: '' })}
            />
          </>
        )}
        {!active && error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}
