const config = require('../config');

const MAX_INPUT_CHARS = 20000;

async function askGemini(prompt) {
  if (!config.geminiApiKey) {
    const err = new Error('GEMINI_API_KEY is not configured on the server');
    err.status = 500;
    throw err;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.geminiApiKey,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data?.error?.message || 'Gemini API request failed');
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    const err = new Error('Gemini returned an empty response');
    err.status = 502;
    throw err;
  }
  return text;
}

const handler = (buildPrompt, field = 'text') => async (req, res) => {
  try {
    const input = req.body[field];
    if (!input || !String(input).trim()) {
      return res.status(400).json({ message: `'${field}' is required` });
    }
    const trimmed = String(input).slice(0, MAX_INPUT_CHARS);
    const result = await askGemini(buildPrompt(trimmed, req.body));
    res.json({ result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// POST /api/gemini/explain  { text, mode: 'code' | 'note' | 'improve' }
exports.explain = handler((text, body) => {
  if (body.mode === 'improve') {
    return `You are a technical writing assistant. Suggest concrete improvements for the following Markdown note (clarity, structure, missing details). Give a short bullet list of suggestions, then an improved version of the note in Markdown.\n\n---\n${text}`;
  }
  if (body.mode === 'code') {
    return `Explain the following code to a junior developer. Cover: what it does, how it works step by step, and any bugs or improvements. Use Markdown.\n\n\`\`\`\n${text}\n\`\`\``;
  }
  return `Explain the following project note clearly and concisely in Markdown, summarising the key points:\n\n---\n${text}`;
});

// POST /api/gemini/docs  { text }  (code in, documentation out)
exports.docs = handler(
  (text) =>
    `Generate clear developer documentation in Markdown for the following code. Include: overview, function/class descriptions with parameters and return values, and a short usage example.\n\n\`\`\`\n${text}\n\`\`\``
);

// POST /api/gemini/readme  { text }  (project description / code overview in, README out)
exports.readme = handler(
  (text) =>
    `Write a professional README.md in Markdown for this project. Include: title, description, features, tech stack, installation, usage, and contributing sections. Base it only on the information given.\n\nProject info:\n${text}`
);
