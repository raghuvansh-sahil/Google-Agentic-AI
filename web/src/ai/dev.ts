import { config } from 'dotenv';
config();

import '@/ai/flows/scan-receipt.ts';
import '@/ai/flows/generate-shopping-list.ts';
import '@/ai/flows/suggest-savings.ts';
import '@/ai/flows/suggest-meals.ts';
import '@/ai/flows/analyze-spending.ts';
import '@/ai/flows/scan-pantry.ts';
import '@/ai/flows/get-general-suggestions.ts';