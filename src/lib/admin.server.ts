import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "rifa-admin",
    maxAge: 60 * 60 * 12,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export type AdminOrder = {
  id: string;
  group_number: number;
  buyer_name: string;
  contact: string;
  created_at: string;
  numbers: string[];
};

export async function listOrders(): Promise<AdminOrder[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("raffle_orders")
    .select("id, group_number, buyer_name, contact, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const orders = data ?? [];
  const { data: groups, error: gErr } = await supabaseAdmin
    .from("raffle_groups")
    .select("group_number, numbers");
  if (gErr) throw gErr;
  const byGroup = new Map((groups ?? []).map((g) => [g.group_number, g.numbers]));
  return orders.map((o) => ({ ...o, numbers: byGroup.get(o.group_number) ?? [] }));
}