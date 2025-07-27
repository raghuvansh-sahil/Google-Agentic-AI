'use client';

import { useState, useTransition, useEffect } from 'react';
import { getGeneralSuggestions, type GetGeneralSuggestionsOutput } from '@/ai/flows/get-general-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

export default function Suggestion() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [queryText, setQueryText] = useState('Can you help me plan a trip to Goa?');
  const [result, setResult] = useState<GetGeneralSuggestionsOutput | null>(null);
  const [databaseData, setDatabaseData] = useState<string>('');
  const [comprehensiveMode, setComprehensiveMode] = useState(false);

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

        setDatabaseData(JSON.stringify(allData, null, 2));
      } catch (error) {
        console.error("Failed to fetch Firestore data:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load data from the database.',
        });
      }
    };

    fetchAllData();

    const receiptsUnsubscribe = onSnapshot(query(collection(db, 'receipts')), () => fetchAllData());
    const pantryUnsubscribe = onSnapshot(query(collection(db, 'pantryItems')), () => fetchAllData());

    return () => {
      receiptsUnsubscribe();
      pantryUnsubscribe();
    };
  }, [toast]);

  const handleGetSuggestions = () => {
    if (!queryText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty query',
        description: 'Please enter a topic for suggestions.',
      });
      return;
    }

    setResult(null);
    startTransition(async () => {
      try {
        const response = await getGeneralSuggestions({
          query: queryText,
          databaseData,
          comprehensive: comprehensiveMode,
        });
        setResult(response);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Suggestion failed',
          description: 'Could not generate suggestions. Please try again.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Suggestions</CardTitle>
        <CardDescription>Get personalized suggestions for anything, based on your data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Best place to buy cheese"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGetSuggestions()}
            />
            <Button onClick={handleGetSuggestions} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
              <span className="hidden sm:inline">{isPending ? 'Thinking...' : 'Get Suggestions'}</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="comprehensive-mode"
              checked={comprehensiveMode}
              onCheckedChange={setComprehensiveMode}
            />
            <Label htmlFor="comprehensive-mode">Comprehensive Mode</Label>
          </div>
        </div>

        {result && (
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-semibold">Here are some ideas for you:</h4>
            {result.suggestions.length > 0 ? (
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {result.suggestions.map((suggestion, index) => (
                  <AccordionItem value={`item-${index}`} key={suggestion.title ?? index}>
                    <AccordionTrigger>{suggestion.title}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {suggestion.details}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific suggestions found for your query. Try asking something else!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
