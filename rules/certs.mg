# --- Certificates (JunoSixteen) ---
# Ziel: award_certificate(U, C) ableiten, wenn Kurs abgeschlossen & Qualitätskriterien erfüllt.
# Erwartete Fakten:
# completed_level(U, L)                    -- aus progress.mg (oder separat gefüttert)
# answered_correct(U, L, Q, TS)            -- wie gehabt (optional für Genauigkeit)
# answered_wrong(U, L, Q, TS)              -- wie gehabt (optional für Genauigkeit)
# course_of_level(L, C)                    -- Mapping Level -> Kurs-ID (z.B. alle 10 Level = "onboarding")
# risk_success(U, L)                        -- aus game.mg (abgeleitet)
# team_success(Team, L)                     -- aus game.mg (abgeleitet)
# team_member(U, Team)                      -- Fakt aus events

# --- Parameter (falls nicht als Fakten geliefert) ---
total_levels(C, 10).                        # Default: 10 Level je Kurs

# Helper: Level eines Nutzers innerhalb Kurses gezählt
level_completed_in_course(U, C, L) :-
  completed_level(U, L),
  course_of_level(L, C).

count_levels_done(U, C, N) :-
  N = count{ L | level_completed_in_course(U, C, L) }.

has_finished_course(U, C) :-
  total_levels(C, TL),
  count_levels_done(U, C, N),
  N = TL.

# Genauigkeit (Accuracy) pro Kurs: korrekt / (korrekt + falsch)
correct_in_course(U, C, N) :-
  N = count{ (L,Q) | answered_correct(U, L, Q, _), course_of_level(L, C) }.
wrong_in_course(U, C, N) :-
  N = count{ (L,Q) | answered_wrong(U, L, Q, _), course_of_level(L, C) }.
accuracy_percent(U, C, Pct) :-
  correct_in_course(U, C, Cn),
  wrong_in_course(U, C, Wn),
  Tot = Cn + Wn,
  Tot > 0,
  Pct = (Cn * 100) / Tot.

# Mindestanforderungen:
meets_accuracy(U, C) :-
  accuracy_percent(U, C, P),
  P >= 80.

meets_risk(U, C) :-
  # Mindestens 1 Risk-Erfolg im Kurs (z.B. L5 oder L10)
  exists{ L | course_of_level(L, C), risk_success(U, L) }.

meets_team(U, C) :-
  team_member(U, T),
  exists{ L | course_of_level(L, C), team_success(T, L) }.

# Zertifikatsstufen:
eligible_basic(U, C)  :- has_finished_course(U, C), meets_accuracy(U, C).
eligible_silver(U, C) :- eligible_basic(U, C), meets_risk(U, C).
eligible_gold(U, C)   :- eligible_silver(U, C), meets_team(U, C).

# Ableitung:
award_certificate(U, C, "basic")  :- eligible_basic(U, C),  not eligible_silver(U, C).
award_certificate(U, C, "silver") :- eligible_silver(U, C), not eligible_gold(U, C).
award_certificate(U, C, "gold")   :- eligible_gold(U, C). 