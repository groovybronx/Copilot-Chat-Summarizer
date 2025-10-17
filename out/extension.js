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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs_1 = require("fs");
const path_1 = require("path");
const tokenCounter_1 = require("./tokenCounter");
const summarizer_1 = require("./summarizer");
async function activate(context) {
    const config = vscode.workspace.getConfiguration('copilotSummarizer');
    const historyRel = config.get('historyFilePath', '.vscode/copilot-chat-history.json');
    const maxTokens = config.get('maxTokens', 3000);
    const batchSize = config.get('batchSize', 20);
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showWarningMessage('Copilot Summarizer : aucun workspace ouvert.');
        return;
    }
    const historyPath = (0, path_1.resolve)(workspaceFolders[0].uri.fsPath, historyRel);
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    status.text = 'CopilotSummarizer: inactive';
    status.show();
    context.subscriptions.push(status);
    async function processHistoryFile(force = false) {
        if (!(0, fs_1.existsSync)(historyPath)) {
            if (force)
                vscode.window.showInformationMessage(`Fichier d'historique introuvable: ${historyPath}`);
            status.text = 'CopilotSummarizer: waiting for history';
            return;
        }
        const raw = (0, fs_1.readFileSync)(historyPath, 'utf8');
        let messages = [];
        try {
            messages = JSON.parse(raw);
        }
        catch {
            vscode.window.showErrorMessage('Copilot Summarizer: impossible de parser le fichier d\'historique.');
            return;
        }
        const totalTokens = messages.reduce((acc, m) => acc + (0, tokenCounter_1.estimateTokens)(m.content), 0);
        status.text = `CopilotSummarizer: tokens≈${totalTokens}`;
        if (totalTokens > maxTokens || force) {
            status.text = 'CopilotSummarizer: summarizing...';
            // select the oldest batchSize messages to summarize
            const oldest = messages.slice(0, batchSize);
            const rest = messages.slice(batchSize);
            try {
                const summary = await (0, summarizer_1.summarizeMessages)(oldest);
                const summaryMessage = {
                    role: 'system',
                    content: `Résumé automatique des messages antérieurs:\n${summary}`,
                    ts: new Date().toISOString()
                };
                const newMessages = [summaryMessage, ...rest];
                (0, fs_1.writeFileSync)(historyPath, JSON.stringify(newMessages, null, 2), 'utf8');
                vscode.window.showInformationMessage('Copilot Summarizer: résumé généré et appliqué.');
                status.text = `CopilotSummarizer: tokens≈${newMessages.reduce((a, m) => a + (0, tokenCounter_1.estimateTokens)(m.content), 0)}`;
            }
            catch {
                vscode.window.showErrorMessage('Copilot Summarizer: erreur lors du résumé.');
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
