// src/ai/flows/suggest-meals.ts
'use server';
/**
 * @fileOverview A flow to suggest meals based on recent receipts.
 *
 * - suggestMeals - A function that takes a user query and returns a list of suggested meals.
 * - SuggestMealsInput - The input type for the suggestMeals function.
 * - SuggestMealsOutput - The return type for the suggestMeals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealsInputSchema = z.object({
  query: z
    .string()
    .describe(
      'The user query, e.g., \'What can I cook with the food I bought from the last two weeks?\''
    ),
  recentPurchases: z.array(z.string()).describe('A list of recently purchased ingredients.'),
});
export type SuggestMealsInput = z.infer<typeof SuggestMealsInputSchema>;

const SuggestMealsOutputSchema = z.object({
  meals: z.array(z.string()).describe('A list of suggested meals.'),
  shoppingListPass: z.string().optional().describe('A Google Wallet pass containing a shopping list, in JSON format.'),
});
export type SuggestMealsOutput = z.infer<typeof SuggestMealsOutputSchema>;

export async function suggestMeals(input: SuggestMealsInput): Promise<SuggestMealsOutput> {
  return suggestMealsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealsPrompt',
  input: {schema: SuggestMealsInputSchema},
  output: {schema: SuggestMealsOutputSchema},
  prompt: `You are a helpful personal assistant that suggests meals based on the user's recent purchases.

  The user will provide a query and a list of their recent purchases. You should return a list of suggested meals that can be made with the ingredients from their recent purchases.

  If the user asks for a shopping list, respond with a shoppingListPass in Google Wallet pass format with the items listed in the pass details, otherwise return empty for that field.

  Query: {{{query}}}
  Recent Purchases: {{{recentPurchases}}}`,
});

const suggestMealsFlow = ai.defineFlow(
  {
    name: 'suggestMealsFlow',
    inputSchema: SuggestMealsInputSchema,
    outputSchema: SuggestMealsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);