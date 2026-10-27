import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Renders Markdown safely (sanitized to prevent XSS)
export default function Markdown({ text }) {
  const html = DOMPurify.sanitize(marked.parse(text || '', { breaks: true }));
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
