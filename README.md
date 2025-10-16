# Copilot Chat Summarizer

## Objectif

Automatiser la réduction/résumé de l'historique de conversation Copilot Chat pour garder le contexte pertinent tout en respectant un budget (tokens).

## Fonctionnement

- Surveille un fichier d'historique JSON (configurable) dans le workspace ouvert.
- Quand le total estimé de tokens dépasse `maxTokens`, les N messages les plus anciens sont résumés via l'API OpenAI (GPT‑4.1) et remplacés par un message "Résumé automatique".
- Vous pouvez forcer le résumé via la commande "Copilot Summarizer: Force summarize now".

## Installation (développement)

1. Clonez le repo et lancez `npm install`.
2. Compilez : `npm run compile`.
3. Lancez la fenêtre d'extension (F5) dans VS Code.

## Configuration

- `copilotSummarizer.historyFilePath` : chemin relatif vers le fichier d'historique.
- `copilotSummarizer.maxTokens` : seuil avant résumé.
- `copilotSummarizer.batchSize` : nombre de messages anciens à résumer.
- `copilotSummarizer.openaiApiKeyEnv` : nom de la variable d'environnement contenant la clé OpenAI.

## Limitations et remarques

- Cette extension suppose qu'il existe un fichier JSON d'historique. 
- L'estimation des tokens est approximative. Pour précision, intégrer tiktoken.
- L'usage d'OpenAI implique une clé API et coûts associés.

## Prochaines étapes possibles

- Intégration embeddings + retrieval pour sélection top-k des chunks pertinents.
- UI : panneau WebView affichant "Résumé en cours" et bouton "Voir historique complet".
- Si accès à l'API Copilot Chat, adapter pour lire/mettre à jour le store natif.
