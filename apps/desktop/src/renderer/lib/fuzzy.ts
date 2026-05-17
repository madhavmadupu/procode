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
    if (targetLower[i] === queryLower[queryIndex]) {
      indices.push(i);

      // Bonus for matching at word boundaries
      if (i === 0 || targetLower[i - 1] === "/" || targetLower[i - 1] === "-" || targetLower[i - 1] === "_") {
        score += 10;
      }

      // Bonus for consecutive matches
      if (indices.length > 1 && indices[indices.length - 2] === i - 1) {
        score += 5;
      }

      // Bonus for matching uppercase in camelCase
      if (target[i] === target[i].toUpperCase() && target[i] !== target[i].toLowerCase()) {
        score += 3;
      }

      score += 1;
      queryIndex++;
    }
  }

  if (queryIndex < queryLower.length) {
    return null; // Not all query characters matched
  }

  // Penalty for longer matches (prefer shorter spans)
  const span = indices[indices.length - 1] - indices[0] + 1;
  score -= span * 0.5;

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
