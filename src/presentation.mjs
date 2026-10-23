/** Operational throttling stays on the server. Ordinary agent introductions
 * expose useful capabilities without turning implementation limits into copy. */
export function agentPresentation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const { rateLimits, ...result } = value;
  if (rateLimits?.tier) {
    result.plan = { Free: 'Free', Starter: 'Premium', Pro: 'Coach' }[rateLimits.tier] ?? 'Unknown';
  }
  return result;
}
