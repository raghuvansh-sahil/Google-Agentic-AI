'use client';

import { scanPantry } from '@/ai/flows/scan-pantry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanLine, Trash2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useTransition, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Badge } from '../ui/badge';

export default function PantryScanner() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'pantryItems'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: string[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data().name);
      });
      setPantryItems([...new Set(items)].sort());
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
        description: 'Please select an image of your pantry or fridge.',
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
          const response = await scanPantry({ photoDataUri });
          
          const batch = writeBatch(db);
          const pantryRef = collection(db, 'pantryItems');
          const currentPantryItems = new Set(pantryItems);

          response.ingredients.forEach(ingredient => {
              if (!currentPantryItems.has(ingredient)) {
                // Use the ingredient itself as the document ID to prevent duplicates
                const docRef = doc(pantryRef, ingredient);
                batch.set(docRef, { name: ingredient });
              }
          });
          await batch.commit();

          toast({
              title: 'Pantry Updated',
              description: `${response.ingredients.length} items identified and added to your pantry.`,
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
            description: 'Could not process the image. Please try again.',
          });
        }
      };
    });
  };
  
  const handleClearAll = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "pantryItems"));
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        toast({
            title: 'Pantry Cleared',
            description: 'All items have been removed from your pantry.',
        });
    } catch (error) {
        console.error("Error clearing pantry: ", error);
        toast({
            variant: 'destructive',
            title: 'Clear failed',
            description: 'Could not clear pantry items. Please try again.',
        });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pantry Scanner</CardTitle>
        <CardDescription>Upload a photo of your fridge or pantry to log your ingredients.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pantry-upload">Upload Photo</Label>
          <Input id="pantry-upload" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
        </div>
        {preview && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image src={preview} alt="Pantry preview" fill className="object-contain" data-ai-hint="fridge food" />
          </div>
        )}
        <Button onClick={handleScan} disabled={isPending || !file} className="w-full">
          {isPending ? <Loader2 className="animate-spin" /> : <ScanLine />}
          <span>{isPending ? 'Scanning...' : 'Scan Pantry'}</span>
        </Button>
        {pantryItems.length > 0 && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Your Pantry</h3>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {pantryItems.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {item}
                    </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}