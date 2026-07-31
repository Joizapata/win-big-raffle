import { supabaseAdmin } from "./src/integrations/supabase/client.server";

async function reset() {
  const { error: deleteError } = await supabaseAdmin
    .from("raffle_orders")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) throw deleteError;

  const { error: updateError } = await supabaseAdmin
    .from("raffle_groups")
    .update({ taken: false, buyer_name: null, taken_at: null })
    .neq("group_number", -1);
  if (updateError) throw updateError;

  console.log("✅ Grupos restaurados. Todas las compras de prueba eliminadas.");
}

reset().catch((e) => {
  console.error("Reset failed:", e);
  process.exit(1);
});
