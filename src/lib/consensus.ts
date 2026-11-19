import type { PointValue } from "./points";

/** Returns every point value tied for the highest frequency, sorted ascending. */
export function mostFrequentVotes(votes: PointValue[]): PointValue[] {
  if (votes.length === 0) return [];
  const counts = new Map<PointValue, number>();
  for (const vote of votes) {
    counts.set(vote, (counts.get(vote) ?? 0) + 1);
  }
  let bestCount = 0;
  for (const count of counts.values()) {
    if (count > bestCount) bestCount = count;
  }
  return [...counts.entries()]
    .filter(([, count]) => count === bestCount)
    .map(([vote]) => vote)
    .sort((a, b) => a - b);
}

export function formatMostCommon(votes: PointValue[]): string | null {
  const modes = mostFrequentVotes(votes);
  if (modes.length === 0) return null;
  return modes.join(", ");
}
