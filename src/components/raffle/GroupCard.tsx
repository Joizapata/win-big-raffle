import { cn } from "@/lib/utils";

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
        "w-full rounded-xl border bg-card p-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        group.taken
          ? "cursor-not-allowed border-border bg-muted opacity-60"
          : "border-border hover:-translate-y-0.5 hover:border-primary",
        selected && "border-primary ring-2 ring-primary",
      )}
      style={!group.taken ? { boxShadow: "var(--shadow-card)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Grupo {group.group_number}
        </span>
        {group.taken && (
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Vendido
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {group.numbers.map((n) => (
          <span
            key={n}
            className={cn(
              "rounded-md py-1.5 text-center text-base font-bold tabular-nums",
              group.taken
                ? "bg-muted-foreground/15 text-muted-foreground/60 blur-[1.5px]"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {n}
          </span>
        ))}
      </div>

      {group.taken && group.buyer_name && (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">
          Comprado por {group.buyer_name}
        </p>
      )}
    </button>
  );
}