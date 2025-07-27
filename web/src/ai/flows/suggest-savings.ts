'use server';
/**
 * @fileOverview This file implements the Genkit flow for suggesting savings opportunities to users based on their spending habits.
 *
 * - suggestSavingsOpportunities - A function that suggests savings opportunities based on user spending habits.
 * - SuggestSavingsOpportunitiesInput - The input type for the suggestSavingsOpportunities function.
 * - SuggestSavingsOpportunitiesOutput - The return type for the suggestSavingsOpportunities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSavingsOpportunitiesInputSchema = z.object({
  spendingData: z.string().describe('A detailed record of the user\'s spending habits, including categories, amounts, and frequencies.'),
  userPreferences: z.string().optional().describe('Optional user preferences or constraints that may affect savings suggestions.'),
});
export type SuggestSavingsOpportunitiesInput = z.infer<typeof SuggestSavingsOpportunitiesInputSchema>;

const SuggestSavingsOpportunitiesOutputSchema = z.object({
  savingsSuggestions: z.array(
    z.object({
      category: z.string().describe('The spending category the suggestion applies to.'),
      suggestion: z.string().describe('A specific suggestion for saving money in this category.'),
      estimatedSavings: z.string().describe('An estimate of how much money the user could save by following this suggestion.'),
    })
  ).describe('A list of personalized savings suggestions.'),
  summary: z.string().describe('A summary of the savings opportunities.'),
  isTrendingUp: z.boolean().describe('Whether the user\'s spending is trending up or not.'),
});
export type SuggestSavingsOpportunitiesOutput = z.infer<typeof SuggestSavingsOpportunitiesOutputSchema>;

export async function suggestSavingsOpportunities(input: SuggestSavingsOpportunitiesInput): Promise<SuggestSavingsOpportunitiesOutput> {
  return suggestSavingsOpportunitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSavingsOpportunitiesPrompt',
  input: {schema: SuggestSavingsOpportunitiesInputSchema},
  output: {schema: SuggestSavingsOpportunitiesOutputSchema},
  prompt: `You are a personal finance advisor who analyzes user spending data and suggests ways to save money.

  Analyze the following spending data and provide personalized savings suggestions, including estimated savings where possible.

  Spending Data: {{{spendingData}}}
  User Preferences: {{{userPreferences}}}

  Consider suggesting cheaper alternatives for frequently purchased items, identifying recurring subscriptions that could be cancelled, and other relevant savings opportunities.

  Output should be structured as a JSON object containing a list of savings suggestions, a summary of the savings opportunities, and whether the user\'s spending is trending up or not.
  The savingsSuggestions field should contain a category, a suggestion, and an estimated savings.
  `,
});

const suggestSavingsOpportunitiesFlow = ai.defineFlow(
  {
    name: 'suggestSavingsOpportunitiesFlow',
    inputSchema: SuggestSavingsOpportunitiesInputSchema,
    outputSchema: SuggestSavingsOpportunitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);