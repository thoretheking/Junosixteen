export async function canStartNext(userId: string, level: number) {
  const res = await fetch("http://localhost:5000/api/progress/decide", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ userId, level })
  });
  return await res.json(); // { canStartNext, userId, level, next }
}

export async function whyPolicy(userId: string, level: number, sessionId?: string) {
  const res = await fetch("http://localhost:5000/api/policy/why", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ userId, level, sessionId })
  });
  return await res.json(); // { summary:{...}, causes:{...} }
}

// --- Leaderboard APIs ---

export async function getLeaderboard(type: 'individual' | 'team', period: 'alltime' | 'weekly' | 'monthly', limit = 10) {
  const res = await fetch(`http://localhost:5000/api/leaderboard/${type}/${period}?limit=${limit}`);
  return await res.json();
}

export async function getUserStats(userId: string) {
  const res = await fetch(`http://localhost:5000/api/leaderboard/user/${userId}/stats`);
  return await res.json();
}

export async function getTeamStats(teamId: string) {
  const res = await fetch(`http://localhost:5000/api/leaderboard/team/${teamId}/stats`);
  return await res.json();
}

export async function getUserBadges(userId: string) {
  const res = await fetch(`http://localhost:5000/api/leaderboard/badges/${userId}`);
  return await res.json();
} 