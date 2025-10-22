// --- BASIS-FAKTE (kommen später als Events/Facts aus dem Backend) ---
// user(U), team_member(U, Team)
// session(U, SessionId)
// level(SessionId, LevelNo)  // aktuelles Level der Session
// q(BaseIdx)                 // 1..10 (Fragen-Index innerhalb des Levels)
// watched(SessionId, BaseIdx)            // Video gesehen
// answered(SessionId, BaseIdx, Part, IsCorrect) // Part=A/B oder "-" bei Standardfragen
// team_answer(Team, BaseIdx, Member, IsCorrect)  // für Teamfrage (Frage 9)
// deadline(SessionId, ISO8601_UTC)               // Level-Deadline
// now(ISO8601_UTC)                                // aktuelle Zeit injizieren
// base_points(BaseIdx, P)                         // Punktetabelle je Frageposition

// --- ABLEITUNGEN / HILFSREGELN ---
risk_idx(5).
risk_idx(10).
team_idx(9).

// Frage korrekt, wenn:
// - Standardfrage: ein Eintrag answered(..., "-", true)
// - Risikofrage: A und B korrekt
correct_q(SessionId, BaseIdx) :-
  answered(SessionId, BaseIdx, "-", true),
  not risk_idx(BaseIdx).

correct_q(SessionId, BaseIdx) :-
  risk_idx(BaseIdx),
  answered(SessionId, BaseIdx, "A", true),
  answered(SessionId, BaseIdx, "B", true).

// Teamfrage erfolgreich, wenn >50% korrekt (auf Teamebene)
team_success(Team, BaseIdx) :-
  team_idx(BaseIdx),
  team_answer(Team, BaseIdx, Member, IsCorrect)
  |> do fn:group_by(Member),
     let Total = fn:Count(),
     let Good  = fn:CountIf(IsCorrect),
     let Ratio = fn:div(Good, Total),
     guard fn:gt(Ratio, 0.5).

// Teamfrage gilt als korrekt, wenn Team success meldet und User im Team ist
correct_q(SessionId, 9) :-
  team_idx(9),
  level(SessionId, L),
  user_in_session(SessionId, U),
  team_member(U, T),
  team_success(T, 9).

// User/Session-Relation (aus eingehenden Events ableitbar)
user_in_session(SessionId, U) :-
  session(U, SessionId).

// Deadlines: verpasst, wenn now > deadline
deadline_missed(SessionId) :-
  deadline(SessionId, DL),
  now(Now),
  guard fn:gt(Now, DL).

// Level-Reset, wenn Risikofrage falsch (mindestens ein Part falsch)
level_reset(SessionId) :-
  risk_idx(BaseIdx),
  answered(SessionId, BaseIdx, "A", false).
level_reset(SessionId) :-
  risk_idx(BaseIdx),
  answered(SessionId, BaseIdx, "B", false).

// Nächste Frage freischalten: Video gesehen + korrekt
unlock_next(SessionId, NextIdx) :-
  q(CurIdx),
  watched(SessionId, CurIdx),
  correct_q(SessionId, CurIdx)
  |> let NextIdx = fn:plus(CurIdx, 1),
     guard fn:lte(NextIdx, 10).

// Level bestanden, wenn Frage 10 korrekt & gesehen
level_passed(SessionId) :-
  watched(SessionId, 10),
  correct_q(SessionId, 10).

// --- PUNKTELOGIK ---
// Basis-Punkte je Frage (z. B. 1..10, konfigurierbar via base_points)
earned_points_for_question(SessionId, BaseIdx, P) :-
  base_points(BaseIdx, P0),
  // Standardfall: korrekt beantwortet
  correct_q(SessionId, BaseIdx)
  |> let P = P0.

lost_points_for_question(SessionId, BaseIdx, Pneg) :-
  base_points(BaseIdx, P0),
  answered(SessionId, BaseIdx, Part, false),
  // ein falscher Versuch zieht Basis ab (einfaches Modell)
  |> let Pneg = fn:neg(P0).

// Teamfrage (9): Verdreifachung bei Erfolg
earned_points_for_question(SessionId, 9, P) :-
  base_points(9, P0),
  correct_q(SessionId, 9)
  |> let P = fn:mul(P0, 3).

// Risikofragen (5 & 10): Verdopplung bei Erfolg
earned_points_for_question(SessionId, BaseIdx, P) :-
  risk_idx(BaseIdx),
  correct_q(SessionId, BaseIdx),
  base_points(BaseIdx, P0)
  |> let P = fn:mul(P0, 2).

// Levelsumme (ohne Multiplikator am Ende)
level_points_raw(SessionId, Sum) :-
  earned_points_for_question(SessionId, BaseIdx, P)
  |> do fn:group_by(),
     let Sum = fn:Sum(P).

penalty_sum(SessionId, Pen) :-
  lost_points_for_question(SessionId, BaseIdx, Pneg)
  |> do fn:group_by(),
     let Pen = fn:Sum(Pneg).

level_points(SessionId, Total) :-
  level_points_raw(SessionId, P),
  penalty_sum(SessionId, Pen)
  |> let Total = fn:plus(P, Pen).

// Level-Abschlussmultiplikator: 5x bei Erfolg
final_level_points(SessionId, Final) :-
  level_passed(SessionId),
  level_points(SessionId, T)
  |> let Final = fn:mul(T, 5).

// Endgültige Entscheidung über Status
status(SessionId, "RESET_DEADLINE") :- deadline_missed(SessionId).
status(SessionId, "RESET_RISK")     :- level_reset(SessionId).
status(SessionId, "PASSED")         :- level_passed(SessionId).
status(SessionId, "IN_PROGRESS")    :-
  not deadline_missed(SessionId),
  not level_reset(SessionId),
  not level_passed(SessionId).

// --- QUERIES (für API-Auswertung) ---
// 1) Welche Frage darf ich als nächstes sehen?
next_question(SessionId, NextIdx) :- unlock_next(SessionId, NextIdx).

// 2) Was ist mein Status?
current_status(SessionId, S) :- status(SessionId, S).

// 3) Wieviele Punkte (roh / final)?
points_raw(SessionId, P)   :- level_points(SessionId, P).
points_final(SessionId, PF) :- final_level_points(SessionId, PF). 