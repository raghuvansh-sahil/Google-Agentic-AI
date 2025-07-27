import AppLayout from "@/components/layout/app-layout";

export default function SuggestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout active="suggestion">{children}</AppLayout>;
}