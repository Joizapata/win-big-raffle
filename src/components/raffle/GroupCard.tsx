import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export type RaffleGroup = {
  group_number: number;
  numbers: string[];
  taken: boolean;
  buyer_name: string | null;
};

export function GroupCard({
  group,
  selected,
  onSelect,
}: {
  group: RaffleGroup;
  selected: boolean;
  onSelect: (n: number) => void;
}) {
  return (
    <button
      type="button"
      disabled={group.taken}
      onClick={() => onSelect(group.group_number)}
      aria-label={`Grupo ${group.group_number}${group.taken ? " (vendido)" : ""}`}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border-2 p-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        group.taken
          ? "cursor-not-allowed border-border/60 bg-muted/70 opacity-75 grayscale"
          : "border-border bg-card hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl",
        selected && "border-primary ring-2 ring-primary/40 shadow-xl",
      )}
      style={!group.taken ? { boxShadow: "var(--shadow-card)" } : undefined}
    >
      {/* Diagonal VENDIDO stamp */}
      {group.taken && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="rounded-md border-2 border-destructive/60 bg-destructive/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-destructive backdrop-blur-sm"
            style={{ transform: "rotate(-12deg)" }}
          >
            Vendido
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
            group.taken
              ? "bg-muted-foreground/20 text-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          Grupo {group.group_number}
        </span>
        {group.taken ? (
          <Lock className="size-3.5 text-muted-foreground" />
        ) : (
          <span className="size-2 rounded-full bg-success" aria-hidden />
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {group.numbers.map((n) => (
          <span
            key={n}
            className={cn(
              "flex aspect-square items-center justify-center rounded-full text-sm font-black tabular-nums shadow-sm",
              group.taken
                ? "bg-muted-foreground/15 text-muted-foreground/50 blur-[2px]"
                : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
            )}
          >
            {n}
          </span>
        ))}
      </div>

      {group.taken && group.buyer_name && (
        <p className="mt-2 truncate text-[10px] font-semibold text-muted-foreground">
          Comprado por {group.buyer_name}
        </p>
      )}
    </button>
  );
}
