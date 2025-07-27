// This is an AI-powered personal assistant that acts as a comprehensive receipt manager and financial advisor for everyday users.
// This assistant should provide actionable intelligence to users, enabling them to easily track expenses, gain insights into spending, and identify opportunities for savings.

'use server';
/**
 * @fileOverview Analyzes user spending on groceries and suggests savings opportunities.
 *
 * - analyzeGrocerySpending - A function that analyzes grocery spending and provides insights.
 * - AnalyzeGrocerySpendingInput - The input type for the analyzeGrocerySpending function.
 * - AnalyzeGrocerySpendingOutput - The return type for the analyzeGrocerySpending function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeGrocerySpendingInputSchema = z.object({
  query: z
    .string()
    .describe("The user's query about their grocery spending, e.g., \"How much did I spend on groceries last month?\""),
  receiptData: z.array(z.object({
    date: z.string().describe('The date of the receipt in ISO format (YYYY-MM-DD).'),
    items: z.array(z.object({
      name: z.string().describe('The name of the item.'),
      category: z.string().describe('The category of the item, e.g., \"groceries\", \"restaurants\",\"entertainment\", \"hygiene\",\"transportation\", \"utilities\",\"clothes\", \"housing\",\"health\", \"miscellaneous\", etc.'),
      price: z.number().describe('The price of the item.'),
    })).describe('A list of items in the receipt.'),
  })).describe('An array of receipt data.'),
});

export type AnalyzeGrocerySpendingInput = z.infer<typeof AnalyzeGrocerySpendingInputSchema>;

const AnalyzeGrocerySpendingOutputSchema = z.object({
  spendingSummary: z.string().describe('A summary of the user spending.'),
  savingsSuggestions: z.string().describe('Suggestions for saving money.'),
  walletPassTitle: z.string().describe('A title for a wallet pass summarizing the spending analysis.'),
  walletPassBody: z.string().describe('A body for a wallet pass summarizing the spending analysis and savings suggestions.'),
  spendingBreakdown: z.array(z.object({
    category: z.string().describe('The spending category.'),
    totalSpent: z.number().describe('The total amount spent in this category.'),
  })).optional().describe('A breakdown of spending by category.'),
  spendingOverTime: z.array(z.object({
    period: z.string().describe('The time period (e.g., Month Name).'),
    totalSpent: z.number().describe('The total amount spent in this period.'),
  })).optional().describe('A breakdown of spending over time.'),
});

export type AnalyzeGrocerySpendingOutput = z.infer<typeof AnalyzeGrocerySpendingOutputSchema>;

export async function analyzeGrocerySpending(input: AnalyzeGrocerySpendingInput): Promise<AnalyzeGrocerySpendingOutput> {
  return analyzeGrocerySpendingFlow(input);
}

const analyzeGrocerySpendingFlow = ai.defineFlow(
  {
    name: 'analyzeGrocerySpendingFlow',
    inputSchema: AnalyzeGrocerySpendingInputSchema,
    outputSchema: AnalyzeGrocerySpendingOutputSchema,
  },
  async (input) => {
    const prompt = `You are a personal finance advisor. Analyze the user's query and receipt data to provide a spending summary and savings suggestions.

    The receipt data contains a list of receipts, and each receipt contains a list of items with individual categories. Use these item-level categories for your analysis.
    
    Crucially, if the user asks about a specific category (e.g., "travel") and there is no spending data for that category in the specified period, you MUST explicitly state that they spent $0 on that category. Do not provide a summary for a different category instead.

    Based on your analysis, generate a title and a body for a wallet pass that summarizes the user's spending and provides money-saving tips.
    
    Also provide a structured breakdown of spending by category and a summary of spending over time, grouped by month. For spending over time, use the full month name for the 'period' (e.g., "January", "February").

    User Query: ${input.query}
    Receipt Data: ${JSON.stringify(input.receiptData)}

    Return the entire output as a single JSON object.`;

    const { output } = await ai.generate({
        prompt: prompt,
        output: {
            schema: AnalyzeGrocerySpendingOutputSchema,
        },
    });

    return output!;
  }
);