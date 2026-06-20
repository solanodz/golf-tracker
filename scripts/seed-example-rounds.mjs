/**
 * Carga 10 rondas de ejemplo (5 Country + 5 Alpa Sumaj).
 *
 * Uso:
 *   npm run seed:rounds
 *   npm run seed:rounds -- --user-id=<uuid>
 *   npm run seed:rounds -- --sql-only   # solo genera el .sql
 *
 * Requiere en .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DEFAULT_HANDICAP = 12.4;

const schedules = [
  {
    course: "Country",
    rounds: [
      { date: "2025-12-01", bias: 0 },
      { date: "2025-12-15", bias: 1 },
      { date: "2026-01-08", bias: -1 },
      { date: "2026-02-12", bias: 0 },
      { date: "2026-03-18", bias: 2 },
    ],
  },
  {
    course: "Alpa Sumaj",
    rounds: [
      { date: "2025-12-08", bias: -1 },
      { date: "2026-01-22", bias: 0 },
      { date: "2026-02-05", bias: -2 },
      { date: "2026-03-01", bias: 1 },
      { date: "2026-04-10", bias: -1 },
    ],
  },
];

const seedDates = schedules.flatMap((s) => s.rounds.map((r) => r.date));

function loadEnv() {
  const envPath = join(ROOT, ".env");
  const env = {};

  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // .env opcional si las vars vienen del entorno
  }

  return {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      env.NEXT_PUBLIC_SUPABASE_URL ??
      "",
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      env.SUPABASE_SERVICE_ROLE_KEY ??
      "",
  };
}

function parseArgs(argv) {
  const args = { sqlOnly: false, userId: null, email: null };

  for (const arg of argv) {
    if (arg === "--sql-only") args.sqlOnly = true;
    else if (arg.startsWith("--user-id=")) args.userId = arg.slice("--user-id=".length);
    else if (arg.startsWith("--email=")) args.email = arg.slice("--email=".length);
  }

  return args;
}

function holeStats(hole, roundIndex, bias) {
  const mod = (roundIndex * 3 + hole.number) % 5;
  let delta = [-1, 0, 0, 1, 2][mod + 1] + bias;

  if ([9, 7].includes(hole.number)) delta += 1;
  if ([2, 16].includes(hole.number)) delta -= 1;

  const score = Math.max(1, Math.min(hole.par + 4, hole.par + delta));
  const gir = score <= hole.par;

  let fairway;
  let penalty_from_tee;

  if (hole.par === 3) {
    fairway = "na";
    penalty_from_tee = mod === 4 ? "yes" : "na";
  } else {
    fairway =
      score <= hole.par ? "yes" : mod % 2 === 0 ? "no" : "yes";
    penalty_from_tee = !gir && mod === 3 ? "yes" : "no";
  }

  let putts;
  if (score === hole.par - 1) putts = 1;
  else if (mod === 4) putts = 3;
  else if (gir) putts = 2;
  else putts = Math.min(4, Math.max(1, score - hole.par + 2));

  return { score, fairway, penalty_from_tee, gir, putts };
}

function buildSql(userIdClause) {
  const allDates = seedDates.map((d) => `'${d}'::date`);
  const roundMeta = schedules.flatMap((s) =>
    s.rounds.map((r) => `('${s.course}', '${r.date}'::date, ${r.bias})`),
  );

  return `-- =============================================================================
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
  ${userIdClause}

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay perfiles. Completá el onboarding antes de cargar datos de ejemplo.';
  END IF;

  SELECT COALESCE(handicap, ${DEFAULT_HANDICAP}) INTO v_handicap
  FROM public.profiles WHERE id = v_user_id;

  DELETE FROM public.rounds
  WHERE user_id = v_user_id
    AND played_on IN (${allDates.join(", ")});

  FOR meta IN
    SELECT * FROM (VALUES
      ${roundMeta.join(",\n      ")}
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
`;
}

async function resolveUserId(supabase, args) {
  if (args.userId) return args.userId;

  if (args.email) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) throw error;

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === args.email.toLowerCase(),
    );

    if (!user) {
      throw new Error(`No se encontró usuario con email: ${args.email}`);
    }

    return user.id;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, handicap")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!profile) {
    throw new Error(
      "No hay perfiles. Registrate y completá el onboarding antes de cargar datos de ejemplo.",
    );
  }

  return profile.id;
}

async function resolveHandicap(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("handicap")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data.handicap ?? DEFAULT_HANDICAP;
}

async function seedRounds(supabase, userId, handicap) {
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, name, course_holes(id, number, par)")
    .in("name", schedules.map((s) => s.course));

  if (coursesError) throw coursesError;

  const courseByName = new Map(courses.map((c) => [c.name, c]));

  const { error: deleteError } = await supabase
    .from("rounds")
    .delete()
    .eq("user_id", userId)
    .in("played_on", seedDates);

  if (deleteError) throw deleteError;

  let roundIndex = 0;
  let created = 0;

  for (const schedule of schedules) {
    const course = courseByName.get(schedule.course);
    if (!course) {
      throw new Error(`Cancha no encontrada: ${schedule.course}`);
    }

    const holes = [...course.course_holes].sort((a, b) => a.number - b.number);

    for (const round of schedule.rounds) {
      roundIndex += 1;

      const { data: newRound, error: roundError } = await supabase
        .from("rounds")
        .insert({
          user_id: userId,
          course_id: course.id,
          played_on: round.date,
          status: "completed",
          handicap_used: handicap,
        })
        .select("id")
        .single();

      if (roundError) throw roundError;

      const holeScores = holes.map((hole) => ({
        round_id: newRound.id,
        course_hole_id: hole.id,
        ...holeStats(hole, roundIndex, round.bias),
      }));

      const { error: scoresError } = await supabase
        .from("hole_scores")
        .insert(holeScores);

      if (scoresError) throw scoresError;

      created += 1;
    }
  }

  return created;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sqlPath = join(ROOT, "supabase/seed-example-rounds.sql");

  const userIdClause = args.userId
    ? `v_user_id := '${args.userId}'::uuid;`
    : `SELECT id INTO v_user_id FROM public.profiles ORDER BY created_at LIMIT 1;`;

  const sql = buildSql(userIdClause);
  writeFileSync(sqlPath, sql);

  if (args.sqlOnly) {
    console.log(`Generado: supabase/seed-example-rounds.sql`);
    console.log("Pegalo en Supabase → SQL Editor y ejecutalo.");
    return;
  }

  const { url, serviceRoleKey } = loadEnv();

  if (!url || !serviceRoleKey) {
    console.log("Generado: supabase/seed-example-rounds.sql");
    console.log("");
    console.log("Falta SUPABASE_SERVICE_ROLE_KEY en .env para ejecutar automático.");
    console.log("Opciones:");
    console.log("  1. Agregá SUPABASE_SERVICE_ROLE_KEY en .env y corré: npm run seed:rounds");
    console.log("  2. Pegá supabase/seed-example-rounds.sql en Supabase → SQL Editor");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await resolveUserId(supabase, args);
  const handicap = await resolveHandicap(supabase, userId);
  const created = await seedRounds(supabase, userId, handicap);

  console.log(`Listo: ${created} rondas de ejemplo para el usuario ${userId}`);
  console.log(`HCP usado: ${handicap}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
