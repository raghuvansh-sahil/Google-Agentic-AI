'use client';

import { analyzeGrocerySpending, type AnalyzeGrocerySpendingOutput, type AnalyzeGrocerySpendingInput } from '@/ai/flows/analyze-spending';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { BarChart as BarChartIcon, Lightbulb, Loader2, PieChart } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function SpendingAnalysis() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [queryText, setQueryText] = useState('How much did I spend on groceries last month?');
  const [result, setResult] = useState<AnalyzeGrocerySpendingOutput | null>(null);
  const [receiptData, setReceiptData] = useState<AnalyzeGrocerySpendingInput['receiptData']>([]);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'receipts'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const receipts: AnalyzeGrocerySpendingInput['receiptData'] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
            items: data.items.map((item: any) => ({
                name: item.name,
                category: item.category,
                price: item.price
            }))
        });
      });
      setReceiptData(receipts);
    });
    return () => unsubscribe();
  }, []);

  const runAnalysis = (currentQuery: string) => {
     if (!currentQuery) {
      toast({
        variant: 'destructive',
        title: 'Empty query',
        description: 'Please enter a question about your spending.',
      });
      return;
    }

    if(receiptData.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No receipt data',
            description: 'Please scan some receipts first to analyze your spending.',
        });
        return;
    }
    
    setResult(null);
    startTransition(async () => {
      try {
        const response = await analyzeGrocerySpending({ query: currentQuery, receiptData });
        setResult(response);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Analysis failed',
          description: 'Could not analyze your spending. Please try again.',
        });
        setResult(null);
      }
    });
  }

  const handleTextAnalysis = () => {
    setShowCharts(false);
    runAnalysis(queryText);
  };
  
  const handleChartAnalysis = () => {
    setShowCharts(true);
    runAnalysis("Give me a visual breakdown of my spending by category and over time.");
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Analysis</CardTitle>
        <CardDescription>Ask about your spending habits or get a visual breakdown.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., How much did I spend last week?"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextAnalysis()}
          />
          <Button onClick={handleTextAnalysis} disabled={isPending}>
            {isPending && !showCharts ? <Loader2 className="animate-spin" /> : <BarChartIcon />}
            <span className="hidden sm:inline">{isPending && !showCharts ? 'Analyzing...' : 'Analyze'}</span>
          </Button>
          <Button onClick={handleChartAnalysis} disabled={isPending} variant="outline">
            {isPending && showCharts ? <Loader2 className="animate-spin" /> : <PieChart />}
             <span className="hidden sm:inline">{isPending && showCharts ? 'Analyzing...' : 'Quick Analysis'}</span>
          </Button>
        </div>
        {result && (
          <div className="space-y-4 rounded-lg border p-4">
            {showCharts ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {result.spendingBreakdown && result.spendingBreakdown.length > 0 ? (
                        <div>
                            <h4 className="text-lg font-semibold mb-4 text-center">Spending by Category</h4>
                            <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
                                <RechartsPieChart>
                                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={result.spendingBreakdown} dataKey="totalSpent" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                                        {result.spendingBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                </RechartsPieChart>
                            </ChartContainer>
                        </div>
                      ) : (
                        <div className="col-span-full text-center text-muted-foreground">
                            <p>Not enough data for a category breakdown.</p>
                        </div>
                    )}
                    {result.spendingOverTime && result.spendingOverTime.length > 0 ? (
                        <div>
                           <h4 className="text-lg font-semibold mb-4 text-center">Spending Over Time</h4>
                            <ChartContainer config={{
                                totalSpent: { label: "Total Spent", color: "hsl(var(--chart-1))" }
                            }} className="h-[250px] w-full">
                                <BarChart accessibilityLayer data={result.spendingOverTime}>
                                    <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis />
                                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="totalSpent" fill="var(--color-totalSpent)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </div>
                      ) : (
                         <div className="col-span-full text-center text-muted-foreground">
                            <p>Not enough data for a spending-over-time analysis.</p>
                        </div>
                    )}
                 </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <Badge variant="secondary">Spending Summary</Badge>
                        <p className="text-sm">{result.spendingSummary}</p>
                    </div>
                    <div className="space-y-2">
                        <Badge variant="outline" className="border-accent/50 bg-accent/20 text-accent-foreground">
                            <Lightbulb className="mr-1 h-3 w-3" />
                            Savings Suggestions
                        </Badge>
                        <p className="text-sm">{result.savingsSuggestions}</p>
                    </div>
                </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}