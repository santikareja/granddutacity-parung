import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderImageProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function PlaceholderImage({ className, label = "Tampilan Placeholder", ...props }: PlaceholderImageProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl",
        "text-slate-400 group relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <ImageIcon className="w-12 h-12 mb-3 text-slate-300 group-hover:text-brand-accent transition-colors duration-300" />
      <span className="text-sm font-medium tracking-wide">{label}</span>
      <span className="text-xs mt-1 text-slate-400">Silakan ganti dengan gambar asli</span>
    </div>
  );
}
