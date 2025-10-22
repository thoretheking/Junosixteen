# --- Progress-Regeln (JunoSixteen) ---
# WAS: Ein Level ist abgeschlossen, wenn 10 richtige Antworten vorliegen.
# WARUM: Klare, testbare Bedingung für Freischaltung des nächsten Levels.

# Zähle richtige Antworten pro (User, Level)
count_correct(U, L, N) :-
  N = count{ Q | answered_correct(U, L, Q, _) }.

# Level abgeschlossen bei exakt 10 richtigen Antworten
completed_level(U, L) :-
  count_correct(U, L, N),
  N = 10.

# Deadline verpasst, wenn jetzt > Deadline und Level nicht abgeschlossen
deadline_missed(U, L) :-
  deadline(L, T),
  now(N),
  N > T,
  not completed_level(U, L).

# Darf nächstes Level starten?
can_start(U, Next) :-
  completed_level(U, L),
  not deadline_missed(U, L),
  Next = L + 1.

# Zusätzliche Regeln für erweiterte Progress-Logik

# Level-Sequence: User muss Level in korrekter Reihenfolge absolvieren
# WAS: Verhindert Level-Sprünge
# WARUM: Stellt linearen Lernfortschritt sicher
sequential_progress(U, L) :-
  L > 1,
  PrevLevel = L - 1,
  completed_level(U, PrevLevel).

# First Level kann immer gestartet werden
# WAS: Level 1 ist immer verfügbar
# WARUM: Jeder User kann mit dem Lernen beginnen
can_start_first_level(U, 1).

# Advanced Progress: Berücksichtigt Sequenz-Anforderungen
# WAS: Erweiterte can_start Regel mit Sequenz-Prüfung
# WARUM: Verhindert unauthorisierten Level-Progress
can_start_advanced(U, Next) :-
  completed_level(U, L),
  not deadline_missed(U, L),
  Next = L + 1,
  (Next = 2; sequential_progress(U, L)).

# Time-based Progress: Minimum Zeit zwischen Levels
# WAS: Verhindert zu schnellen Level-Progress
# WARUM: Stellt sicher dass Lernzeit angemessen ist
min_time_between_levels(U, L, NextL) :-
  completed_level(U, L),
  level_completion_time(U, L, CompletionTime),
  NextL = L + 1,
  now(CurrentTime),
  TimeDiff = CurrentTime - CompletionTime,
  TimeDiff >= 3600.  # Mindestens 1 Stunde zwischen Levels 