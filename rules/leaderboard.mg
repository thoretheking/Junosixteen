// === LEADERBOARD REGELN ===
// User & Team Rankings für verschiedene Zeiträume mit ISO-Kalender

// --- BASIS-FAKTE (kommen aus Backend/DB) ---
// user_completion(UserId, SessionId, Level, CompletedAt_ISO, FinalPoints)
// team_member(UserId, TeamId)
// user_profile(UserId, Name, Department, Role)

// --- ISO-KALENDER-FUNKTIONEN ---
current_week(W) :- 
  now(Now),
  iso_week_of_year(Now, W).

current_month(M) :-
  now(Now),
  iso_month_of_year(Now, M).

current_year(Y) :-
  now(Now),
  iso_year_of_date(Now, Y).

// Completion in aktueller Woche (ISO-Woche)
completion_this_week(UserId, SessionId, Level, Points) :-
  user_completion(UserId, SessionId, Level, CompletedAt, Points),
  current_week(CurrentWeek),
  iso_week_of_year(CompletedAt, CompletionWeek),
  CurrentWeek = CompletionWeek.

// Completion in aktuellem Monat
completion_this_month(UserId, SessionId, Level, Points) :-
  user_completion(UserId, SessionId, Level, CompletedAt, Points),
  current_month(CurrentMonth),
  iso_month_of_year(CompletedAt, CompletionMonth),
  CurrentMonth = CompletionMonth.

// --- EINZEL-LEADERBOARD ---

// Gesamt-Punkte pro User (All-Time)
user_total_points(UserId, TotalPoints) :-
  user_completion(UserId, _, _, _, Points)
  |> do group_by(UserId),
     let TotalPoints = sum(Points).

// Wöchentliche Punkte
user_weekly_points(UserId, WeeklyPoints) :-
  completion_this_week(UserId, _, _, Points)
  |> do group_by(UserId),
     let WeeklyPoints = sum(Points).

// Monatliche Punkte
user_monthly_points(UserId, MonthlyPoints) :-
  completion_this_month(UserId, _, _, Points)
  |> do group_by(UserId),
     let MonthlyPoints = sum(Points).

// Level-Completions pro User
user_level_count(UserId, LevelCount) :-
  user_completion(UserId, _, Level, _, _)
  |> do group_by(UserId),
     let LevelCount = count().

// Durchschnittliche Punkte pro Level
user_avg_points(UserId, AvgPoints) :-
  user_total_points(UserId, Total),
  user_level_count(UserId, Count),
  Count > 0
  |> let AvgPoints = div(Total, Count).

// --- TEAM-LEADERBOARD ---

// Team-Gesamt-Punkte
team_total_points(TeamId, TotalPoints) :-
  team_member(UserId, TeamId),
  user_completion(UserId, _, _, _, Points)
  |> do group_by(TeamId),
     let TotalPoints = sum(Points).

// Team-Wochenpunkte
team_weekly_points(TeamId, WeeklyPoints) :-
  team_member(UserId, TeamId),
  completion_this_week(UserId, _, _, Points)
  |> do group_by(TeamId),
     let WeeklyPoints = sum(Points).

// Team-Monatspunkte
team_monthly_points(TeamId, MonthlyPoints) :-
  team_member(UserId, TeamId),
  completion_this_month(UserId, _, _, Points)
  |> do group_by(TeamId),
     let MonthlyPoints = sum(Points).

// Team-Mitglieder-Anzahl
team_member_count(TeamId, MemberCount) :-
  team_member(UserId, TeamId)
  |> do group_by(TeamId),
     let MemberCount = count().

// Team-Durchschnitt pro Mitglied
team_avg_per_member(TeamId, AvgPerMember) :-
  team_total_points(TeamId, Total),
  team_member_count(TeamId, Count),
  Count > 0
  |> let AvgPerMember = div(Total, Count).

// Aktive Team-Mitglieder (diese Woche)
team_active_members(TeamId, ActiveCount) :-
  team_member(UserId, TeamId),
  completion_this_week(UserId, _, _, _)
  |> do group_by(TeamId),
     let ActiveCount = count().

// --- RANKING-POSITIONEN ---

// Individual Rankings (mit Tiebreaker: bei gleichen Punkten zählt frühere Completion)
individual_rank_alltime(UserId, Rank) :-
  user_total_points(UserId, Points),
  user_total_points(OtherUserId, OtherPoints),
  (OtherPoints > Points; 
   (OtherPoints = Points, earliest_completion(OtherUserId, EarlierTime), 
    earliest_completion(UserId, LaterTime), EarlierTime < LaterTime))
  |> do group_by(UserId),
     let BetterCount = count(),
     let Rank = plus(BetterCount, 1).

// Hilfsprädikat: früheste Completion eines Users
earliest_completion(UserId, EarliestTime) :-
  user_completion(UserId, _, _, CompletedAt, _)
  |> do group_by(UserId),
     let EarliestTime = min(CompletedAt).

individual_rank_weekly(UserId, Rank) :-
  user_weekly_points(UserId, Points),
  user_weekly_points(OtherUserId, OtherPoints),
  OtherPoints > Points
  |> do group_by(UserId),
     let BetterCount = count(),
     let Rank = plus(BetterCount, 1).

individual_rank_monthly(UserId, Rank) :-
  user_monthly_points(UserId, Points),
  user_monthly_points(OtherUserId, OtherPoints),
  OtherPoints > Points
  |> do group_by(UserId),
     let BetterCount = count(),
     let Rank = plus(BetterCount, 1).

// Team-Rankings
team_rank_alltime(TeamId, Rank) :-
  team_total_points(TeamId, Points),
  team_total_points(OtherTeamId, OtherPoints),
  OtherPoints > Points
  |> do group_by(TeamId),
     let BetterCount = count(),
     let Rank = plus(BetterCount, 1).

team_rank_weekly(TeamId, Rank) :-
  team_weekly_points(TeamId, Points),
  team_weekly_points(OtherTeamId, OtherPoints),
  OtherPoints > Points
  |> do group_by(TeamId),
     let BetterCount = count(),
     let Rank = plus(BetterCount, 1).

// --- ACHIEVEMENTS & BADGES ---

// Top-Performer Badge (Top 10%)
top_performer_badge(UserId) :-
  individual_rank_alltime(UserId, Rank),
  user_total_points(_, _)
  |> do group_by(),
     let TotalUsers = count(),
     let TopTenPercent = div(TotalUsers, 10),
     guard lte(Rank, TopTenPercent).

// Team-Player Badge (mindestens 5 Team-Completions)
team_player_badge(UserId) :-
  team_member(UserId, TeamId),
  user_completion(UserId, _, _, _, _)
  |> do group_by(UserId),
     let CompletionCount = count(),
     guard gte(CompletionCount, 5).

// Consistent-Learner Badge (mindestens 3 Wochen aktiv)
consistent_learner_badge(UserId) :-
  completion_this_week(UserId, _, _, _),
  user_weekly_streak(UserId, Weeks),
  guard gte(Weeks, 3).

// Vereinfachte Streak-Berechnung (kann erweitert werden)
user_weekly_streak(UserId, StreakWeeks) :-
  completion_this_week(UserId, _, _, _)
  |> let StreakWeeks = 1.

// Speed-Runner Badge (Level in unter 30 Minuten)
speed_runner_badge(UserId) :-
  user_completion(UserId, SessionId, Level, CompletedAt, _),
  session_start_time(SessionId, StartTime),
  time_diff_minutes(StartTime, CompletedAt, Duration),
  guard lte(Duration, 30).

// --- DEPARTMENT-RANKINGS ---

// Department-Punkte
department_total_points(Department, TotalPoints) :-
  user_profile(UserId, _, Department, _),
  user_completion(UserId, _, _, _, Points)
  |> do group_by(Department),
     let TotalPoints = sum(Points).

// Department-Ranking
department_rank(Department, Rank) :-
  department_total_points(Department, Points),
  department_total_points(OtherDept, OtherPoints),
  OtherPoints > Points
  |> do group_by(Department),
     let BetterCount = count(),
     let Rank = plus(BetterCount, 1).

// Department-Aktivität (aktive User diese Woche)
department_active_users(Department, ActiveCount) :-
  user_profile(UserId, _, Department, _),
  completion_this_week(UserId, _, _, _)
  |> do group_by(Department),
     let ActiveCount = count().

// --- QUERY-INTERFACES für API ---

// Top N Individual Leaders
top_individual_leaders(UserId, Name, Points, Rank, Period) :-
  Period = "alltime",
  user_total_points(UserId, Points),
  individual_rank_alltime(UserId, Rank),
  user_profile(UserId, Name, _, _),
  guard lte(Rank, 10).

top_individual_leaders(UserId, Name, Points, Rank, Period) :-
  Period = "weekly",
  user_weekly_points(UserId, Points),
  individual_rank_weekly(UserId, Rank),
  user_profile(UserId, Name, _, _),
  guard lte(Rank, 10).

top_individual_leaders(UserId, Name, Points, Rank, Period) :-
  Period = "monthly",
  user_monthly_points(UserId, Points),
  individual_rank_monthly(UserId, Rank),
  user_profile(UserId, Name, _, _),
  guard lte(Rank, 10).

// Top N Team Leaders
top_team_leaders(TeamId, Points, Rank, MemberCount, Period) :-
  Period = "alltime",
  team_total_points(TeamId, Points),
  team_rank_alltime(TeamId, Rank),
  team_member_count(TeamId, MemberCount),
  guard lte(Rank, 10).

top_team_leaders(TeamId, Points, Rank, MemberCount, Period) :-
  Period = "weekly",
  team_weekly_points(TeamId, Points),
  team_rank_weekly(TeamId, Rank),
  team_member_count(TeamId, MemberCount),
  guard lte(Rank, 10).

// User-spezifische Leaderboard-Info
user_leaderboard_stats(UserId, AllTimeRank, AllTimePoints, WeeklyRank, WeeklyPoints, MonthlyRank, MonthlyPoints) :-
  individual_rank_alltime(UserId, AllTimeRank),
  user_total_points(UserId, AllTimePoints),
  individual_rank_weekly(UserId, WeeklyRank),
  user_weekly_points(UserId, WeeklyPoints),
  individual_rank_monthly(UserId, MonthlyRank),
  user_monthly_points(UserId, MonthlyPoints).

// Team-spezifische Leaderboard-Info
team_leaderboard_stats(TeamId, AllTimeRank, AllTimePoints, WeeklyRank, WeeklyPoints, MemberCount, ActiveMembers) :-
  team_rank_alltime(TeamId, AllTimeRank),
  team_total_points(TeamId, AllTimePoints),
  team_rank_weekly(TeamId, WeeklyRank),
  team_weekly_points(TeamId, WeeklyPoints),
  team_member_count(TeamId, MemberCount),
  team_active_members(TeamId, ActiveMembers).

// --- SPEZIELLE QUERIES ---

// Aufsteiger der Woche (große Verbesserung im Weekly Rank)
weekly_climber(UserId, Name, WeeklyRank, Improvement) :-
  individual_rank_weekly(UserId, WeeklyRank),
  individual_rank_alltime(UserId, AllTimeRank),
  user_profile(UserId, Name, _, _),
  guard gt(AllTimeRank, WeeklyRank),
  let Improvement = minus(AllTimeRank, WeeklyRank),
  guard gte(Improvement, 3).

// Team-Rivalität (Teams mit ähnlichen Punktzahlen)
team_rivalry(Team1, Team2, PointsDiff) :-
  team_total_points(Team1, Points1),
  team_total_points(Team2, Points2),
  Team1 != Team2,
  let PointsDiff = abs(minus(Points1, Points2)),
  guard lte(PointsDiff, 50).

// Department-Champion (bester User pro Department)
department_champion(Department, UserId, Name, Points) :-
  user_profile(UserId, Name, Department, _),
  user_total_points(UserId, Points),
  not (user_profile(OtherUserId, _, Department, _),
       user_total_points(OtherUserId, OtherPoints),
       OtherPoints > Points). 