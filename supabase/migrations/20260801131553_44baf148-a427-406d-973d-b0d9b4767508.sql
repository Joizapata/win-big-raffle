REVOKE SELECT ON public.raffle_groups FROM anon, authenticated;
GRANT SELECT (group_number, numbers, taken) ON public.raffle_groups TO anon, authenticated;
GRANT ALL ON public.raffle_groups TO service_role;
GRANT ALL ON public.raffle_orders TO service_role;