export function formatScore(score) {
  return (score || 0).toLocaleString();
}

export function getRankSuffix(rank) {
  if (rank === 1) return 'st';
  if (rank === 2) return 'nd';
  if (rank === 3) return 'rd';
  return 'th';
}
