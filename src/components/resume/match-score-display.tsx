'use client';

import { X, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchScore {
  overall: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    keywords: number;
    overallFit: number;
  };
  improvements: string[];
}

interface MatchScoreDisplayProps {
  score: MatchScore;
  onClose: () => void;
}

function ScoreRing({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 75) return '#16a34a'; // green
    if (score >= 50) return '#d4a017'; // gold
    if (score >= 30) return '#ea580c'; // orange
    return '#dc2626'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color: getColor(value) }}>
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const getColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-[#d4a017]';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#a0a0a0] font-medium">{label}</span>
        <span className="text-[#888]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function TrendIcon({ current }: { current: number }) {
  if (current >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (current >= 40) return <Minus className="h-4 w-4 text-[#d4a017]" />;
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

export function MatchScoreDisplay({ score, onClose }: MatchScoreDisplayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#141414] rounded-2xl shadow-2xl shadow-black/50 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#2a2a2a]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a0a] to-[#141414] text-[#fafafa] px-6 py-4 flex items-center justify-between border-b border-[#d4a017]/30">
          <div>
            <h3 className="font-bold text-lg text-[#d4a017]">Resume Match Score</h3>
            <p className="text-sm text-[#a0a0a0]">How well your resume matches the job</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#a0a0a0] hover:text-[#fafafa] hover:bg-[#2a2a2a] h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Overall Score */}
        <div className="px-6 py-6 flex items-center gap-6 border-b border-[#2a2a2a]">
          <ScoreRing value={score.overall} size={100} strokeWidth={8} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendIcon current={score.overall} />
              <span className="font-bold text-xl text-[#fafafa]">
                {score.overall >= 75 ? 'Great Match!' : score.overall >= 50 ? 'Good Potential' : score.overall >= 30 ? 'Needs Work' : 'Low Match'}
              </span>
            </div>
            <p className="text-sm text-[#a0a0a0]">
              {score.overall >= 75
                ? 'Your resume aligns well with this role.'
                : score.overall >= 50
                  ? 'Your resume has relevant experience but could be improved.'
                  : 'Significant changes needed to match this role well.'}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="px-6 py-4 space-y-3 border-b border-[#2a2a2a]">
          <h4 className="text-sm font-semibold text-[#d4a017]">Score Breakdown</h4>
          <ScoreBar label="Skills Match" value={score.breakdown.skills} />
          <ScoreBar label="Experience Relevance" value={score.breakdown.experience} />
          <ScoreBar label="Education Fit" value={score.breakdown.education} />
          <ScoreBar label="Keyword Alignment" value={score.breakdown.keywords} />
          <ScoreBar label="Overall Fit" value={score.breakdown.overallFit} />
        </div>

        {/* Improvements */}
        {score.improvements && score.improvements.length > 0 && (
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-[#d4a017] flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-4 w-4 text-[#d4a017]" />
              Key Improvements Made
            </h4>
            <ul className="space-y-1.5">
              {score.improvements.map((improvement, i) => (
                <li key={i} className="text-xs text-[#a0a0a0] flex gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#2a2a2a]">
          <Button onClick={onClose} className="w-full bg-[#d4a017] hover:bg-[#b8860b] text-[#0a0a0a] font-semibold" size="sm">
            View Tailored Resume
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { MatchScore };
