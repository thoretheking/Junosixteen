class ApiService {
  private baseURL = 'http://10.0.2.2:3000/api'; // Emulator-Kompatibilität
  private authToken: string | null = null;

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(idToken: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  async register(userData: {
    email: string;
    displayName: string;
    language: string;
    avatar: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getAvatars() {
    return this.request('/auth/avatars');
  }

  async getLanguages() {
    return this.request('/auth/languages');
  }

  // Modules endpoints
  async getModules(language = 'de') {
    return this.request(`/modules?language=${language}`);
  }

  async getModule(moduleId: number, language = 'de') {
    return this.request(`/modules/${moduleId}?language=${language}`);
  }

  async completeModule(moduleId: number, data: {
    score: number;
    timeSpent: number;
    correctAnswers: number;
    totalQuestions: number;
  }) {
    return this.request(`/modules/${moduleId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Gamification endpoints
  async submitAnswer(data: {
    questionId: string;
    answer: number;
    timeSpent: number;
    isCorrect: boolean;
  }) {
    return this.request('/gamification/answer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGameStats() {
    return this.request('/gamification/stats');
  }

  async getLeaderboard(type = 'totalPoints', limit = 10) {
    return this.request(`/gamification/leaderboard?type=${type}&limit=${limit}`);
  }

  async startRiskLevel(level: number) {
    return this.request(`/gamification/risk-level/${level}`, {
      method: 'POST',
    });
  }

  // Progress endpoints
  async getProgress() {
    return this.request('/progress');
  }

  async getProgressStats(timeframe = '30d') {
    return this.request(`/progress/stats?timeframe=${timeframe}`);
  }

  async generateCertificate(language = 'de') {
    return this.request('/progress/certificate', {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
  }

  // UL (Unsupervised Learning)
  async analyzeUserBehavior(data: {
    avgTime: number;
    errors: number;
    clicks: number;
    moduleId?: number;
  }) {
    return this.request('/ul/cluster-analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLearningPattern() {
    return this.request('/ul/learning-pattern');
  }

  // MCP (Adaptive AI)
  async generateQuestion(data: {
    moduleId: number;
    level: number;
    language?: string;
    cluster?: string;
    difficulty?: string;
    isRiskQuestion?: boolean;
  }) {
    return this.request('/mcp/generate-question', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rateQuestion(questionId: string, rating: number, feedback?: string) {
    return this.request('/mcp/rate-question', {
      method: 'POST',
      body: JSON.stringify({ questionId, rating, feedback }),
    });
  }
}

export default new ApiService();
