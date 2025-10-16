import fetch from 'node-fetch';
import * as vscode from 'vscode';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts?: string;
}

// Appelle l'API OpenAI chat completions pour résumer (GPT-4.1).
export async function summarizeMessages(messages: ChatMessage[]): Promise<string> {
  const config = vscode.workspace.getConfiguration('copilotSummarizer');
  const apiKeyEnv = config.get<string>('openaiApiKeyEnv', 'OPENAI_API_KEY');
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) throw new Error(`Clé API OpenAI introuvable. Exportez ${apiKeyEnv}.`);

  const systemPrompt = `Tu es un assistant qui résume fidèlement une conversation. 
Produis un résumé en français, concis (5-10 phrases), en listant décisions, tâches ouvertes et points clés. 
N'invente rien.`;
  const userText = messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');

  const payload = {
    model: 'gpt-4-1106-preview', // GPT-4.1
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Résumé la conversation suivante :\n\n${userText}` }
    ],
    max_tokens: 1000,
    temperature: 0.2
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur OpenAI API: ${res.status} ${res.statusText} - ${text}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Aucun résumé retourné par l\'API.');
  return content.trim();
}