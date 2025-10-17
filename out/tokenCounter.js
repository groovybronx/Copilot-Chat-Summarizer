"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = void 0;
function estimateTokens(text) {
    if (!text)
        return 0;
    // heuristique: 1 token ≈ 4 caractères en moyenne
    const chars = text.length;
    return Math.max(1, Math.ceil(chars / 4));
}
exports.estimateTokens = estimateTokens;
