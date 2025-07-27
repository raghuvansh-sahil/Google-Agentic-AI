'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getGeneralSuggestions, type GetGeneralSuggestionsOutput } from '@/ai/flows/get-general-suggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Wand2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

export default function SuggestionsPage() {
  const [isPending, setIsPending] = useState(true);
  const { toast } = useToast();
  const [result, setResult] = useState<GetGeneralSuggestionsOutput | null>(null);
  const [databaseData, setDatabaseData] = useState<string>('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const receiptsQuery = query(collection(db, 'receipts'));
        const pantryQuery = query(collection(db, 'pantryItems'));

        const [receiptsSnapshot, pantrySnapshot] = await Promise.all([
          getDocs(receiptsQuery),
          getDocs(pantryQuery),
        ]);

        const receipts = receiptsSnapshot.docs.map(doc => doc.data());
        const pantryItems = pantrySnapshot.docs.map(doc => doc.data());

        const allData = {
          receipts,
          pantryItems,
        };
        const jsonData = JSON.stringify(allData, null, 2);
        setDatabaseData(jsonData);
        return jsonData;
      } catch (error) {
        console.error("Failed to fetch Firestore data:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load data from the database.',
        });
        return "{}";
      }
    };

    const handleGetSuggestions = async (data: string) => {
        setIsPending(true);
        setResult(null);
        try {
            const response = await getGeneralSuggestions({ 
                query: 'Give me some proactive, general suggestions based on my data.', 
                databaseData: data,
                comprehensive: false,
                isProactive: true,
            });
            setResult(response);
        } catch (error) {
            console.error(error);
            toast({
            variant: 'destructive',
            title: 'Suggestion failed',
            description: 'Could not generate suggestions. Please try again.',
            });
        } finally {
            setIsPending(false);
        }
    };

    fetchAllData().then(data => {
        handleGetSuggestions(data);
    });

  }, [toast]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <Card>
        <CardHeader>
            <CardTitle>For You</CardTitle>
            <CardDescription>Proactive suggestions and insights tailored to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {isPending ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <p className="ml-4 text-muted-foreground">Generating your suggestions...</p>
                </div>
            ) : result && (
            <div className="space-y-2 rounded-lg border p-4">
                <h4 className="font-semibold flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary"/> Here are some ideas for you:</h4>
                {result.suggestions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                        {result.suggestions.map((suggestion, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>{suggestion.title}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{suggestion.details}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                <p className="text-sm text-muted-foreground">No specific suggestions found for you right now. Try using the app more!</p>
                )}
            </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}