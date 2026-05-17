interface FuzzyMatch {
  score: number;
  indices: number[];
}

export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, indices: [] };

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  const indices: number[] = [];
  let queryIndex = 0;
  let score = 0;

  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    const char = targetLower.charAt(i);
    const queryChar = queryLower.charAt(queryIndex);
    
    if (char === queryChar) {
      indices.push(i);

      // Bonus for matching at word boundaries
      const prevChar = i > 0 ? targetLower.charAt(i - 1) : null;
      if (i === 0 || prevChar === "/" || prevChar === "-" || prevChar === "_") {
        score += 10;
      }

      // Bonus for consecutive matches
      const lastIndex = indices[indices.length - 2];
      if (indices.length > 1 && lastIndex !== undefined && lastIndex === i - 1) {
        score += 5;
      }

      // Bonus for matching uppercase in camelCase
      const originalChar = target.charAt(i);
      if (originalChar === originalChar.toUpperCase() && originalChar !== originalChar.toLowerCase()) {
        score += 3;
      }

      score += 1;
      queryIndex++;
    }
  }

  if (queryIndex < queryLower.length) {
    return null; // Not all query characters matched
  }

  if (indices.length === 0) return { score: 0, indices: [] };

  // Penalty for longer matches (prefer shorter spans)
  const lastIndex = indices[indices.length - 1];
  const firstIndex = indices[0];
  
  if (lastIndex !== undefined && firstIndex !== undefined) {
    const span = lastIndex - firstIndex + 1;
    score -= span * 0.5;
  }

  return { score, indices };
}

export function fuzzyFilter<T>(
  query: string,
  items: T[],
  getSearchText: (item: T) => string,
): { item: T; score: number; indices: number[] }[] {
  if (!query) {
    return items.map((item) => ({ item, score: 0, indices: [] }));
  }

  const results: { item: T; score: number; indices: number[] }[] = [];

  for (const item of items) {
    const text = getSearchText(item);
    const match = fuzzyMatch(query, text);

    if (match) {
      results.push({ item, score: match.score, indices: match.indices });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
