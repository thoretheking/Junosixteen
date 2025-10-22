# Empfehlungs-Regeln (JunoSixteen)
# WAS: Intelligente Empfehlungen für Wissenssnacks basierend auf Lernlücken
# WARUM: Personalisierte Lernunterstützung für bessere Lernergebnisse

# Ein Konzept gilt als verfehlt wenn mindestens 2 Fragen dazu falsch beantwortet
# WAS: Identifiziert Wissenslücken basierend auf Fehlerrate
# WARUM: Frühe Erkennung von Verständnisproblemen für gezielte Hilfe
missed_concept(U, C) :- 
  wrong_tagged(U, C), 
  count_wrong(U, C, Count),
  Count >= 2.

# Empfehle Wissenssnack wenn Konzept verfehlt und Modul es abdeckt und noch nicht absolviert
# WAS: Zentrale Empfehlungslogik für Microlearning
# WARUM: Zielgerichtete Lernhilfe für identifizierte Schwächen
recommend_snack(U, M) :- 
  missed_concept(U, C), 
  module_covers(M, C), 
  not already_completed(U, M).

# Prioritäts-basierte Empfehlungen

# Hohe Priorität: Kritische Konzepte (Datenschutz, Sicherheit)
# WAS: Markiert besonders wichtige Lernbereiche
# WARUM: Compliance-relevante Themen haben Vorrang
high_priority_concept("datenschutz").
high_priority_concept("cybersicherheit").
high_priority_concept("dsgvo").
high_priority_concept("arbeitsrecht").

# Empfehlung mit hoher Priorität für kritische Konzepte
# WAS: Priorisiert wichtige Lernbereiche
# WARUM: Business-kritische Themen werden bevorzugt behandelt
recommend_priority_snack(U, M, "high") :-
  missed_concept(U, C),
  high_priority_concept(C),
  module_covers(M, C),
  not already_completed(U, M).

# Mittlere Priorität: Häufig verfehlte Konzepte
# WAS: Erkennt Konzepte die viele User problematisch finden
# WARUM: Gemeinsame Schwächen deuten auf Schulungsbedarf hin
medium_priority_concept(C) :-
  count_users_missed(C, UserCount),
  UserCount >= 10.

recommend_priority_snack(U, M, "medium") :-
  missed_concept(U, C),
  medium_priority_concept(C),
  module_covers(M, C),
  not already_completed(U, M).

# Niedrige Priorität: Einzelne verfehlte Konzepte
# WAS: Standard-Empfehlungen für individuelle Lücken
# WARUM: Vollständige Abdeckung aller Lernbedürfnisse
recommend_priority_snack(U, M, "low") :-
  missed_concept(U, C),
  not high_priority_concept(C),
  not medium_priority_concept(C),
  module_covers(M, C),
  not already_completed(U, M).

# Time-based Empfehlungen

# Empfehlung vor Deadline: Wenn Level-Deadline naht
# WAS: Zeitkritische Empfehlungen basierend auf Deadlines
# WARUM: Unterstützt rechtzeitigen Level-Abschluss
recommend_before_deadline(U, M) :-
  current_level(U, L),
  deadline(L, DeadlineTime),
  now(CurrentTime),
  TimeLeft = DeadlineTime - CurrentTime,
  TimeLeft < 86400,  # Weniger als 24 Stunden
  missed_concept(U, C),
  module_covers(M, C),
  not already_completed(U, M).

# Adaptive Empfehlungen basierend auf Lerntyp

# Langsame Lerner benötigen einfachere Module
# WAS: Anpassung an Lerngeschwindigkeit
# WARUM: Individualisierte Lernpfade für besseren Erfolg
slow_learner(U) :-
  average_question_time(U, AvgTime),
  AvgTime > 180.  # Mehr als 3 Minuten pro Frage

recommend_easy_module(U, M) :-
  slow_learner(U),
  missed_concept(U, C),
  module_covers(M, C),
  module_difficulty(M, "easy"),
  not already_completed(U, M).

# Schnelle Lerner können advanced Module bekommen
# WAS: Herausfordernde Inhalte für schnelle Lerner
# WARUM: Vermeidet Unterforderung und hält Interesse hoch
fast_learner(U) :-
  average_question_time(U, AvgTime),
  AvgTime < 60.  # Weniger als 1 Minute pro Frage

recommend_advanced_module(U, M) :-
  fast_learner(U),
  missed_concept(U, C),
  module_covers(M, C),
  module_difficulty(M, "advanced"),
  not already_completed(U, M).

# Wissenssnack-Kategorien und Zuordnungen

# QUICK Snacks (2-3 Min) für schnelle Wissenslücken
# WAS: Kurze Module für spezifische Konzepte
# WARUM: Minimaler Zeitaufwand für gezielte Verbesserung
recommend_quick_snack(U, M) :-
  missed_concept(U, C),
  module_covers(M, C),
  module_type(M, "quick"),
  not already_completed(U, M).

# SHORT Snacks (5-7 Min) für mittlere Vertiefung
# WAS: Mittlere Module für komplexere Themen
# WARUM: Balance zwischen Tiefe und Zeitaufwand
recommend_short_snack(U, M) :-
  missed_concept(U, C),
  module_covers(M, C),
  module_type(M, "short"),
  concept_complexity(C, "medium"),
  not already_completed(U, M).

# MEDIUM Snacks (10-15 Min) für komplexe Themen
# WAS: Ausführliche Module für schwierige Konzepte
# WARUM: Tieferes Verständnis für kritische Themen
recommend_medium_snack(U, M) :-
  missed_concept(U, C),
  module_covers(M, C),
  module_type(M, "medium"),
  concept_complexity(C, "high"),
  not already_completed(U, M).

# Team-basierte Empfehlungen

# Empfehle gemeinsame Module für Teams mit ähnlichen Lücken
# WAS: Kollaboratives Lernen für Teams
# WARUM: Effizienter Wissenstransfer und Teambuilding
recommend_team_module(Team, M) :-
  team_common_weakness(Team, C),
  module_covers(M, C),
  module_supports_team(M).

# Häufige Team-Schwäche wenn >50% des Teams Konzept verfehlt haben
# WAS: Identifiziert Team-weite Wissenslücken
# WARUM: Strukturelle Probleme erfordern Team-Intervention
team_common_weakness(Team, C) :-
  team_size(Team, Size),
  count_team_missed(Team, C, MissedCount),
  MissedCount * 2 > Size.

# Erfolgs-Tracking für Empfehlungen

# Empfehlung war erfolgreich wenn Konzept nach Modul-Completion nicht mehr verfehlt
# WAS: Misst Effektivität von Empfehlungen
# WARUM: Kontinuierliche Verbesserung des Empfehlungsystems
recommendation_success(U, M, C) :-
  recommended_module(U, M, C, RecommendTime),
  completed_module(U, M, CompletionTime),
  CompletionTime > RecommendTime,
  not missed_concept_after(U, C, CompletionTime).

# Lernpfad-Optimierung basierend auf Erfolgsraten
# WAS: Anpassung von Empfehlungsalgorithmen
# WARUM: Datengetriebene Verbesserung der Lernhilfe
optimize_recommendation(C, M) :-
  recommendation_success_rate(C, M, SuccessRate),
  SuccessRate > 0.8.  # 80% Erfolgsrate 