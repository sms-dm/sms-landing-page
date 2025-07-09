import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface QualityScoreDisplayProps {
  score: number;
  breakdown?: {
    category: string;
    score: number;
    maxScore: number;
  }[];
  issues?: string[];
  compact?: boolean;
}

export const QualityScoreDisplay: React.FC<QualityScoreDisplayProps> = ({
  score,
  breakdown,
  issues,
  compact = false,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const dashoffset = circumference - (score / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke={scoreColor}
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 - (score / 100) * 2 * Math.PI * 20}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{score}</span>
          </div>
        </div>
        <span className="text-sm font-medium" style={{ color: scoreColor }}>
          {getScoreLabel(score)}
        </span>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center">
        {/* Score Ring */}
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke={scoreColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{score}%</span>
            <span className="text-sm text-gray-600">Quality Score</span>
          </div>
        </div>

        <p className="text-lg font-medium mb-4" style={{ color: scoreColor }}>
          {getScoreLabel(score)}
        </p>

        {/* Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="w-full space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Score Breakdown</h4>
            {breakdown.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-medium">
                    {item.score}/{item.maxScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.score / item.maxScore) * 100}%`,
                      backgroundColor: getScoreColor((item.score / item.maxScore) * 100),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Issues */}
        {issues && issues.length > 0 && (
          <div className="w-full mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {issues.map((issue, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        <div className="w-full mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tips to improve your score:</p>
              <ul className="space-y-1 text-xs">
                <li>• Add photos for all equipment</li>
                <li>• Identify and mark critical parts</li>
                <li>• Complete all required fields</li>
                <li>• Upload relevant documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};