# --- Game Mechanics: Risk (Q5,Q10) & Team (Q9) ---
# Fakten erwartet:
# answered_correct/answered_wrong wie gehabt
# team_member(U, Team)
# team_answer_correct(Team, L, Q, Count)  -- vom Backend aggregiert
# team_size(Team, Size)                   -- vom Backend aggregiert

# Risikofragen sind 5 und 10
risk_question(5).
risk_question(10).

# Erfolg: beide Risk-Fragen korrekt
risk_success(U, L) :-
  answered_correct(U, L, 5, _),
  answered_correct(U, L, 10, _).

# Fehlversuch: irgendeine Risk-Frage falsch
risk_fail(U, L) :-
  answered_wrong(U, L, 5, _);
  answered_wrong(U, L, 10, _).

# Backend-Aktionen ableiten
apply_multiplier(U, L, 2.0) :- risk_success(U, L).
reset_level(U, L)           :- risk_fail(U, L).

# Teamfrage = 9; Erfolg bei >50% korrekt
team_success(Team, L) :-
  team_answer_correct(Team, L, 9, C),
  team_size(Team, S),
  C * 2 > S.

apply_team_multiplier(U, L, 3.0) :-
  team_member(U, Team),
  team_success(Team, L). 