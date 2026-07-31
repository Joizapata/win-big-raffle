import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dices, Loader2, PartyPopper, Ticket } from "lucide-react";
import { toast } from "sonner";

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
        className="px-5 pb-10 pt-10 text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Ticket className="size-3.5" /> Gran rifa
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            Gánate una licuadora o una airfryer
          </h1>
          <p className="mt-1 text-xs opacity-80">o si prefieres, el efectivo</p>

          <div className="mt-6 inline-block rounded-2xl bg-accent px-7 py-4 text-accent-foreground shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest">Valor</p>
            <p className="text-4xl font-black tabular-nums sm:text-5xl">$20.000</p>
          </div>

          <p className="mx-auto mt-6 max-w-md text-sm opacity-90">
            25 grupos de 4 números. Juega el <strong>15 de agosto</strong> con las dos
            últimas cifras de la <strong>Lotería de Boyacá</strong>.
          </p>
          <p className="mt-2 text-sm font-semibold">Responsable: Malik</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{available.length}</strong> de 25 grupos
            disponibles
          </p>
          <Button variant="secondary" onClick={pickRandom} className="gap-2">
            <Dices className="size-4" /> Elegir al azar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {groups.map((g) => (
              <GroupCard
                key={g.group_number}
                group={g}
                selected={selected === g.group_number}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comprar grupo N° {selectedGroup?.group_number}</DialogTitle>
            <DialogDescription>
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={reserve.isPending}>
              {reserve.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar compra · $20.000
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={purchase !== null} onOpenChange={(o) => !o && setPurchase(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="size-5 text-accent" />
              ¡Compra confirmada!
            </DialogTitle>
            <DialogDescription>
              Gracias {purchase?.name} por tu compra y tu apoyo.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grupo N° {purchase?.groupNumber}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              {purchase?.numbers.map((n) => (
                <span
                  key={n}
                  className="rounded-lg bg-card px-3 py-2 text-lg font-black tabular-nums"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          {waLink ? (
            <Button asChild className="w-full">
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
