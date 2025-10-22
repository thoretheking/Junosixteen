const express = require('express');
const { mangleClient } = require('../integrations/mangleClient');

const router = express.Router();

// GET /api/explain/decision/:sessionId
router.get('/decision/:sessionId', async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    // Generate facts for the session (in real app, fetch from DB)
    const facts = await generateSessionFacts(sessionId);

    // Get status explanation
    const statusResult = await mangleClient.eval({
      query: `status_explanation("${sessionId}", _Status, _Reason, _Details).`,
      facts,
      params: {}
    });

    // Get risk analysis
    const riskResult = await mangleClient.eval({
      query: `risk_question_analysis("${sessionId}", _QuestionIdx, _PartA, _PartB, _Status, _Impact).`,
      facts,
      params: {}
    });

    // Get team analysis
    const teamResult = await mangleClient.eval({
      query: `team_question_analysis("${sessionId}", _TeamId, _TotalMembers, _CorrectMembers, _SuccessRate, _Status, _Impact).`,
      facts,
      params: {}
    });

    // Get points breakdown
    const pointsResult = await mangleClient.eval({
      query: `points_calculation_trace("${sessionId}", _QuestionIdx, _BasePoints, _Multiplier, _FinalPoints, _Reason).`,
      facts,
      params: {}
    });

    // Get recommendations
    const recommendationsResult = await mangleClient.eval({
      query: `performance_recommendations("${sessionId}", _Type, _Priority, _Message, _Action).`,
      facts,
      params: {}
    });

    // Parse results
    const statusExplanation = statusResult.tables.status_explanation?.[0];
    const riskAnalysis = riskResult.tables.risk_question_analysis || [];
    const teamAnalysis = teamResult.tables.team_question_analysis?.[0];
    const pointsBreakdown = pointsResult.tables.points_calculation_trace || [];
    const recommendations = recommendationsResult.tables.performance_recommendations || [];

    res.json({
      sessionId,
      explanation: {
        status: statusExplanation ? {
          current_status: statusExplanation.col1,
          primary_reason: statusExplanation.col2,
          details: statusExplanation.col3
        } : null,
        
        risk_questions: riskAnalysis.map((risk: any) => ({
          question: risk.col1,
          part_a_correct: risk.col2,
          part_b_correct: risk.col3,
          status: risk.col4,
          impact: risk.col5
        })),
        
        team_question: teamAnalysis ? {
          team_id: teamAnalysis.col1,
          total_members: teamAnalysis.col2,
          correct_members: teamAnalysis.col3,
          success_rate: teamAnalysis.col4,
          status: teamAnalysis.col5,
          impact: teamAnalysis.col6
        } : null,
        
        points_breakdown: pointsBreakdown.map((point: any) => ({
          question: point.col1,
          base_points: point.col2,
          multiplier: point.col3,
          final_points: point.col4,
          reason: point.col5
        })),
        
        recommendations: recommendations.map((rec: any) => ({
          type: rec.col1,
          priority: rec.col2,
          message: rec.col3,
          action_required: rec.col4
        }))
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Decision explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain decision',
      message: error.message
    });
  }
});

// GET /api/explain/progression/:sessionId
router.get('/progression/:sessionId', async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const facts = await generateSessionFacts(sessionId);

    // Get question unlock traces
    const unlockResult = await mangleClient.eval({
      query: `question_unlock_trace("${sessionId}", _QuestionIdx, _Status, _Reason, _Prerequisites).`,
      facts,
      params: {}
    });

    // Get next question explanation
    const nextResult = await mangleClient.eval({
      query: `next_question_explanation("${sessionId}", _NextIdx, _Reason, _Requirements).`,
      facts,
      params: {}
    });

    const unlockTraces = unlockResult.tables.question_unlock_trace || [];
    const nextExplanation = nextResult.tables.next_question_explanation?.[0];

    res.json({
      sessionId,
      progression: {
        question_status: unlockTraces.map((trace: any) => ({
          question: trace.col1,
          status: trace.col2,
          reason: trace.col3,
          prerequisites: trace.col4
        })),
        
        next_question: nextExplanation ? {
          next_idx: nextExplanation.col1,
          reason: nextExplanation.col2,
          requirements: nextExplanation.col3
        } : null
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Progression explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain progression',
      message: error.message
    });
  }
});

// GET /api/explain/deadline/:sessionId
router.get('/deadline/:sessionId', async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const facts = await generateSessionFacts(sessionId);

    // Get deadline analysis
    const deadlineResult = await mangleClient.eval({
      query: `deadline_analysis("${sessionId}", _DeadlineISO, _CurrentTime, _Status, _TimeRemaining, _Urgency).`,
      facts,
      params: {}
    });

    const deadlineAnalysis = deadlineResult.tables.deadline_analysis?.[0];

    if (!deadlineAnalysis) {
      return res.status(404).json({
        error: 'No deadline information found for session',
        sessionId
      });
    }

    res.json({
      sessionId,
      deadline: {
        deadline_iso: deadlineAnalysis.col1,
        current_time: deadlineAnalysis.col2,
        status: deadlineAnalysis.col3,
        time_remaining_seconds: deadlineAnalysis.col4,
        urgency: deadlineAnalysis.col5
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Deadline explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain deadline',
      message: error.message
    });
  }
});

// GET /api/explain/performance/:sessionId
router.get('/performance/:sessionId', async (req: any, res: any) => {
  try {
    const { sessionId } = req.params;

    const facts = await generateSessionFacts(sessionId);

    // Get performance summary
    const performanceResult = await mangleClient.eval({
      query: `session_performance_summary("${sessionId}", _TotalQuestions, _CorrectAnswers, _AccuracyRate, _RiskStatus, _TeamStatus, _CompletionRate).`,
      facts,
      params: {}
    });

    // Get risk status
    const riskStatusResult = await mangleClient.eval({
      query: `session_risk_status("${sessionId}", _RiskStatus).`,
      facts,
      params: {}
    });

    const performance = performanceResult.tables.session_performance_summary?.[0];
    const riskStatus = riskStatusResult.tables.session_risk_status?.[0];

    if (!performance) {
      return res.status(404).json({
        error: 'No performance data found for session',
        sessionId
      });
    }

    res.json({
      sessionId,
      performance: {
        total_questions: performance.col1,
        correct_answers: performance.col2,
        accuracy_rate: performance.col3,
        completion_rate: performance.col6,
        risk_questions_status: riskStatus?.col1 || 'unknown'
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Performance explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain performance',
      message: error.message
    });
  }
});

// POST /api/explain/trainer-report
router.post('/trainer-report', async (req: any, res: any) => {
  try {
    const { sessionIds } = req.body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        error: 'Session IDs array is required',
        example: { sessionIds: ['sess1', 'sess2'] }
      });
    }

    if (sessionIds.length > 20) {
      return res.status(400).json({
        error: 'Too many sessions requested',
        message: 'Maximum 20 sessions per request'
      });
    }

    const reports = [];

    for (const sessionId of sessionIds) {
      try {
        const facts = await generateSessionFacts(sessionId);

        // Get full trainer report
        const reportResult = await mangleClient.eval({
          query: `trainer_session_report("${sessionId}", _UserId, _Status, _StatusReason, _PointsBreakdown, _RiskAnalysis, _TeamAnalysis, _Recommendations).`,
          facts,
          params: {}
        });

        // Get problematic session info
        const problemResult = await mangleClient.eval({
          query: `problematic_sessions("${sessionId}", _UserId, _IssueType, _Severity, _Description).`,
          facts,
          params: {}
        });

        const report = reportResult.tables.trainer_session_report?.[0];
        const problems = problemResult.tables.problematic_sessions || [];

        if (report) {
          reports.push({
            session_id: sessionId,
            user_id: report.col1,
            status: report.col2,
            status_reason: report.col3,
            is_problematic: problems.length > 0,
            issues: problems.map((problem: any) => ({
              type: problem.col2,
              severity: problem.col3,
              description: problem.col4
            })),
            // Note: In real implementation, parse the collected arrays
            points_breakdown: 'Available in detailed view',
            risk_analysis: 'Available in detailed view',
            team_analysis: 'Available in detailed view',
            recommendations: 'Available in detailed view'
          });
        }
      } catch (sessionError) {
        console.error(`Error processing session ${sessionId}:`, sessionError);
        reports.push({
          session_id: sessionId,
          error: 'Failed to process session',
          message: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        });
      }
    }

    res.json({
      trainer_report: {
        total_sessions: sessionIds.length,
        processed_sessions: reports.length,
        problematic_sessions: reports.filter(r => r.is_problematic).length,
        reports
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Trainer report error:', error);
    res.status(500).json({
      error: 'Failed to generate trainer report',
      message: error.message
    });
  }
});

// Helper function to generate session facts
async function generateSessionFacts(sessionId: string) {
  const facts = [];

  // Current time
  facts.push({
    predicate: 'now',
    args: [new Date().toISOString()]
  });

  // Sample session data based on sessionId
  const userId = sessionId.includes('lea') ? 'lea' : 
                 sessionId.includes('max') ? 'max' : 'demo-user';

  // Session fact
  facts.push({
    predicate: 'session',
    args: [userId, sessionId]
  });

  facts.push({
    predicate: 'level',
    args: [sessionId, 3]
  });

  // Sample answers based on session type
  if (sessionId.includes('happy')) {
    // Happy path - all correct
    for (let i = 1; i <= 10; i++) {
      facts.push({
        predicate: 'watched',
        args: [sessionId, i]
      });

      if (i === 5 || i === 10) {
        // Risk questions
        facts.push({
          predicate: 'answered',
          args: [sessionId, i, 'A', true]
        });
        facts.push({
          predicate: 'answered',
          args: [sessionId, i, 'B', true]
        });
      } else {
        facts.push({
          predicate: 'answered',
          args: [sessionId, i, '-', true]
        });
      }
    }
  } else if (sessionId.includes('risk-fail')) {
    // Risk failure
    for (let i = 1; i <= 5; i++) {
      facts.push({
        predicate: 'watched',
        args: [sessionId, i]
      });

      if (i === 5) {
        facts.push({
          predicate: 'answered',
          args: [sessionId, i, 'A', true]
        });
        facts.push({
          predicate: 'answered',
          args: [sessionId, i, 'B', false]
        });
      } else {
        facts.push({
          predicate: 'answered',
          args: [sessionId, i, '-', true]
        });
      }
    }
  } else {
    // Default - partial progress
    for (let i = 1; i <= 7; i++) {
      facts.push({
        predicate: 'watched',
        args: [sessionId, i]
      });
      facts.push({
        predicate: 'answered',
        args: [sessionId, i, '-', i <= 6]
      });
    }
  }

  // Deadline
  const deadline = sessionId.includes('deadline') ? 
    '2025-08-20T23:59:00Z' : '2025-12-31T23:59:00Z';
  
  facts.push({
    predicate: 'deadline',
    args: [sessionId, deadline]
  });

  // Base points
  for (let i = 1; i <= 10; i++) {
    const points = i <= 2 ? 1 : i <= 4 ? 2 : i <= 6 ? 3 : i <= 8 ? 4 : i === 9 ? 5 : 6;
    facts.push({
      predicate: 'base_points',
      args: [i, points]
    });
  }

  // Question indices
  for (let i = 1; i <= 10; i++) {
    facts.push({
      predicate: 'q',
      args: [i]
    });
  }

  return facts;
}

module.exports = { explainability: router }; 