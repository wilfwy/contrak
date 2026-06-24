const OpenAI = require('openai');

const GROQ_API_KEY = process.env.GROK_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

let grok = null;

function getGrok() {
  if (!grok) {
    if (!GROQ_API_KEY) {
      throw new Error('GROK_API_KEY not configured');
    }
    grok = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }
  return grok;
}

function hasGrokKey() {
  return Boolean(GROQ_API_KEY);
}

function parseAIJsonResponse(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket && (firstBrace === -1 || firstBracket < firstBrace)) {
    return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
  }
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
  }
  return JSON.parse(trimmed);
}

async function callGrok(prompt, maxTokens = 2048) {
  const client = getGrok();
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }]
  });
  return completion.choices[0].message.content;
}

module.exports = {
  callGrok,
  hasGrokKey,
  parseAIJsonResponse
};
