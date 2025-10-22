# --- Time & Deadlines (JunoSixteen) ---
# WAS: Frage muss innerhalb des Limits beantwortet werden.
# WARUM: Verstöße triggern Reset/Sperre via Backend-Aktion.

# Fakten erwartet:
# time_limit(L, Q, Sec)                 -- z.B. (3,4,30)
# answered_correct(U, L, Q, TS)         -- wie gehabt
# answered_wrong(U, L, Q, TS)           -- wie gehabt
# answered_duration(U, L, Q, Sec)       -- vom Backend berechnet
# deadline(L, TS)                        -- wöchentliche Frist

timeout(U, L, Q) :-
  answered_duration(U, L, Q, D),
  time_limit(L, Q, Limit),
  D > Limit.

deadline_missed(U, L) :-
  deadline(L, T),
  now(N),
  N > T,
  not completed_level(U, L).  # completed_level kommt aus progress.mg

# Aggregat (gleich wie in progress.mg verwenden, falls dort noch nicht vorhanden):
count_correct(U, L, N) :-
  N = count{ Q | answered_correct(U, L, Q, _) }.

completed_level(U, L) :-
  count_correct(U, L, N),
  N = 10.

# Empfehlung an Backend: Aktion ableiten
should_reset_due_timeout(U, L) :- timeout(U, L, _).

# Hinweis: actual Reset/Persisting macht das Backend; Mangle liefert nur die Ableitung. 