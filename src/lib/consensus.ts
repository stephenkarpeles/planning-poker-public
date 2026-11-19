import type { PointValue } from "./points";

/** Returns the mode among Fibonacci options; ties break toward the lower value. */
export function mostFrequentVote(votes: PointValue[]): PointValue | null {
  if (votes.length === 0) return null;
  const counts = new Map<PointValue, number>();
  for (const vote of votes) {
    counts.set(vote, (counts.get(vote) ?? 0) + 1);
  }
  let best: PointValue | null = null;
  let bestCount = -1;
  for (const [vote, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== null && vote < best)
    ) {
      best = vote;
      bestCount = count;
    }
  }
  return best;
}
