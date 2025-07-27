'use client';

import { generateShoppingList, type GenerateShoppingListOutput } from '@/ai/flows/generate-shopping-list';
import { suggestMeals, type SuggestMealsInput, type SuggestMealsOutput } from '@/ai/flows/suggest-meals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UtensilsCrossed, ShoppingCart, Loader2, ChefHat, ListPlus } from 'lucide-react';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';

export default function MealPlanner() {
  const [mealPending, startMealTransition] = useTransition();
  const [shoppingPending, startShoppingTransition] = useTransition();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('meals');
  const [mealQuery, setMealQuery] = useState('What can I cook with my recent purchases?');
  const [mealResult, setMealResult] = useState<SuggestMealsOutput | null>(null);
  const [receiptItems, setReceiptItems] = useState<string[]>([]);
  const [pantryItems, setPantryItems] = useState<string[]>([]);

  const [shoppingQuery, setShoppingQuery] = useState('Pasta Carbonara');
  const [shoppingResult, setShoppingResult] = useState<GenerateShoppingListOutput | null>(null);

  useEffect(() => {
    const qReceipts = query(collection(db, 'receipts'));
    const unsubscribeReceipts = onSnapshot(qReceipts, (querySnapshot) => {
        const items: string[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.items) {
                data.items.forEach((item: { name: string; }) => items.push(item.name));
            }
        });
        setReceiptItems([...new Set(items)]); // Store unique item names
    });

    const qPantry = query(collection(db, 'pantryItems'));
    const unsubscribePantry = onSnapshot(qPantry, (querySnapshot) => {
      const items: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name) {
          items.push(data.name);
        }
      });
      setPantryItems([...new Set(items)]);
    });

    return () => {
        unsubscribeReceipts();
        unsubscribePantry();
    };
  }, []);

  const handleShoppingList = useCallback(() => {
    if (!shoppingQuery) {
      toast({
        variant: 'destructive',
        title: 'Empty query',
        description: 'Please enter a dish to get a shopping list.',
      });
      return;
    }
    setShoppingResult(null);
    startShoppingTransition(async () => {
      try {
        const response = await generateShoppingList({ dish: shoppingQuery, pantryItems });
        setShoppingResult(response);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Failed to generate list',
          description: 'Could not generate shopping list. Please try again.',
        });
      }
    });
  }, [shoppingQuery, toast, pantryItems]);

  const handleMealSuggestion = () => {
    if (!mealQuery) {
      toast({
        variant: 'destructive',
        title: 'Empty query',
        description: 'Please enter a question to get meal suggestions.',
      });
      return;
    }
     if(receiptItems.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No ingredients found',
            description: 'Please scan some receipts first to get meal suggestions based on your purchases.',
        });
        return;
    }
    setMealResult(null);
    startMealTransition(async () => {
      try {
        const response = await suggestMeals({ query: mealQuery, recentPurchases: receiptItems });
        setMealResult(response);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Failed to get suggestions',
          description: 'Could not get meal suggestions. Please try again.',
        });
      }
    });
  };

  const handleMealSelectForShopping = (meal: string) => {
    setShoppingQuery(meal);
    setActiveTab('shopping');
  };

  useEffect(() => {
    if (activeTab === 'shopping' && shoppingQuery && !shoppingResult && !shoppingPending) {
        handleShoppingList();
    }
  // We only want to run this when the tab switches to shopping with a new query
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, shoppingQuery]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal & Shopping Helper</CardTitle>
        <CardDescription>Get meal ideas based on your purchases or generate a shopping list.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meals"><ChefHat className="mr-2 h-4 w-4" /> Suggest Meals</TabsTrigger>
            <TabsTrigger value="shopping"><ShoppingCart className="mr-2 h-4 w-4" /> Shopping List</TabsTrigger>
          </TabsList>
          <TabsContent value="meals" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., What can I cook this week?"
                value={mealQuery}
                onChange={(e) => setMealQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMealSuggestion()}
              />
              <Button onClick={handleMealSuggestion} disabled={mealPending} aria-label="Get Meal Suggestions">
                {mealPending ? <Loader2 className="animate-spin" /> : <UtensilsCrossed />}
              </Button>
            </div>
            {mealResult && (
              <div className="space-y-2 rounded-lg border p-4">
                <h4 className="font-semibold">Suggested Meals:</h4>
                 {mealResult.meals.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm">
                    {mealResult.meals.map((meal, index) => (
                        <li key={index} className="flex items-center justify-between">
                        <span>{meal}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleMealSelectForShopping(meal)} aria-label={`Get shopping list for ${meal}`}>
                            <ListPlus className="mr-2 h-4 w-4" />
                            Get List
                        </Button>
                        </li>
                    ))}
                    </ul>
                 ) : (
                    <p className="text-sm text-muted-foreground">Could not suggest any meals based on your recent purchases.</p>
                 )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="shopping" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Pasta Carbonara"
                value={shoppingQuery}
                onChange={(e) => setShoppingQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShoppingList()}
              />
              <Button onClick={handleShoppingList} disabled={shoppingPending} aria-label="Get Shopping List">
                {shoppingPending ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
              </Button>
            </div>
            {shoppingResult && (
              <div className="space-y-2 rounded-lg border p-4">
                <h4 className="font-semibold">Shopping List for {shoppingQuery}:</h4>
                {shoppingResult.shoppingList.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {shoppingResult.shoppingList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">You have all the ingredients for this dish!</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}