import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({ className, label = "Back" }: { className?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
