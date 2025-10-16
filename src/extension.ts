import * as vscode from 'vscode';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { estimateTokens } from './tokenCounter';
import { summarizeMessages } from './summarizer';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts?: string;
}

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('copilotSummarizer');
  const historyRel = config.get<string>('historyFilePath', '.vscode/copilot-chat-history.json');
  const maxTokens = config.get<number>('maxTokens', 3000);
  const batchSize = config.get<number>('batchSize', 20);
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('Copilot Summarizer : aucun workspace ouvert.');
    return;
  }
  const historyPath = resolve(workspaceFolders[0].uri.fsPath, historyRel);
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  status.text = 'CopilotSummarizer: inactive';
  status.show();
  context.subscriptions.push(status);

  async function processHistoryFile(force = false) {
    if (!existsSync(historyPath)) {
      if (force) vscode.window.showInformationMessage(`Fichier d'historique introuvable: ${historyPath}`);
      status.text = 'CopilotSummarizer: waiting for history';
      return;
    }
    let raw = readFileSync(historyPath, 'utf8');
    let messages: ChatMessage[] = [];
    try {
      messages = JSON.parse(raw);
    } catch (e) {
      vscode.window.showErrorMessage('Copilot Summarizer: impossible de parser le fichier d\'historique.');
      return;
    }
    const totalTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
    status.text = `CopilotSummarizer: tokens≈${totalTokens}`;
    if (totalTokens > maxTokens || force) {
      status.text = 'CopilotSummarizer: summarizing...';
      // select the oldest batchSize messages to summarize
      const oldest = messages.slice(0, batchSize);
      const rest = messages.slice(batchSize);
      try {
        const summary = await summarizeMessages(oldest);
        const summaryMessage: ChatMessage = {
          role: 'system',
          content: `Résumé automatique des messages antérieurs:\n${summary}`,
          ts: new Date().toISOString()
        };
        const newMessages = [summaryMessage, ...rest];
        writeFileSync(historyPath, JSON.stringify(newMessages, null, 2), 'utf8');
        vscode.window.showInformationMessage('Copilot Summarizer: résumé généré et appliqué.');
        status.text = `CopilotSummarizer: tokens≈${newMessages.reduce((a,m)=>a+estimateTokens(m.content),0)}`;
      } catch (err) {
        vscode.window.showErrorMessage('Copilot Summarizer: erreur lors du résumé: ' + String(err));
        status.text = 'CopilotSummarizer: error';
      }
    }
  }

  const disposableStart = vscode.commands.registerCommand('copilot-summarizer.start', async () => {
    vscode.window.showInformationMessage('Copilot Summarizer démarré.');
    await processHistoryFile(false);
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolders[0], historyRel));
    watcher.onDidChange(() => processHistoryFile(false));
    watcher.onDidCreate(() => processHistoryFile(false));
    watcher.onDidDelete(() => status.text = 'CopilotSummarizer: waiting for history');
    context.subscriptions.push(watcher);
  });

  const disposableForce = vscode.commands.registerCommand('copilot-summarizer.summarizeNow', async () => {
    await processHistoryFile(true);
  });

  context.subscriptions.push(disposableStart, disposableForce);
}

export function deactivate() {}