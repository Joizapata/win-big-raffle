import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export type RaffleGroup = {
  group_number: number;
  numbers: string[];
  taken: boolean;
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
        "group relative w-full overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        group.taken
          ? "cursor-not-allowed border-border/40 bg-muted/60 opacity-70 grayscale"
          : "border-primary/20 bg-card hover:-translate-y-1.5 hover:border-primary/60 hover:bg-card/80 hover:shadow-[0_0_40px_-8px_oklch(0.55_0.25_280/0.55)]",
        selected &&
          "border-primary bg-card/90 shadow-[0_0_45px_-5px_oklch(0.7_0.28_300/0.6)] ring-2 ring-primary/60",
      )}
    >
      {/* Shimmer sweep on hover */}
      {!group.taken && (
        <div className="shimmer-bg pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}

      {/* Diagonal VENDIDO stamp */}
      {group.taken && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="rounded-md border-2 border-destructive/70 bg-destructive/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-destructive backdrop-blur-sm text-glow"
            style={{ transform: "rotate(-14deg)" }}
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
              ? "bg-muted-foreground/15 text-muted-foreground"
              : "bg-primary/15 text-primary shadow-[0_0_12px_oklch(0.55_0.26_275/0.35)]",
          )}
        >
          Grupo {group.group_number}
        </span>
        {group.taken ? (
          <Lock className="size-3.5 text-muted-foreground" />
        ) : (
          <span
            className="size-2.5 rounded-full bg-success shadow-[0_0_10px_oklch(0.7_0.22_150/0.8)]"
            aria-hidden
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {group.numbers.map((n) => (
          <span
            key={n}
            className={cn(
              "flex aspect-square items-center justify-center rounded-full text-sm font-black tabular-nums shadow-sm",
              group.taken
                ? "bg-muted-foreground/15 text-muted-foreground/50 blur-[2.5px]"
                : "purple-blue-gradient text-white shadow-[0_0_12px_oklch(0.55_0.25_280/0.5)]",
            )}
          >
            {n}
          </span>
        ))}
      </div>

    </button>
  );
}
