import React, { useState, useEffect } from 'react';

interface PolicyExplanation {
  sessionId: string;
  explanation: {
    status: {
      current_status: string;
      primary_reason: string;
      details: string;
    } | null;
    risk_questions: Array<{
      question: number;
      part_a_correct: boolean;
      part_b_correct: boolean;
      status: string;
      impact: string;
    }>;
    team_question: {
      team_id: string;
      total_members: number;
      correct_members: number;
      success_rate: number;
      status: string;
      impact: string;
    } | null;
    points_breakdown: Array<{
      question: number;
      base_points: number;
      multiplier: number;
      final_points: number;
      reason: string;
    }>;
    recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      action_required: string;
    }>;
  };
  generated_at: string;
}

interface PolicyExplainabilityPanelProps {
  sessionId: string;
  onClose?: () => void;
}

export const PolicyExplainabilityPanel: React.FC<PolicyExplainabilityPanelProps> = ({
  sessionId,
  onClose
}) => {
  const [explanation, setExplanation] = useState<PolicyExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview');

  useEffect(() => {
    fetchExplanation();
  }, [sessionId]);

  const fetchExplanation = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/explain/decision/${sessionId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setExplanation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'RESET_RISK': return 'text-red-600 bg-red-100';
      case 'RESET_DEADLINE': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔍 Policy Explanation</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing policy decision...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔍 Policy Explanation</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button
            onClick={fetchExplanation}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-xl font-bold">🔍 Policy Explanation</h2>
          <p className="text-sm text-gray-600">Session: {sessionId}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Overview */}
      {explanation.explanation.status && (
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(explanation.explanation.status.current_status)}`}>
              {explanation.explanation.status.current_status}
            </div>
            <div>
              <p className="font-medium">{explanation.explanation.status.primary_reason}</p>
              <p className="text-sm text-gray-600">{explanation.explanation.status.details}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {['overview', 'details', 'recommendations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Risk Questions */}
            {explanation.explanation.risk_questions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">⚠️ Risk Questions</h3>
                <div className="space-y-2">
                  {explanation.explanation.risk_questions.map((risk, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Question {risk.question}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          risk.status === 'both_correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {risk.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Part A: {risk.part_a_correct ? '✅' : '❌'} | 
                        Part B: {risk.part_b_correct ? '✅' : '❌'} | 
                        Impact: {risk.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Question */}
            {explanation.explanation.team_question && (
              <div>
                <h3 className="text-lg font-medium mb-3">👥 Team Question</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Team {explanation.explanation.team_question.team_id}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      explanation.explanation.team_question.status === 'team_success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {explanation.explanation.team_question.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {explanation.explanation.team_question.correct_members} / {explanation.explanation.team_question.total_members} correct
                    ({Math.round(explanation.explanation.team_question.success_rate * 100)}%) | 
                    Impact: {explanation.explanation.team_question.impact}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Points Breakdown */}
            <div>
              <h3 className="text-lg font-medium mb-3">📊 Points Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Question</th>
                      <th className="px-4 py-2 text-left">Base Points</th>
                      <th className="px-4 py-2 text-left">Multiplier</th>
                      <th className="px-4 py-2 text-left">Final Points</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explanation.explanation.points_breakdown.map((point, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{point.question}</td>
                        <td className="px-4 py-2">{point.base_points}</td>
                        <td className="px-4 py-2">x{point.multiplier}</td>
                        <td className="px-4 py-2 font-medium">{point.final_points}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{point.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {explanation.explanation.recommendations.length > 0 ? (
              explanation.explanation.recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium capitalize">{rec.type.replace('_', ' ')}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{rec.message}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Action:</strong> {rec.action_required}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ✅ No recommendations - performance is satisfactory
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
        Generated at: {new Date(explanation.generated_at).toLocaleString()}
      </div>
    </div>
  );
}; 