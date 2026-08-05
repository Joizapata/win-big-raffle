import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BellRing,
  Check,
  Clock,
  Copy,
  DollarSign,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Ticket,
} from "lucide-react";
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
  const TOTAL_GROUPS = 25;
  const PRICE = 20000;
  const paidCount = list.filter((o) => o.paid).length;
  const pendingCount = list.length - paidCount;
  const soldPct = Math.round((list.length / TOTAL_GROUPS) * 100);
  const paidPct = Math.round((paidCount / TOTAL_GROUPS) * 100);
  const money = (n: number) =>
    `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
  const stats = [
    {
      label: "Grupos vendidos",
      value: `${list.length}/${TOTAL_GROUPS}`,
      icon: Ticket,
      tone: "text-primary",
      bg: "bg-primary/15",
    },
    {
      label: "Pagados",
      value: String(paidCount),
      icon: Check,
      tone: "text-emerald-400",
      bg: "bg-emerald-500/15",
    },
    {
      label: "Pendientes",
      value: String(pendingCount),
      icon: Clock,
      tone: "text-amber-400",
      bg: "bg-amber-500/15",
    },
    {
      label: "Recaudado",
      value: money(paidCount * PRICE),
      icon: DollarSign,
      tone: "text-accent",
      bg: "bg-accent/15",
    },
  ];

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

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-primary/20 bg-card/70 p-4 shadow-[0_0_35px_-18px_oklch(0.55_0.25_280/0.8)]"
            >
              <span
                className={`inline-flex size-8 items-center justify-center rounded-xl ${s.bg} ${s.tone}`}
              >
                <s.icon className="size-4" />
              </span>
              <p className={`mt-3 text-2xl font-black tabular-nums ${s.tone}`}>{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-2xl border border-primary/20 bg-card/70 p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-muted-foreground">Avance de la rifa</span>
            <span className="text-primary tabular-nums">{soldPct}%</span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-background/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${soldPct}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-muted-foreground">Pagos confirmados</span>
            <span className="text-emerald-400 tabular-nums">{paidPct}%</span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-background/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all"
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border/40 bg-background/50 p-3">
              <p className="text-muted-foreground">Por cobrar</p>
              <p className="mt-1 text-base font-black text-amber-400 tabular-nums">
                {money(pendingCount * PRICE)}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/50 p-3">
              <p className="text-muted-foreground">Meta total</p>
              <p className="mt-1 text-base font-black text-foreground tabular-nums">
                {money(TOTAL_GROUPS * PRICE)}
              </p>
            </div>
          </div>
        </section>

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
              const reminder = buildReminderMessage(o.buyer_name, o.group_number, o.numbers);
              const reminderLink = buildWhatsappLink(o.contact, reminder);
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

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                        o.paid
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {o.paid ? "Pagado" : "Pago pendiente"}
                    </span>
                    <Button
                      size="sm"
                      variant={o.paid ? "secondary" : "default"}
                      className="gap-2"
                      disabled={paidMutation.isPending}
                      onClick={() => paidMutation.mutate({ id: o.id, paid: !o.paid })}
                    >
                      <Check className="size-4" />
                      {o.paid ? "Marcar como pendiente" : "Marcar como pagado"}
                    </Button>
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
                    {!o.paid && reminderLink && (
                      <Button
                        asChild
                        variant="secondary"
                        className="gap-2 border border-amber-400/40 text-amber-300"
                      >
                        <a href={reminderLink} target="_blank" rel="noopener noreferrer">
                          <BellRing className="size-4" /> Enviar recordatorio de pago
                        </a>
                      </Button>
                    )}
                    {!o.paid && (
                      <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(reminder);
                          toast.success("Recordatorio copiado");
                        }}
                      >
                        <Copy className="size-4" /> Copiar recordatorio
                      </Button>
                    )}
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