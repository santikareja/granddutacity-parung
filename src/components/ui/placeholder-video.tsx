import { cn } from "@/lib/utils";

interface PlaceholderVideoProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function PlaceholderVideo({ className, ...props }: PlaceholderVideoProps) {
  return (
    <div 
      className={cn(
        "bg-brand-primary/90 rounded-none w-full h-full relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30 saturate-50 mix-blend-overlay" />
    </div>
  );
}
