const express = require('express');
const { mangleClient } = require('../integrations/mangleClient');

const router = express.Router();

// Validation helper
function validatePeriod(period: string) {
  return ['alltime', 'weekly', 'monthly'].includes(period);
}

function validateLimit(limit: any) {
  const num = parseInt(limit);
  return !isNaN(num) && num > 0 && num <= 100;
}

// GET /api/leaderboard/individual/:period
router.get('/individual/:period', async (req: any, res: any) => {
  try {
    const { period } = req.params;
    const limit = req.query.limit || 10;

    if (!validatePeriod(period)) {
      return res.status(400).json({
        error: 'Invalid period',
        valid_periods: ['alltime', 'weekly', 'monthly']
      });
    }

    if (!validateLimit(limit)) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 100'
      });
    }

    // Mock facts für Demo (in echter App aus DB)
    const facts = await generateLeaderboardFacts();
    
    const result = await mangleClient.eval({
      query: `top_individual_leaders(_UserId, _Name, _Points, _Rank, "${period}").`,
      facts,
      params: { limit: parseInt(limit) }
    });

    const leaderboard = result.tables.top_individual_leaders || [];
    
    res.json({
      period,
      type: 'individual',
      leaderboard: leaderboard.slice(0, parseInt(limit)).map((entry: any) => ({
        userId: entry.col0,
        name: entry.col1,
        points: entry.col2,
        rank: entry.col3
      })),
      total_entries: leaderboard.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Individual leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch individual leaderboard',
      message: error.message
    });
  }
});

// GET /api/leaderboard/team/:period
router.get('/team/:period', async (req: any, res: any) => {
  try {
    const { period } = req.params;
    const limit = req.query.limit || 10;

    if (!validatePeriod(period)) {
      return res.status(400).json({
        error: 'Invalid period',
        valid_periods: ['alltime', 'weekly', 'monthly']
      });
    }

    if (!validateLimit(limit)) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 100'
      });
    }

    const facts = await generateLeaderboardFacts();
    
    const result = await mangleClient.eval({
      query: `top_team_leaders(_TeamId, _Points, _Rank, _MemberCount, "${period}").`,
      facts,
      params: { limit: parseInt(limit) }
    });

    const leaderboard = result.tables.top_team_leaders || [];
    
    res.json({
      period,
      type: 'team',
      leaderboard: leaderboard.slice(0, parseInt(limit)).map((entry: any) => ({
        teamId: entry.col0,
        points: entry.col1,
        rank: entry.col2,
        memberCount: entry.col3
      })),
      total_entries: leaderboard.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Team leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch team leaderboard',
      message: error.message
    });
  }
});

// GET /api/leaderboard/user/:userId/stats
router.get('/user/:userId/stats', async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const facts = await generateLeaderboardFacts();
    
    const result = await mangleClient.eval({
      query: `user_leaderboard_stats("${userId}", _AllTimeRank, _AllTimePoints, _WeeklyRank, _WeeklyPoints, _MonthlyRank, _MonthlyPoints).`,
      facts,
      params: {}
    });

    const stats = result.tables.user_leaderboard_stats?.[0];
    
    if (!stats) {
      return res.status(404).json({
        error: 'User not found or no stats available',
        userId
      });
    }

    res.json({
      userId,
      stats: {
        alltime: {
          rank: stats.col1,
          points: stats.col2
        },
        weekly: {
          rank: stats.col3,
          points: stats.col4
        },
        monthly: {
          rank: stats.col5,
          points: stats.col6
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('User stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch user stats',
      message: error.message
    });
  }
});

// GET /api/leaderboard/team/:teamId/stats
router.get('/team/:teamId/stats', async (req: any, res: any) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        error: 'Team ID is required'
      });
    }

    const facts = await generateLeaderboardFacts();
    
    const result = await mangleClient.eval({
      query: `team_leaderboard_stats("${teamId}", _AllTimeRank, _AllTimePoints, _WeeklyRank, _WeeklyPoints, _MemberCount, _ActiveMembers).`,
      facts,
      params: {}
    });

    const stats = result.tables.team_leaderboard_stats?.[0];
    
    if (!stats) {
      return res.status(404).json({
        error: 'Team not found or no stats available',
        teamId
      });
    }

    res.json({
      teamId,
      stats: {
        alltime: {
          rank: stats.col1,
          points: stats.col2
        },
        weekly: {
          rank: stats.col3,
          points: stats.col4
        },
        members: {
          total: stats.col5,
          active_this_week: stats.col6
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Team stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch team stats',
      message: error.message
    });
  }
});

// GET /api/leaderboard/departments
router.get('/departments', async (req: any, res: any) => {
  try {
    const limit = req.query.limit || 10;

    if (!validateLimit(limit)) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 100'
      });
    }

    const facts = await generateLeaderboardFacts();
    
    const result = await mangleClient.eval({
      query: 'department_total_points(_Department, _Points).',
      facts,
      params: {}
    });

    const departments = result.tables.department_total_points || [];
    
    // Sort by points descending
    departments.sort((a: any, b: any) => b.col1 - a.col1);
    
    res.json({
      type: 'departments',
      leaderboard: departments.slice(0, parseInt(limit)).map((entry: any, index: number) => ({
        department: entry.col0,
        points: entry.col1,
        rank: index + 1
      })),
      total_entries: departments.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Department leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch department leaderboard',
      message: error.message
    });
  }
});

// GET /api/leaderboard/badges/:userId
router.get('/badges/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const facts = await generateLeaderboardFacts();
    
    // Check all badge types
    const badgeQueries = [
      'top_performer_badge',
      'team_player_badge',
      'consistent_learner_badge'
    ];

    const badges = [];
    
    for (const badgeType of badgeQueries) {
      const result = await mangleClient.eval({
        query: `${badgeType}("${userId}").`,
        facts,
        params: {}
      });
      
      if (result.tables[badgeType]?.length > 0) {
        badges.push({
          type: badgeType,
          name: badgeType.replace('_badge', '').replace('_', ' '),
          earned_at: new Date().toISOString() // In real app: from DB
        });
      }
    }

    res.json({
      userId,
      badges,
      badge_count: badges.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Badges error:', error);
    res.status(500).json({
      error: 'Failed to fetch badges',
      message: error.message
    });
  }
});

// Helper function to generate sample leaderboard facts
async function generateLeaderboardFacts() {
  // In a real application, this would fetch from database
  // For demo purposes, we generate sample data
  
  const facts = [];
  
  // Current time
  facts.push({
    predicate: 'now',
    args: [new Date().toISOString()]
  });

  // Sample user completions
  const sampleUsers = [
    { id: 'lea', name: 'Lea Müller', dept: 'IT', points: 465 },
    { id: 'max', name: 'Max Schmidt', dept: 'Marketing', points: 420 },
    { id: 'kim', name: 'Kim Chen', dept: 'IT', points: 380 },
    { id: 'tom', name: 'Tom Weber', dept: 'Sales', points: 350 },
    { id: 'anna', name: 'Anna Fischer', dept: 'HR', points: 320 }
  ];

  const sampleTeams = [
    { id: 'team-alpha', members: ['lea', 'max'] },
    { id: 'team-beta', members: ['kim', 'tom'] },
    { id: 'team-gamma', members: ['anna'] }
  ];

  // Generate user completions
  sampleUsers.forEach(user => {
    // User profiles
    facts.push({
      predicate: 'user_profile',
      args: [user.id, user.name, user.dept, 'employee']
    });

    // Recent completion (this week)
    facts.push({
      predicate: 'user_completion',
      args: [
        user.id,
        `sess-${user.id}-001`,
        3,
        new Date().toISOString(),
        user.points
      ]
    });

    // Older completion (for all-time stats)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    facts.push({
      predicate: 'user_completion',
      args: [
        user.id,
        `sess-${user.id}-002`,
        2,
        lastWeek.toISOString(),
        Math.floor(user.points * 0.8)
      ]
    });
  });

  // Generate team memberships
  sampleTeams.forEach(team => {
    team.members.forEach(userId => {
      facts.push({
        predicate: 'team_member',
        args: [userId, team.id]
      });
    });
  });

  return facts;
}

module.exports = { leaderboard: router }; 