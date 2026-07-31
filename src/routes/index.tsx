import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dices, Loader2, PartyPopper, Sparkles, Ticket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupCard, type RaffleGroup } from "@/components/raffle/GroupCard";
import { buildWhatsappLink, buildWhatsappMessage } from "@/lib/raffle";
import licuadoraImg from "@/assets/licuadora.jpg";
import airfryerImg from "@/assets/airfryer.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rifa de Malik — Licuadora o Airfryer | 15 de agosto" },
      {
        name: "description",
        content:
          "Compra tu grupo de 4 números por $20.000 y gana una licuadora o una airfryer. Juega el 15 de agosto con la Lotería de Boyacá.",
      },
      { property: "og:title", content: "Rifa de Malik — Licuadora o Airfryer" },
      {
        property: "og:description",
        content:
          "25 grupos de 4 números a $20.000. Juega con las dos últimas cifras de la Lotería de Boyacá el 15 de agosto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Purchase = { groupNumber: number; numbers: string[]; name: string; contact: string };

function Index() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["raffle-groups"],
    queryFn: async (): Promise<RaffleGroup[]> => {
      const { data, error } = await supabase
        .from("raffle_groups")
        .select("group_number, numbers, taken, buyer_name")
        .order("group_number");
      if (error) throw error;
      return (data ?? []) as RaffleGroup[];
    },
  });

  const available = groups.filter((g) => !g.taken);
  const selectedGroup = groups.find((g) => g.group_number === selected) ?? null;

  const reserve = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Selecciona un grupo");
      const { data, error } = await supabase.rpc("reserve_group", {
        p_group: selected,
        p_name: name.trim(),
        p_contact: contact.trim(),
      });
      if (error) throw error;
      const row = (data as { group_number: number; numbers: string[] }[])[0];
      if (!row) throw new Error("No se pudo reservar el grupo");
      return row;
    },
    onSuccess: (row) => {
      setPurchase({
        groupNumber: row.group_number,
        numbers: row.numbers,
        name: name.trim(),
        contact: contact.trim(),
      });
      setSelected(null);
      setName("");
      setContact("");
      queryClient.invalidateQueries({ queryKey: ["raffle-groups"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "No se pudo completar la compra");
      queryClient.invalidateQueries({ queryKey: ["raffle-groups"] });
    },
  });

  const pickRandom = () => {
    if (available.length === 0) {
      toast.error("Ya no quedan grupos disponibles");
      return;
    }
    const pick = available[Math.floor(Math.random() * available.length)]!;
    setSelected(pick.group_number);
    toast.success(`Te tocó el grupo N° ${pick.group_number}`);
  };

  const message = purchase
    ? buildWhatsappMessage(purchase.name, purchase.groupNumber, purchase.numbers)
    : "";
  const waLink = purchase ? buildWhatsappLink(purchase.contact, message) : null;

  return (
    <main className="min-h-screen bg-background pb-24">
      <header
        className="relative overflow-hidden px-5 pb-14 pt-10 text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Ambient neon glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-primary/25 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-1/3 size-80 rounded-full bg-accent/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/3 size-96 rounded-full bg-primary/20 blur-[130px]"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-[0_0_20px_oklch(0.55_0.26_275/0.3)] backdrop-blur-md">
            <Ticket className="size-3.5" /> Gran rifa
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            <span className="text-foreground">Gran oportunidad de ganar:</span>
            <span className="mt-1 block text-glow-accent bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-accent">
              una licuadora o una airfryer
            </span>
          </h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-foreground/70">
            o si prefieres, el efectivo
          </p>

          {/* Tilted prize photo cards with 3D depth */}
          <div
            className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4"
            style={{ perspective: "1000px" }}
          >
            {[
              { src: licuadoraImg, label: "Licuadora", rotate: "-10deg", delay: "0s" },
              { src: airfryerImg, label: "Airfryer", rotate: "10deg", delay: "0.35s" },
            ].map((p) => (
              <figure
                key={p.label}
                className="transition-all duration-500 hover:[transform:rotate(0deg)_scale(1.05)]"
                style={{ transform: `rotate(${p.rotate})`, transformStyle: "preserve-3d" }}
              >
                <div
                  className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary/80 to-card p-2 shadow-[0_0_45px_-10px_oklch(0.55_0.25_280/0.55)] transition-all hover:border-primary/50 hover:shadow-[0_0_60px_-5px_oklch(0.7_0.28_300/0.65)] float"
                  style={{ animationDelay: p.delay }}
                >
                  <div className="shimmer-bg pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <img
                    src={p.src}
                    alt={`Premio de la rifa: ${p.label}`}
                    width={816}
                    height={816}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <figcaption className="py-2 text-center text-xs font-extrabold uppercase tracking-widest text-foreground">
                    {p.label}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>

          {/* Spectacular price badge */}
          <div className="glow-pulse mt-8 inline-block rotate-[-2deg] rounded-3xl border-2 border-accent/40 px-10 py-5 shadow-accent bg-gradient-to-br from-accent via-violet-500 to-primary text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">Valor</p>
            <p className="text-5xl font-black tabular-nums text-glow sm:text-6xl">$20.000</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-90">
              por grupo de 4 números
            </p>
          </div>

          <p className="mx-auto mt-8 max-w-lg text-sm font-medium leading-relaxed text-foreground/85">
            25 grupos de 4 números. Juega el <strong className="text-primary text-glow">15 de agosto</strong>{" "}
            con las dos últimas cifras de la{" "}
            <strong className="text-primary text-glow">Lotería de Boyacá</strong>.
          </p>
          <p className="mt-3 text-sm font-semibold tracking-wide text-foreground/80">
            Responsable: <span className="text-accent">Malik</span>
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            <strong className="text-2xl text-primary text-glow">{available.length}</strong>
            <span className="ml-1 text-foreground/80">de 25 grupos disponibles</span>
          </p>
          <Button
            variant="secondary"
            onClick={pickRandom}
            className="gap-2 border border-primary/20 bg-secondary/80 text-primary-foreground shadow-[0_0_25px_-5px_oklch(0.55_0.25_280/0.45)] hover:bg-secondary hover:shadow-[0_0_35px_-3px_oklch(0.7_0.28_300/0.55)]"
          >
            <Dices className="size-4" /> Elegir al azar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary drop-shadow-[0_0_10px_oklch(0.55_0.26_275/0.6)]" />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {groups.map((g, i) => (
              <div
                key={g.group_number}
                className="pop-in"
                style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
              >
                <GroupCard
                  group={g}
                  selected={selected === g.group_number}
                  onSelect={setSelected}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="border-primary/20 bg-card/95 text-foreground shadow-[0_0_80px_-20px_oklch(0.55_0.25_280/0.5)] backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary text-glow">
              Comprar grupo N° {selectedGroup?.group_number}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tus números: {selectedGroup?.numbers.join(" · ")}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              reserve.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="comprar-form">Tu nombre</Label>
              <Input
                id="comprar-form"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                maxLength={60}
                required
                className="border-primary/20 bg-background/60 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contacto">WhatsApp o usuario</Label>
              <Input
                id="contacto"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ej: 3001234567 o @usuario"
                maxLength={60}
                required
                className="border-primary/20 bg-background/60 focus-visible:ring-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full border border-accent/30 bg-gradient-to-r from-primary to-accent font-bold text-white shadow-accent hover:opacity-95"
              disabled={reserve.isPending}
            >
              {reserve.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar compra · $20.000
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={purchase !== null} onOpenChange={(o) => !o && setPurchase(null)}>
        <DialogContent className="border-primary/20 bg-card/95 text-foreground shadow-[0_0_80px_-20px_oklch(0.7_0.3_340/0.45)] backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-accent text-glow-accent">
              <PartyPopper className="size-6" />
              ¡Compra confirmada!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Gracias {purchase?.name} por tu compra y tu apoyo.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-secondary to-card p-5 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              Grupo N° {purchase?.groupNumber}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {purchase?.numbers.map((n) => (
                <span
                  key={n}
                  className="purple-blue-gradient rounded-xl px-4 py-2.5 text-xl font-black tabular-nums text-white shadow-glow"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          {waLink ? (
            <Button
              asChild
              className="w-full border border-accent/30 bg-gradient-to-r from-primary to-accent font-bold text-white shadow-accent hover:opacity-95"
            >
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                Enviar confirmación por WhatsApp
              </a>
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Registraste un usuario ({purchase?.contact}). Copia el mensaje y envíaselo
                por WhatsApp.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  toast.success("Mensaje copiado");
                }}
              >
                Copiar mensaje
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
