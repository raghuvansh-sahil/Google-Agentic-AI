// Scans a receipt image and extracts relevant information.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

const ScanReceiptOutputSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('The name of the item.'),
      price: z.number().describe('The price of the item.'),
      category: z.string().describe('The category of the item (e.g., "Food", "Electronics", "Clothing", "Travel", "Utilities").'),
    })
  ).describe('A list of items on the receipt.'),
  date: z.string().describe('The date on the receipt is in YYYY-MM-DD.'),
  store: z.string().describe('The name of the store.'),
  total: z.number().describe('The total amount on the receipt.'),
});
export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

export async function scanReceipt(input: ScanReceiptInput): Promise<ScanReceiptOutput> {
  return scanReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: {schema: ScanReceiptInputSchema},
  output: {schema: ScanReceiptOutputSchema},
  prompt: `You are an AI assistant that extracts information from a receipt image.

  Analyze the receipt image and extract the following information:

  - Items: A list of items on the receipt. For each item, include:
  - name: The name of the item.
  - price: The price of the item.
  - category: The spending category for the item. Choose from common categories like "groceries", "dining out", "health", "clothing", "transportation", "utilities", "entertainment".
  - Date: The date on the receipt is in YYYY-MM-DD format the date in this type.
  - Store: The name of the store.
  - Total: The total amount on the receipt.

  Here is the receipt image: {{media url=photoDataUri}}

  Return the information in JSON format.
  `,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);