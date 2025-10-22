// === EXPLAINABILITY REGELN ===
// Policy-Traces und Entscheidungsbegründungen für Trainer

// --- BASIS-FAKTE für Explanation ---
// decision_trace(SessionId, RuleName, Condition, Result, Reason)
// rule_fired(SessionId, RuleName, Timestamp)

// --- ENTSCHEIDUNGS-TRACES ---

// Status-Entscheidung mit Begründung
status_explanation(SessionId, Status, PrimaryReason, Details) :-
  current_status(SessionId, Status),
  Status = "RESET_DEADLINE",
  deadline_missed(SessionId)
  |> let PrimaryReason = "deadline_violation",
     let Details = "Level-Deadline wurde überschritten".

status_explanation(SessionId, Status, PrimaryReason, Details) :-
  current_status(SessionId, Status),
  Status = "RESET_RISK",
  level_reset(SessionId)
  |> let PrimaryReason = "risk_question_failed",
     let Details = "Mindestens eine Risikofrage (5 oder 10) wurde falsch beantwortet".

status_explanation(SessionId, Status, PrimaryReason, Details) :-
  current_status(SessionId, Status),
  Status = "PASSED",
  level_passed(SessionId)
  |> let PrimaryReason = "level_completed",
     let Details = "Alle 10 Fragen erfolgreich beantwortet".

status_explanation(SessionId, Status, PrimaryReason, Details) :-
  current_status(SessionId, Status),
  Status = "IN_PROGRESS"
  |> let PrimaryReason = "level_incomplete",
     let Details = "Level läuft noch - weitere Fragen zu beantworten".

// --- RISIKOFRAGEN-ANALYSE ---

// Welche Risikofragen wurden beantwortet
risk_question_analysis(SessionId, QuestionIdx, PartA, PartB, Status, Impact) :-
  risk_idx(QuestionIdx),
  answered(SessionId, QuestionIdx, "A", PartA),
  answered(SessionId, QuestionIdx, "B", PartB)
  |> let Status = case 
       when PartA and PartB then "both_correct"
       when PartA and not PartB then "part_b_wrong"
       when not PartA and PartB then "part_a_wrong"
       else "both_wrong"
     end,
     let Impact = case
       when Status = "both_correct" then "points_doubled"
       else "level_reset"
     end.

// Nur Teil A beantwortet
risk_question_analysis(SessionId, QuestionIdx, PartA, false, Status, Impact) :-
  risk_idx(QuestionIdx),
  answered(SessionId, QuestionIdx, "A", PartA),
  not answered(SessionId, QuestionIdx, "B", _)
  |> let Status = "part_b_missing",
     let Impact = "incomplete_risk_question".

// --- TEAMFRAGEN-ANALYSE ---

// Team-Performance bei Frage 9
team_question_analysis(SessionId, TeamId, TotalMembers, CorrectMembers, SuccessRate, Status, Impact) :-
  team_idx(9),
  team_member(UserId, TeamId),
  session(UserId, SessionId),
  team_answer(TeamId, 9, MemberId, IsCorrect)
  |> do fn:group_by(SessionId, TeamId),
     let TotalMembers = fn:Count(),
     let CorrectMembers = fn:CountIf(IsCorrect),
     let SuccessRate = fn:div(CorrectMembers, TotalMembers),
     let Status = case
       when fn:gt(SuccessRate, 0.5) then "team_success"
       else "team_failed"
     end,
     let Impact = case
       when Status = "team_success" then "points_tripled"
       else "normal_points"
     end.

// --- PUNKTEBERECHNUNG-TRACE ---

// Detaillierte Punkteberechnung mit Erklärung
points_calculation_trace(SessionId, QuestionIdx, BasePoints, Multiplier, FinalPoints, Reason) :-
  base_points(QuestionIdx, BasePoints),
  correct_q(SessionId, QuestionIdx),
  not risk_idx(QuestionIdx),
  not team_idx(QuestionIdx)
  |> let Multiplier = 1,
     let FinalPoints = BasePoints,
     let Reason = "standard_question_correct".

points_calculation_trace(SessionId, QuestionIdx, BasePoints, Multiplier, FinalPoints, Reason) :-
  base_points(QuestionIdx, BasePoints),
  correct_q(SessionId, QuestionIdx),
  risk_idx(QuestionIdx)
  |> let Multiplier = 2,
     let FinalPoints = fn:mul(BasePoints, Multiplier),
     let Reason = "risk_question_bonus_applied".

points_calculation_trace(SessionId, QuestionIdx, BasePoints, Multiplier, FinalPoints, Reason) :-
  base_points(QuestionIdx, BasePoints),
  correct_q(SessionId, QuestionIdx),
  team_idx(QuestionIdx),
  team_success(TeamId, QuestionIdx),
  user_in_session(SessionId, UserId),
  team_member(UserId, TeamId)
  |> let Multiplier = 3,
     let FinalPoints = fn:mul(BasePoints, Multiplier),
     let Reason = "team_question_bonus_applied".

// --- PROGRESSION-TRACE ---

// Welche Fragen sind freigeschalten und warum
question_unlock_trace(SessionId, QuestionIdx, Status, Reason, Prerequisites) :-
  q(QuestionIdx),
  watched(SessionId, QuestionIdx),
  correct_q(SessionId, QuestionIdx)
  |> let Status = "unlocked_and_completed",
     let Reason = "video_watched_and_question_correct",
     let Prerequisites = "all_met".

question_unlock_trace(SessionId, QuestionIdx, Status, Reason, Prerequisites) :-
  q(QuestionIdx),
  watched(SessionId, QuestionIdx),
  not correct_q(SessionId, QuestionIdx),
  answered(SessionId, QuestionIdx, _, _)
  |> let Status = "attempted_but_wrong",
     let Reason = "video_watched_but_question_wrong",
     let Prerequisites = "video_met_answer_wrong".

question_unlock_trace(SessionId, QuestionIdx, Status, Reason, Prerequisites) :-
  q(QuestionIdx),
  not watched(SessionId, QuestionIdx)
  |> let Status = "locked",
     let Reason = "video_not_watched",
     let Prerequisites = "video_required".

// Nächste verfügbare Frage mit Begründung
next_question_explanation(SessionId, NextIdx, Reason, Requirements) :-
  next_question(SessionId, NextIdx),
  not risk_idx(NextIdx)
  |> let Reason = "sequential_progression",
     let Requirements = "watch_video_and_answer_correctly".

next_question_explanation(SessionId, NextIdx, Reason, Requirements) :-
  next_question(SessionId, NextIdx),
  risk_idx(NextIdx),
  answered(SessionId, NextIdx, "A", _),
  not answered(SessionId, NextIdx, "B", _)
  |> let Reason = "risk_question_part_b_required",
     let Requirements = "complete_both_parts_a_and_b".

// --- DEADLINE-ANALYSE ---

// Deadline-Status mit verbleibendem Zeitfenster
deadline_analysis(SessionId, DeadlineISO, CurrentTime, Status, TimeRemaining, Urgency) :-
  deadline(SessionId, DeadlineISO),
  now(CurrentTime),
  not deadline_missed(SessionId)
  |> let Status = "active",
     let TimeRemaining = fn:time_diff(DeadlineISO, CurrentTime),
     let Urgency = case
       when fn:lt(TimeRemaining, 3600) then "critical"    // < 1 Stunde
       when fn:lt(TimeRemaining, 86400) then "urgent"     // < 1 Tag
       else "normal"
     end.

deadline_analysis(SessionId, DeadlineISO, CurrentTime, Status, TimeRemaining, Urgency) :-
  deadline(SessionId, DeadlineISO),
  now(CurrentTime),
  deadline_missed(SessionId)
  |> let Status = "expired",
     let TimeRemaining = 0,
     let Urgency = "expired".

// --- PERFORMANCE-INSIGHTS ---

// Session-Performance-Zusammenfassung
session_performance_summary(SessionId, TotalQuestions, CorrectAnswers, AccuracyRate, RiskQuestionsStatus, TeamQuestionStatus, CompletionRate) :-
  answered(SessionId, QuestionIdx, _, IsCorrect)
  |> do fn:group_by(SessionId),
     let TotalQuestions = fn:Count(),
     let CorrectAnswers = fn:CountIf(IsCorrect),
     let AccuracyRate = fn:div(CorrectAnswers, TotalQuestions),
     let CompletionRate = fn:div(TotalQuestions, 10). // Von 10 möglichen Fragen

// Risk-Questions-Status für Summary
session_risk_status(SessionId, RiskStatus) :-
  risk_idx(5), risk_idx(10),
  answered(SessionId, 5, "A", R5A),
  answered(SessionId, 5, "B", R5B),
  answered(SessionId, 10, "A", R10A),
  answered(SessionId, 10, "B", R10B)
  |> let RiskStatus = case
       when R5A and R5B and R10A and R10B then "all_risk_questions_correct"
       when (R5A and R5B) or (R10A and R10B) then "partial_risk_success"
       else "risk_questions_failed"
     end.

// --- EMPFEHLUNGEN ---

// Automatische Empfehlungen basierend auf Performance
performance_recommendations(SessionId, RecommendationType, Priority, Message, ActionRequired) :-
  session_performance_summary(SessionId, _, _, AccuracyRate, _, _, _),
  fn:lt(AccuracyRate, 0.7)
  |> let RecommendationType = "accuracy_improvement",
     let Priority = "high",
     let Message = "Genauigkeit unter 70% - zusätzliche Übung empfohlen",
     let ActionRequired = "review_materials_and_retake".

performance_recommendations(SessionId, RecommendationType, Priority, Message, ActionRequired) :-
  deadline_analysis(SessionId, _, _, _, TimeRemaining, "critical")
  |> let RecommendationType = "time_management",
     let Priority = "urgent",
     let Message = "Weniger als 1 Stunde bis zur Deadline",
     let ActionRequired = "focus_on_remaining_questions".

performance_recommendations(SessionId, RecommendationType, Priority, Message, ActionRequired) :-
  session_risk_status(SessionId, "risk_questions_failed")
  |> let RecommendationType = "risk_focus",
     let Priority = "high",
     let Message = "Risikofragen benötigen besondere Aufmerksamkeit",
     let ActionRequired = "review_risk_question_materials".

// --- TRAINER-DASHBOARD-QUERIES ---

// Vollständiger Session-Report für Trainer
trainer_session_report(SessionId, UserId, Status, StatusReason, PointsBreakdown, RiskAnalysis, TeamAnalysis, Recommendations) :-
  session(UserId, SessionId),
  status_explanation(SessionId, Status, StatusReason, _),
  points_calculation_trace(SessionId, _, _, _, _, _) |> do fn:group_by(SessionId), let PointsBreakdown = fn:collect(),
  risk_question_analysis(SessionId, _, _, _, _, _) |> do fn:group_by(SessionId), let RiskAnalysis = fn:collect(),
  team_question_analysis(SessionId, _, _, _, _, _, _) |> do fn:group_by(SessionId), let TeamAnalysis = fn:collect(),
  performance_recommendations(SessionId, _, _, _, _) |> do fn:group_by(SessionId), let Recommendations = fn:collect().

// Problematische Sessions identifizieren
problematic_sessions(SessionId, UserId, IssueType, Severity, Description) :-
  current_status(SessionId, "RESET_RISK"),
  session(UserId, SessionId)
  |> let IssueType = "risk_failure",
     let Severity = "high",
     let Description = "Student failed risk questions and needs intervention".

problematic_sessions(SessionId, UserId, IssueType, Severity, Description) :-
  current_status(SessionId, "RESET_DEADLINE"),
  session(UserId, SessionId)
  |> let IssueType = "deadline_missed",
     let Severity = "medium",
     let Description = "Student missed deadline and needs rescheduling".

problematic_sessions(SessionId, UserId, IssueType, Severity, Description) :-
  session_performance_summary(SessionId, _, _, AccuracyRate, _, _, _),
  session(UserId, SessionId),
  fn:lt(AccuracyRate, 0.5)
  |> let IssueType = "low_accuracy",
     let Severity = "medium",
     let Description = "Student accuracy below 50% - additional support needed". 