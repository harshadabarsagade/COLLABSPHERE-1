import { useState } from 'react';
import Markdown from './Markdown';

// Reusable box showing a Gemini result (loading / error / markdown output)
export default function AiResult({ loading, error, result, onClear, onUse, useLabel }) {
  if (!loading && !error && !result) return null;
  return (
    <div className="ai-box">
      <div className="ai-head">
        <strong>✨ Gemini</strong>
        {onClear && (
          <button className="btn btn-ghost btn-sm" onClick={onClear}>
            Close
          </button>
        )}
      </div>
      {loading && <p className="muted">Thinking…</p>}
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <Markdown text={result} />
          <CopyUse result={result} onUse={onUse} useLabel={useLabel} />
        </>
      )}
    </div>
  );
}

function CopyUse({ result, onUse, useLabel }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="row">
      <button
        className="btn btn-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(result);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {onUse && (
        <button className="btn btn-sm" onClick={() => onUse(result)}>
          {useLabel || 'Use this'}
        </button>
      )}
    </div>
  );
}
