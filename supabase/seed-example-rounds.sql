-- =============================================================================
-- Golf Tracker — Rondas de ejemplo (5 Country + 5 Alpa Sumaj)
-- =============================================================================
-- Ejecutar en el SQL Editor de Supabase si no tenés service role key local.
-- Regenerar: npm run seed:rounds -- --sql-only
-- =============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_course_id uuid;
  v_round_id uuid;
  v_hole record;
  v_score smallint;
  v_fairway public.tri_state;
  v_penalty public.tri_state;
  v_gir boolean;
  v_putts smallint;
  v_delta int;
  v_mod int;
  meta record;
  round_idx int := 0;
  v_handicap numeric(4,1);
BEGIN
  SELECT id INTO v_user_id FROM public.profiles ORDER BY created_at LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay perfiles. Completá el onboarding antes de cargar datos de ejemplo.';
  END IF;

  SELECT COALESCE(handicap, 12.4) INTO v_handicap
  FROM public.profiles WHERE id = v_user_id;

  DELETE FROM public.rounds
  WHERE user_id = v_user_id
    AND played_on IN ('2025-12-01'::date, '2025-12-15'::date, '2026-01-08'::date, '2026-02-12'::date, '2026-03-18'::date, '2025-12-08'::date, '2026-01-22'::date, '2026-02-05'::date, '2026-03-01'::date, '2026-04-10'::date);

  FOR meta IN
    SELECT * FROM (VALUES
      ('Country', '2025-12-01'::date, 0),
      ('Country', '2025-12-15'::date, 1),
      ('Country', '2026-01-08'::date, -1),
      ('Country', '2026-02-12'::date, 0),
      ('Country', '2026-03-18'::date, 2),
      ('Alpa Sumaj', '2025-12-08'::date, -1),
      ('Alpa Sumaj', '2026-01-22'::date, 0),
      ('Alpa Sumaj', '2026-02-05'::date, -2),
      ('Alpa Sumaj', '2026-03-01'::date, 1),
      ('Alpa Sumaj', '2026-04-10'::date, -1)
    ) AS t(course_name, played_on, bias)
  LOOP
    round_idx := round_idx + 1;

    SELECT id INTO v_course_id FROM public.courses WHERE name = meta.course_name;

    IF v_course_id IS NULL THEN
      RAISE EXCEPTION 'Cancha no encontrada: %', meta.course_name;
    END IF;

    INSERT INTO public.rounds (user_id, course_id, played_on, status, handicap_used)
    VALUES (v_user_id, v_course_id, meta.played_on, 'completed', v_handicap)
    RETURNING id INTO v_round_id;

    FOR v_hole IN
      SELECT id, number, par
      FROM public.course_holes
      WHERE course_id = v_course_id
      ORDER BY number
    LOOP
      v_mod := (round_idx * 3 + v_hole.number) % 5;
      v_delta := (ARRAY[-1, 0, 0, 1, 2])[v_mod + 1] + meta.bias;

      IF v_hole.number IN (9, 7) THEN
        v_delta := v_delta + 1;
      END IF;
      IF v_hole.number IN (2, 16) THEN
        v_delta := v_delta - 1;
      END IF;

      v_score := GREATEST(1, LEAST(v_hole.par + 4, v_hole.par + v_delta));
      v_gir := v_score <= v_hole.par;

      IF v_hole.par = 3 THEN
        v_fairway := 'na';
        v_penalty := CASE WHEN v_mod = 4 THEN 'yes'::public.tri_state ELSE 'na'::public.tri_state END;
      ELSE
        v_fairway := CASE WHEN v_score <= v_hole.par THEN 'yes'::public.tri_state ELSE CASE WHEN v_mod % 2 = 0 THEN 'no'::public.tri_state ELSE 'yes'::public.tri_state END END;
        v_penalty := CASE WHEN NOT v_gir AND v_mod = 3 THEN 'yes'::public.tri_state ELSE 'no'::public.tri_state END;
      END IF;

      v_putts := CASE WHEN v_score = v_hole.par - 1 THEN 1 WHEN v_mod = 4 THEN 3 WHEN v_gir THEN 2 ELSE LEAST(4, GREATEST(1, v_score - v_hole.par + 2)) END;

      INSERT INTO public.hole_scores (
        round_id, course_hole_id, score, fairway, penalty_from_tee, gir, putts
      ) VALUES (
        v_round_id, v_hole.id, v_score, v_fairway, v_penalty, v_gir, v_putts
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed completado: 10 rondas de ejemplo para el usuario %', v_user_id;
END $$;
