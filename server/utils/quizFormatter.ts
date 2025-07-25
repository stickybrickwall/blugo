// Formats user quiz response to be submitted to OpenAI

export const formatQuizResponses = (
  responses: Record<string, string>
): string => {
  const excludedQuestions = [
    "What is your ideal budget range for a single skincare product?"
  ];
  return Object.entries(responses)
  .filter(([q]) => !excludedQuestions.includes(q))
    .map(([q, a]) => `- ${q} ${a}`)
    .join('\n');
};