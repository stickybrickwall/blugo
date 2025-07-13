// Formats user quiz response to be submitted to OpenAI

export const formatQuizResponses = (
  responses: Record<string, string>
): string => {
  return Object.entries(responses)
    .map(([q, a]) => `- ${q} ${a}`)
    .join('\n');
};