'use server';

/**
 * @fileOverview A flow to generate general suggestions for the user based on their data.
 *
 * - getGeneralSuggestions - A function that handles the suggestion generation process.
 * - GetGeneralSuggestionsInput - The input type for the getGeneralSuggestions function.
 * - GetGeneralSuggestionsOutput - The return type for the getGeneralSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetGeneralSuggestionsInputSchema = z.object({
  query: z.string().describe('The user\'s query for suggestions.'),
  databaseData: z.string().describe('A JSON string containing all user data from Firestore (receipts, pantry items).'),
  comprehensive: z.boolean().optional().describe('If true, generate a single, detailed suggestion, ignoring user data if not relevant.'),
  isProactive: z.boolean().optional().describe('If true, generate proactive suggestions based on the data without a specific user query.'),
});
export type GetGeneralSuggestionsInput = z.infer<typeof GetGeneralSuggestionsInputSchema>;

const GetGeneralSuggestionsOutputSchema = z.object({
    suggestions: z.array(z.object({
        title: z.string().describe('The brief title of the suggestion.'),
        details: z.string().describe('The detailed explanation of the suggestion.'),
    })).describe('A list of suggestions, each with a title and details.'),
});
export type GetGeneralSuggestionsOutput = z.infer<typeof GetGeneralSuggestionsOutputSchema>;

export async function getGeneralSuggestions(
  input: GetGeneralSuggestionsInput
): Promise<GetGeneralSuggestionsOutput> {
  return getGeneralSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getGeneralSuggestionsPrompt',
  input: {schema: GetGeneralSuggestionsInputSchema},
  output: {schema: GetGeneralSuggestionsOutputSchema},
  prompt: `You are a creative and helpful personal assistant. Your goal is to provide insightful and actionable suggestions to the user.

{{#if isProactive}}
You are in proactive mode. Analyze the user's data to find interesting patterns or opportunities and provide a few helpful suggestions. For example, if they have not bought groceries recently, suggest they might be running low. If they were planning a trip, you could mention a discount. Be creative and helpful.
User's Data (spending habits, pantry items, etc.):
{{{databaseData}}}
{{else}}
User's Query: {{{query}}}

{{#if comprehensive}}
The user has requested a comprehensive, detailed plan. Please provide a single, well-structured suggestion. If the query is about travel, include details like transport options, stay options, and things to do. Your response should be thorough and actionable. You can generate creative titles for different sections of your suggestion like "Choose your vibe" or "Beach Bliss".
{{else}}
Analyze the user's query in the context of their data. Look for trends, habits, and opportunities. Generate a list of relevant suggestions based on this data. For each suggestion, provide a brief, catchy title and a more detailed explanation.

User's Data (spending habits, pantry items, etc.):
{{{databaseData}}}

For example, if the user asks about planning a trip to Goa and their data shows they frequently buy ingredients for Italian food, you might suggest specific Italian restaurants in Goa. If they ask for the best place to buy cheese and their data shows they live in a specific area, suggest a local cheesemonger.
{{/if}}
{{/if}}

Return the response as a JSON object.`,
});

const getGeneralSuggestionsFlow = ai.defineFlow(
  {
    name: 'getGeneralSuggestionsFlow',
    inputSchema: GetGeneralSuggestionsInputSchema,
    outputSchema: GetGeneralSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);