// ===================================================
// 🌐 JUNOSIXTEEN API SERVICE - MOBILE
// Vollständiger API-Service für React Native App mit Minigame-Integration
// ===================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = null;
    this.init();
  }

  async init() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  // ===================================================
  // 🔧 HELPER METHODS
  // ===================================================

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async setAuthToken(token) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearAuthToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  // ===================================================
  // 🔐 AUTHENTICATION
  // ===================================================

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    
    if (response.token) {
      await this.setAuthToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
    
    if (response.token) {
      await this.setAuthToken(response.token);
    }
    
    return response;
  }

  async logout() {
    await this.clearAuthToken();
    return { success: true };
  }

  async getUserProfile() {
    return await this.request('/auth/profile');
  }

  // ===================================================
  // 🎮 GAME MANAGEMENT
  // ===================================================

  async startGame(gameData) {
    return await this.request('/gamification/start-game', {
      method: 'POST',
      body: gameData
    });
  }

  async submitAnswer(gameId, answerData) {
    return await this.request('/gamification/submit-answer', {
      method: 'POST',
      body: {
        gameId,
        ...answerData
      }
    });
  }

  async completeLevel(levelData) {
    return await this.request('/gamification/level-complete', {
      method: 'POST',
      body: levelData
    });
  }

  async getGameStats() {
    return await this.request('/gamification/stats');
  }

  // ===================================================
  // 🎮 MINIGAMES API
  // ===================================================

  async startMinigame(minigameData) {
    return await this.request('/gamification/minigame/start', {
      method: 'POST',
      body: minigameData
    });
  }

  async completeMinigame(completionData) {
    return await this.request('/gamification/minigame/complete', {
      method: 'POST',
      body: completionData
    });
  }

  async getMinigameLeaderboard(gameId, options = {}) {
    const params = new URLSearchParams(options).toString();
    const endpoint = `/gamification/minigame/leaderboard/${gameId}${params ? `?${params}` : ''}`;
    return await this.request(endpoint);
  }

  async getMinigameStats() {
    return await this.request('/gamification/minigame/stats');
  }

  // ===================================================
  // 📚 MODULES & CONTENT
  // ===================================================

  async getModules(language = 'de') {
    return await this.request(`/modules?language=${language}`);
  }

  async getModule(moduleId, language = 'de') {
    return await this.request(`/modules/${moduleId}?language=${language}`);
  }

  async completeModule(moduleId, completionData) {
    return await this.request(`/modules/${moduleId}/complete`, {
      method: 'POST',
      body: completionData
    });
  }

  // ===================================================
  // 🧠 AI INTEGRATION (UL/MCP)
  // ===================================================

  async analyzeUserBehavior(behaviorData) {
    return await this.request('/ul/cluster-analyze', {
      method: 'POST',
      body: behaviorData
    });
  }

  async getLearningPattern() {
    return await this.request('/ul/learning-pattern');
  }

  async generateAdaptiveQuestion(questionParams) {
    return await this.request('/mcp/generate-question', {
      method: 'POST',
      body: questionParams
    });
  }

  async getMCPStats(timeframe = '7d') {
    return await this.request(`/mcp/stats?timeframe=${timeframe}`);
  }

  // ===================================================
  // 📊 PROGRESS & STATISTICS
  // ===================================================

  async getProgress() {
    return await this.request('/progress');
  }

  async updateProgress(progressData) {
    return await this.request('/progress/update', {
      method: 'POST',
      body: progressData
    });
  }

  async getCertificate(moduleId) {
    return await this.request(`/progress/certificate/${moduleId}`);
  }

  async getHighscores(type = 'global', filter = null) {
    const params = new URLSearchParams({ type });
    if (filter) params.append('filter', filter);
    return await this.request(`/gamification/highscores?${params.toString()}`);
  }

  // ===================================================
  // 🍿 IMPRINT-FEATURES (WISSENSSNACKS, etc.)
  // ===================================================

  async getWissenssnacks() {
    return await this.request('/wissenssnacks');
  }

  async completeWissenssnack(snackId, completionData) {
    return await this.request(`/wissenssnacks/${snackId}/complete`, {
      method: 'POST',
      body: completionData
    });
  }

  async getFreiwilligePfade() {
    return await this.request('/freiwillige-pfade');
  }

  async startFreiwilligerPfad(pfadId) {
    return await this.request(`/freiwillige-pfade/${pfadId}/start`, {
      method: 'POST'
    });
  }

  async getWissensimpuls() {
    return await this.request('/wissensimpuls');
  }

  // ===================================================
  // 🎯 BEREICHE & QUIZ
  // ===================================================

  async getBereiche() {
    return await this.request('/bereiche');
  }

  async startBereichQuiz(bereich, level) {
    return await this.request('/bereiche/start-quiz', {
      method: 'POST',
      body: { bereich, level }
    });
  }

  async submitQuizAnswer(quizId, answerData) {
    return await this.request('/bereiche/submit-answer', {
      method: 'POST',
      body: { quizId, ...answerData }
    });
  }

  // ===================================================
  // ⏰ DEADLINES & ADMIN
  // ===================================================

  async checkDeadlines() {
    return await this.request('/deadlines/check');
  }

  async requestExtension(reason) {
    return await this.request('/deadlines/request-extension', {
      method: 'POST',
      body: { reason }
    });
  }

  async getAuditTrail() {
    return await this.request('/audit/trail');
  }

  // ===================================================
  // 📱 OFFLINE SUPPORT
  // ===================================================

  async syncOfflineData(offlineData) {
    return await this.request('/sync/offline-data', {
      method: 'POST',
      body: offlineData
    });
  }

  async getOfflineContent() {
    return await this.request('/sync/offline-content');
  }

  // ===================================================
  // 🛠️ DEMO & TESTING
  // ===================================================

  async getDemoData() {
    // Für Demo-Zwecke: Lokale Mock-Daten
    return {
      user: {
        id: 'demo_user',
        username: 'Demo User',
        level: 3,
        totalPoints: 1250,
        currentPoints: 850,
        cluster: 'Typ_A',
        badges: ['first_login', 'quiz_master']
      },
      availableMinigames: [
        {
          id: 'memory_cards',
          name: '🧠 Memory Karten',
          description: 'Finde alle Paare!',
          estimated_reward: 240
        },
        {
          id: 'word_scramble',
          name: '🔤 Wörter-Puzzle',
          description: 'Buchstaben sortieren!',
          estimated_reward: 220
        }
      ]
    };
  }

  // ===================================================
  // 🌐 NETWORK STATUS
  // ===================================================

  async ping() {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  isOnline() {
    // In einer echten App würde hier NetInfo verwendet
    return true;
  }
}

// ===================================================
// 🚀 SINGLETON EXPORT
// ===================================================

const apiService = new ApiService();
export default apiService; 