export function estimateTokens(text: string): number {
  if (!text) return 0;
  // heuristique: 1 token ≈ 4 caractères en moyenne
  const chars = text.length;
  return Math.max(1, Math.ceil(chars / 4));
}