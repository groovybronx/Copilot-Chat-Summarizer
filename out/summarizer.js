"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeMessages = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const vscode = __importStar(require("vscode"));
// Appelle l'API OpenAI chat completions pour résumer (GPT-4.1).
async function summarizeMessages(messages) {
    const config = vscode.workspace.getConfiguration('copilotSummarizer');
    const apiKeyEnv = config.get('openaiApiKeyEnv', 'OPENAI_API_KEY');
    const apiKey = process.env[apiKeyEnv];
    if (!apiKey)
        throw new Error(`Clé API OpenAI introuvable. Exportez ${apiKeyEnv}.`);
    const systemPrompt = `Tu es un assistant qui résume fidèlement une conversation. 
Produis un résumé en français, concis (5-10 phrases), en listant décisions, tâches ouvertes et points clés. 
N'invente rien.`;
    const userText = messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
    const payload = {
        model: 'gpt-4-1106-preview',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Résumé la conversation suivante :\n\n${userText}` }
        ],
        max_tokens: 1000,
        temperature: 0.2
    };
    const res = await (0, node_fetch_1.default)('https://api.openai.com/v1/chat/completions', {
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
    if (!content)
        throw new Error('Aucun résumé retourné par l\'API.');
    return content.trim();
}
exports.summarizeMessages = summarizeMessages;
