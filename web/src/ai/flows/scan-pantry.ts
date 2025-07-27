// Scans a pantry image and extracts ingredients.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanPantryInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a pantry or fridge, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanPantryInput = z.infer<typeof ScanPantryInputSchema>;

const ScanPantryOutputSchema = z.object({
  ingredients: z.array(
    z.string()
  ).describe('A list of ingredients found in the image.'),
});
export type ScanPantryOutput = z.infer<typeof ScanPantryOutputSchema>;

export async function scanPantry(input: ScanPantryInput): Promise<ScanPantryOutput> {
  return scanPantryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanPantryPrompt',
  input: {schema: ScanPantryInputSchema},
  output: {schema: ScanPantryOutputSchema},
  prompt: `You are an AI assistant that identifies ingredients from a pantry or fridge image.

  Analyze the image and extract a list of all food items and ingredients you can identify.
  
  Here is the image: {{media url=photoDataUri}}

  Return the information in JSON format.
  `,
});

const scanPantryFlow = ai.defineFlow(
  {
    name: 'scanPantryFlow',
    inputSchema: ScanPantryInputSchema,
    outputSchema: ScanPantryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);