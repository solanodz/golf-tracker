export type RoundStatus = "in_progress" | "completed";
export type TriState = "yes" | "no" | "na";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  handicap: number | null;
  club_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Club = {
  id: string;
  name: string;
  created_at: string;
};

export type Course = {
  id: string;
  club_id: string;
  name: string;
  par: number;
  total_yards: number;
  created_at: string;
};

export type CourseHole = {
  id: string;
  course_id: string;
  number: number;
  par: number;
  hcp: number;
  yards: number;
  created_at: string;
};

export type Round = {
  id: string;
  user_id: string;
  course_id: string;
  played_on: string;
  status: RoundStatus;
  handicap_used: number;
  created_at: string;
  updated_at: string;
};

export type HoleScore = {
  id: string;
  round_id: string;
  course_hole_id: string;
  score: number;
  fairway: TriState;
  penalty_from_tee: TriState;
  gir: boolean;
  putts: number;
  created_at: string;
  updated_at: string;
};
