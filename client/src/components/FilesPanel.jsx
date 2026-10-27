import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import AiResult from './AiResult';

const CODE_EXT = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'html', 'css', 'json', 'sql', 'sh', 'md', 'txt', 'yml', 'yaml'];
const ext = (name) => name.split('.').pop().toLowerCase();
const isImage = (f) => f.mimeType.startsWith('image/');
const isText = (f) => f.mimeType.startsWith('text/') || CODE_EXT.includes(ext(f.originalName));
const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

export default function FilesPanel({ projectId }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { file, kind, url|text }
  const [ai, setAi] = useState({ loading: false, error: '', result: '' });
  const inputRef = useRef();

  const load = () => api.getFiles(projectId).then(setFiles).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [projectId]);

  // free object URLs
  useEffect(() => () => preview?.url && URL.revokeObjectURL(preview.url), [preview]);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.uploadFile(projectId, fd);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      inputRef.current.value = '';
    }
  };

  const openPreview = async (file) => {
    setAi({ loading: false, error: '', result: '' });
    setError('');
    try {
      if (isImage(file)) {
        const blob = await api.getFileBlob(projectId, file._id);
        setPreview({ file, kind: 'image', url: URL.createObjectURL(blob) });
      } else if (isText(file)) {
        const { text } = await api.getFileText(projectId, file._id);
        setPreview({ file, kind: 'text', text });
      } else {
        setPreview({ file, kind: 'none' });
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const download = async (file) => {
    try {
      const blob = await api.getFileBlob(projectId, file._id);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (file) => {
    if (!confirm(`Delete ${file.originalName}?`)) return;
    try {
      await api.deleteFile(projectId, file._id);
      if (preview?.file._id === file._id) setPreview(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const runAi = async (kind) => {
    setAi({ loading: true, error: '', result: '' });
    try {
      const { result } = kind === 'docs' ? await api.docs(preview.text) : await api.explain(preview.text, 'code');
      setAi({ loading: false, error: '', result });
    } catch (e) {
      setAi({ loading: false, error: e.message, result: '' });
    }
  };

  return (
    <div className="split">
      <aside className="side">
        <label className="btn full">
          {uploading ? 'Uploading…' : '+ Upload file'}
          <input ref={inputRef} type="file" hidden onChange={upload} disabled={uploading} />
        </label>
        <p className="muted small">Max 5MB per file</p>
        <ul className="list">
          {files.map((f) => (
            <li key={f._id} className={preview?.file._id === f._id ? 'active' : ''}>
              <button className="link-btn" onClick={() => openPreview(f)}>
                {f.originalName}
                <small className="muted"> · {fmtSize(f.size)} · {f.uploadedBy?.name}</small>
              </button>
              <button className="icon-btn" title="Download" onClick={() => download(f)}>⬇</button>
              <button className="icon-btn" title="Delete" onClick={() => remove(f)}>🗑</button>
            </li>
          ))}
          {files.length === 0 && <li className="muted">No files yet</li>}
        </ul>
      </aside>

      <section className="main">
        {error && <p className="error">{error}</p>}
        {!preview && <p className="muted">Select a file to preview it.</p>}
        {preview?.kind === 'image' && <img className="img-preview" src={preview.url} alt={preview.file.originalName} />}
        {preview?.kind === 'none' && <p className="muted">No preview available for this file type. Use download instead.</p>}
        {preview?.kind === 'text' && (
          <>
            <h3>{preview.file.originalName}</h3>
            <pre className="code">{preview.text}</pre>
            <div className="row">
              <button className="btn" onClick={() => runAi('explain')}>✨ Explain this code</button>
              <button className="btn btn-ghost" onClick={() => runAi('docs')}>✨ Generate docs</button>
            </div>
            <AiResult {...ai} onClear={() => setAi({ loading: false, error: '', result: '' })} />
          </>
        )}
      </section>
    </div>
  );
}
