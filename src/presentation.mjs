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

/** Product feedback uses dedicated tools outside the generic command registry. */
export function withFeedbackDiscovery(capabilities) {
  return {
    ...capabilities,
    feedback: {
      types: ['BugReport', 'FeatureRequest'],
      capabilitiesTool: 'fitness_feedback_capabilities',
      workflowTopic: 'feedback',
      prepareTool: 'fitness_feedback_prepare',
      submitTool: 'fitness_feedback_submit',
      guidance:
        'Check the dedicated capabilities tool for current permissions. If it is missing in ChatGPT, refresh tools in the plugin settings and open a new chat.',
    },
  };
}
