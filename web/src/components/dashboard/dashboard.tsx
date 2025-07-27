import MealPlanner from '@/components/dashboard/meal-planner';
import ReceiptScanner from '@/components/dashboard/receipt-scanner';
import SpendingAnalysis from '@/components/dashboard/spending-analysis';
import PantryScanner from '@/components/dashboard/pantry-scanner';
import Suggestions from '@/components/dashboard/suggestion';

export default function Dashboard() {
  return (
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ReceiptScanner />
            <PantryScanner />
          </div>
          <div className="flex flex-col gap-6">
            <SpendingAnalysis />
            <MealPlanner />
            <Suggestions />
          </div>
        </div>
      </main>
  );
}