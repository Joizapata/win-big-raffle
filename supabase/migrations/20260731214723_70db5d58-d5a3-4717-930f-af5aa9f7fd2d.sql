
CREATE TABLE public.raffle_groups (
  group_number int PRIMARY KEY,
  numbers text[] NOT NULL,
  taken boolean NOT NULL DEFAULT false,
  buyer_name text,
  taken_at timestamptz
);

CREATE TABLE public.raffle_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number int NOT NULL REFERENCES public.raffle_groups(group_number),
  buyer_name text NOT NULL,
  contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT (group_number, numbers, taken, buyer_name, taken_at) ON public.raffle_groups TO anon, authenticated;
GRANT ALL ON public.raffle_groups TO service_role;
GRANT ALL ON public.raffle_orders TO service_role;

ALTER TABLE public.raffle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are publicly viewable" ON public.raffle_groups FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.raffle_groups (group_number, numbers) VALUES
(1, ARRAY['02','11','88','27']),
(2, ARRAY['63','66','95','05']),
(3, ARRAY['16','53','50','58']),
(4, ARRAY['94','98','92','37']),
(5, ARRAY['17','31','44','28']),
(6, ARRAY['55','71','25','48']),
(7, ARRAY['20','69','41','19']),
(8, ARRAY['46','79','14','70']),
(9, ARRAY['75','21','03','65']),
(10, ARRAY['96','42','86','77']),
(11, ARRAY['09','89','87','12']),
(12, ARRAY['00','29','51','93']),
(13, ARRAY['40','73','47','30']),
(14, ARRAY['59','99','62','49']),
(15, ARRAY['54','91','64','08']),
(16, ARRAY['35','97','34','56']),
(17, ARRAY['84','83','76','74']),
(18, ARRAY['90','81','61','80']),
(19, ARRAY['85','13','18','38']),
(20, ARRAY['22','68','32','07']),
(21, ARRAY['57','45','06','23']),
(22, ARRAY['52','33','24','26']),
(23, ARRAY['82','10','72','67']),
(24, ARRAY['15','60','43','39']),
(25, ARRAY['78','04','36','01']);

CREATE OR REPLACE FUNCTION public.reserve_group(p_group int, p_name text, p_contact text)
RETURNS TABLE (group_number int, numbers text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(p_name);
  v_contact text := btrim(p_contact);
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 60 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF length(v_contact) < 3 OR length(v_contact) > 60 THEN
    RAISE EXCEPTION 'Contacto inválido';
  END IF;

  UPDATE public.raffle_groups g
     SET taken = true, buyer_name = v_name, taken_at = now()
   WHERE g.group_number = p_group AND g.taken = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este grupo ya fue tomado';
  END IF;

  INSERT INTO public.raffle_orders (group_number, buyer_name, contact)
  VALUES (p_group, v_name, v_contact);

  RETURN QUERY
    SELECT g.group_number, g.numbers FROM public.raffle_groups g WHERE g.group_number = p_group;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_group(int, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_group(int, text, text) TO anon, authenticated;
