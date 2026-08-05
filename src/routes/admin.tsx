import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BellRing, Check, Copy, Loader2, LockKeyhole, LogOut, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminLogin,
  adminLogout,
  adminOrders,
  adminSetPaid,
  adminStatus,
} from "@/lib/admin.functions";
import { buildReminderMessage, buildWhatsappLink, buildWhatsappMessage } from "@/lib/raffle";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de Malik — Compradores de la rifa" },
      {
        name: "description",
        content:
          "Panel privado para ver los grupos vendidos, los datos del comprador y enviar el mensaje de WhatsApp.",
      },
      { property: "og:title", content: "Panel de Malik — Compradores de la rifa" },
      {
        property: "og:description",
        content: "Panel privado de administración de la rifa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Order = {
  id: string;
  group_number: number;
  buyer_name: string;
  contact: string;
  created_at: string;
  numbers: string[];
  paid: boolean;
  paid_at: string | null;
};

function AdminPage() {
  const queryClient = useQueryClient();
  const status = useServerFn(adminStatus);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const orders = useServerFn(adminOrders);
  const setPaid = useServerFn(adminSetPaid);
  const [password, setPassword] = useState("");

  const session = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => status(),
  });
  const unlocked = session.data?.unlocked === true;

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => orders() as Promise<Order[]>,
    enabled: unlocked,
  });

  const loginMutation = useMutation({
    mutationFn: () => login({ data: { password } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error("Clave incorrecta");
        return;
      }
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin-status"] });
    },
    onError: () => toast.error("No se pudo iniciar sesión"),
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["admin-status"] });
    },
  });

  const paidMutation = useMutation({
    mutationFn: (vars: { id: string; paid: boolean }) => setPaid({ data: vars }),
    onSuccess: (_res, vars) => {
      toast.success(vars.paid ? "Marcado como pagado" : "Marcado como pendiente");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("No se pudo actualizar el pago"),
  });

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm rounded-3xl border border-primary/20 bg-card/80 p-7 shadow-[0_0_60px_-15px_oklch(0.55_0.25_280/0.6)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-primary">
            <LockKeyhole className="size-5" />
            <h1 className="text-lg font-black uppercase tracking-wider text-glow">
              Acceso admin
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Solo para Malik. Ingresa la clave para ver los compradores.
          </p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-pass">Clave</Label>
              <Input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-primary/20 bg-background/60 focus-visible:ring-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending || session.isLoading}
              className="w-full border border-accent/30 bg-gradient-to-r from-primary to-accent font-bold text-white shadow-accent"
            >
              {loginMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </div>
      </main>
    );
  }

  const list = ordersQuery.data ?? [];

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary text-glow">Compradores</h1>
            <p className="text-sm text-muted-foreground">
              {list.length} grupo{list.length === 1 ? "" : "s"} vendido
              {list.length === 1 ? "" : "s"} de 25
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => logoutMutation.mutate()}
            className="gap-2 border border-primary/20"
          >
            <LogOut className="size-4" /> Salir
          </Button>
        </div>

        {ordersQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : list.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Todavía no hay compras registradas.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {list.map((o) => {
              const message = buildWhatsappMessage(o.buyer_name, o.group_number, o.numbers);
              const link = buildWhatsappLink(o.contact, message);
              return (
                <article
                  key={o.id}
                  className="rounded-2xl border border-primary/20 bg-card/70 p-4 shadow-[0_0_35px_-15px_oklch(0.55_0.25_280/0.6)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-foreground">{o.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.contact}</p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-primary">
                      Grupo {o.group_number}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.numbers.map((n) => (
                      <span
                        key={n}
                        className="purple-blue-gradient rounded-lg px-3 py-1.5 text-sm font-black tabular-nums text-white"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border/40 bg-background/60 p-3 text-xs text-muted-foreground">
                    {message}
                  </pre>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {link && (
                      <Button
                        asChild
                        className="gap-2 border border-accent/30 bg-gradient-to-r from-primary to-accent font-bold text-white"
                      >
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="size-4" /> Enviar por WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(message);
                        toast.success("Mensaje copiado");
                      }}
                    >
                      <Copy className="size-4" /> Copiar mensaje
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}