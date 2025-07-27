'use client';

import { scanReceipt, type ScanReceiptOutput } from '@/ai/flows/scan-receipt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanLine, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useTransition, useEffect, useRef } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';

type ReceiptWithId = ScanReceiptOutput & { id: string, date: string };

export default function ReceiptScanner() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [receipts, setReceipts] = useState<ReceiptWithId[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'receipts'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const receiptsData: ReceiptWithId[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receiptsData.push({ 
            id: doc.id, 
            ...data, 
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date 
        } as ReceiptWithId);
      });
      receiptsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReceipts(receiptsData);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScan = () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a receipt image to scan.',
      });
      return;
    }

    startTransition(async () => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (e) => {
        try {
          const photoDataUri = e.target?.result as string;
          if (!photoDataUri) {
            throw new Error('Could not read file.');
          }
          const response = await scanReceipt({ photoDataUri });
          
          await addDoc(collection(db, 'receipts'), {
              ...response,
              date: new Date(response.date)
          });

          // Reset file input after successful scan
          setFile(null);
          setPreview(null);
          if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Scan failed',
            description: 'Could not process the receipt. Please try again.',
          });
        }
      };
    });
  };
  
  const handleClearAll = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "receipts"));
        const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        toast({
            title: 'Receipts cleared',
            description: 'All scanned receipts have been removed from Firestore.',
        });
    } catch (error) {
        console.error("Error clearing receipts: ", error);
        toast({
            variant: 'destructive',
            title: 'Clear failed',
            description: 'Could not clear receipts. Please try again.',
        });
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Receipt Scanner</CardTitle>
        <CardDescription>Upload a photo of your receipt to digitize it instantly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receipt-upload">Upload Receipt</Label>
          <Input id="receipt-upload" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
        </div>
        {preview && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image src={preview} alt="Receipt preview" fill className="object-contain" data-ai-hint="receipt document" />
          </div>
        )}
        <Button onClick={handleScan} disabled={isPending || !file} className="w-full">
          {isPending ? <Loader2 className="animate-spin" /> : <ScanLine />}
          <span>{isPending ? 'Scanning...' : 'Scan Receipt'}</span>
        </Button>
        {receipts.length > 0 && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Scanned Receipts</h3>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {receipts.map((receipt) => (
                <AccordionItem value={receipt.id} key={receipt.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                        <span>{receipt.store}</span>
                        <span className="text-muted-foreground">{new Date(receipt.date).toLocaleDateString()}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 p-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Total: ${receipt.total.toFixed(2)}</span>
                        </div>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receipt.items.map((item, itemIndex) => (
                            <TableRow key={itemIndex}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}