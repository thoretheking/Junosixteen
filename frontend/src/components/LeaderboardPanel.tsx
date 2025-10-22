import React, { useState, useEffect } from "react";
import { getLeaderboard, getUserStats, getTeamStats, getUserBadges } from "../api/policy";

interface LeaderboardEntry {
  userId?: string;
  teamId?: string;
  name?: string;
  points: number;
  rank: number;
  memberCount?: number;
}

interface UserStats {
  userId: string;
  stats: {
    alltime: { rank: number; points: number };
    weekly: { rank: number; points: number };
    monthly: { rank: number; points: number };
  };
}

interface Badge {
  type: string;
  name: string;
  earned_at: string;
  description: string;
}

export default function LeaderboardPanel({ 
  userId, 
  showUserStats = true 
}: { 
  userId?: string; 
  showUserStats?: boolean; 
}) {
  const [activeTab, setActiveTab] = useState<'individual' | 'team' | 'badges'>('individual');
  const [activePeriod, setActivePeriod] = useState<'alltime' | 'weekly' | 'monthly'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, activePeriod, userId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load leaderboard
      const leaderboardData = await getLeaderboard(activeTab === 'badges' ? 'individual' : activeTab, activePeriod);
      setLeaderboard(leaderboardData.leaderboard || []);

      // Load user stats if userId provided
      if (userId && showUserStats) {
        try {
          const stats = await getUserStats(userId);
          setUserStats(stats);
        } catch (err) {
          console.warn('Failed to load user stats:', err);
        }

        // Load user badges
        if (activeTab === 'badges') {
          try {
            const badges = await getUserBadges(userId);
            setUserBadges(badges.badges || []);
          } catch (err) {
            console.warn('Failed to load user badges:', err);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100'; // Gold
    if (rank === 2) return 'text-gray-600 bg-gray-100';     // Silver  
    if (rank === 3) return 'text-orange-600 bg-orange-100'; // Bronze
    return 'text-blue-600 bg-blue-50';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold flex items-center">
          🏆 Leaderboard
          {loading && <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
        </h2>
        <p className="text-gray-600 text-sm">Rankings und Achievements</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'individual', label: '👤 Individual', icon: '👤' },
            { key: 'team', label: '👥 Teams', icon: '👥' },
            { key: 'badges', label: '🏅 Badges', icon: '🏅' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Period Selector (für Individual/Team) */}
      {activeTab !== 'badges' && (
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex space-x-4">
            {[
              { key: 'weekly', label: '📅 Diese Woche' },
              { key: 'monthly', label: '📆 Dieser Monat' },
              { key: 'alltime', label: '🕐 All-Time' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setActivePeriod(period.key as any)}
                className={`px-3 py-1 rounded text-sm ${
                  activePeriod === period.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Stats (wenn userId vorhanden) */}
      {userId && showUserStats && userStats && (
        <div className="px-6 py-4 bg-blue-50 border-b">
          <h3 className="font-medium mb-2">📊 Deine Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{getRankEmoji(userStats.stats.alltime.rank)}</div>
              <div className="text-gray-600">All-Time: #{userStats.stats.alltime.rank}</div>
              <div className="font-medium">{userStats.stats.alltime.points} Punkte</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{getRankEmoji(userStats.stats.weekly.rank)}</div>
              <div className="text-gray-600">Woche: #{userStats.stats.weekly.rank}</div>
              <div className="font-medium">{userStats.stats.weekly.points} Punkte</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{getRankEmoji(userStats.stats.monthly.rank)}</div>
              <div className="text-gray-600">Monat: #{userStats.stats.monthly.rank}</div>
              <div className="font-medium">{userStats.stats.monthly.points} Punkte</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <button
              onClick={loadData}
              className="ml-4 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'badges' ? (
          // Badges View
          <div>
            <h3 className="text-lg font-medium mb-4">🏅 Achievements & Badges</h3>
            {userBadges.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {userBadges.map((badge, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {badge.type.includes('top_performer') && '🥇'}
                        {badge.type.includes('team_player') && '👥'}
                        {badge.type.includes('consistent') && '📅'}
                        {badge.type.includes('speed') && '⚡'}
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{badge.name}</h4>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                        <p className="text-xs text-gray-500">
                          Erhalten: {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Noch keine Badges erhalten. Spiele weiter um Achievements zu sammeln! 🎯
              </div>
            )}
          </div>
        ) : (
          // Leaderboard View
          <div>
            <h3 className="text-lg font-medium mb-4">
              {activeTab === 'individual' ? '👤 Individual Rankings' : '👥 Team Rankings'}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({activePeriod === 'weekly' ? 'Diese Woche' : 
                  activePeriod === 'monthly' ? 'Dieser Monat' : 'All-Time'})
              </span>
            </h3>
            
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.userId || entry.teamId} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      entry.userId === userId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(entry.rank)}`}>
                        {entry.rank <= 3 ? getRankEmoji(entry.rank) : entry.rank}
                      </div>
                      <div>
                        <div className="font-medium">
                          {entry.name || entry.userId || entry.teamId}
                          {entry.userId === userId && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Du</span>}
                        </div>
                        {entry.memberCount && (
                          <div className="text-sm text-gray-600">{entry.memberCount} Mitglieder</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{entry.points}</div>
                      <div className="text-xs text-gray-500">Punkte</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Keine Daten für {activePeriod} verfügbar
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
        <span>Aktualisiert: {new Date().toLocaleString()}</span>
        <button 
          onClick={loadData}
          className="text-blue-600 hover:text-blue-800 underline"
          disabled={loading}
        >
          🔄 Aktualisieren
        </button>
      </div>
    </div>
  );
} 