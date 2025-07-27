import { Wallet } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:flex" />
        <div className="rounded-lg bg-primary p-2 text-primary-foreground md:hidden">
          <Wallet className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground md:hidden">WalletWise AI</h1>
      </div>
    </header>
  );
}