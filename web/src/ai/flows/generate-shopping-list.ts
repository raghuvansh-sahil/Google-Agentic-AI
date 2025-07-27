'use server';

/**
 * @fileOverview A flow to generate a shopping list based on a dish and add it to Google Wallet.
 *
 * - generateShoppingList - A function that handles the shopping list generation process.
 * - GenerateShoppingListInput - The input type for the generateShoppingList function.
 * - GenerateShoppingListOutput - The return type for the generateShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShoppingListInputSchema = z.object({
  dish: z.string().describe('The name of the dish the user wants to cook.'),
  pantryItems: z.array(z.string()).describe('A list of ingredients the user already has.'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

const GenerateShoppingListOutputSchema = z.object({
  shoppingList: z
    .array(z.string())
    .describe('The list of ingredients needed to cook the dish.'),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

export async function generateShoppingList(
  input: GenerateShoppingListInput
): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: {schema: GenerateShoppingListInputSchema},
  output: {schema: GenerateShoppingListOutputSchema},
  prompt: `You are a helpful assistant that generates shopping lists for users based on the dish they want to cook.

  Generate a shopping list of ingredients needed to cook the following dish.
  
  Crucially, you must exclude items that the user already has in their pantry.

  Dish: {{{dish}}}
  User's Pantry Items: {{#each pantryItems}}- {{{this}}}\n{{/each}}

  The shopping list should be a list of ingredients, each on a new line.
  If all ingredients are already in the pantry, return an empty shopping list.
  `,
});

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);