import React from 'react';
import { Star, ThumbsUp, ThumbsDown, Sparkles, MessageSquare } from 'lucide-react';

/**
 * ReviewCard - Displays individual feedback or an AI-extracted pros/cons summary list.
 * 
 * @param {Object} props
 * @param {Object} props.sentimentData - Sentiment object containing pros, cons, and aiSummary
 * @param {string} props.businessName - Name of the business
 */
export const ReviewCard = ({ sentimentData, businessName }) => {
  if (!sentimentData) return null;

  const { pros = [], cons = [], aiSummary = "" } = sentimentData;

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-700/80">
      {/* Decorative corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-primary/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Header with AI indicator */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-200">
              Yapay Zeka Yorum Analizi
            </h3>
            <p className="text-[10px] text-cyber-muted">Canlı yorum verilerinden sentezlendi</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-slate-900 text-cyber-accent border border-cyber-accent/20">
          AI SUMMARY
        </span>
      </div>

      {/* AI Detailed Paragraph Summary */}
      {aiSummary && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-6">
          <p className="text-xs leading-relaxed text-slate-300 italic">
            "{aiSummary}"
          </p>
        </div>
      )}

      {/* Pros & Cons Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pros (Good points) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyber-success pb-1.5 border-b border-cyber-success/20">
            <ThumbsUp size={14} className="stroke-[2.5]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Öne Çıkan İyi Yönler</h4>
          </div>
          <ul className="space-y-2">
            {pros.map((pro, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-cyber-success/5 border border-cyber-success/10 hover:bg-cyber-success/10 transition-all duration-300"
              >
                <span className="text-cyber-success font-extrabold mt-0.5">✓</span>
                <span>{pro}</span>
              </li>
            ))}
            {pros.length === 0 && (
              <p className="text-xs text-cyber-muted italic">Yeterli veri yok.</p>
            )}
          </ul>
        </div>

        {/* Cons (Bad points) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyber-danger pb-1.5 border-b border-cyber-danger/20">
            <ThumbsDown size={14} className="stroke-[2.5]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Eleştirilen Yönler</h4>
          </div>
          <ul className="space-y-2">
            {cons.map((con, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-cyber-danger/5 border border-cyber-danger/10 hover:bg-cyber-danger/10 transition-all duration-300"
              >
                <span className="text-cyber-danger font-extrabold mt-0.5">✗</span>
                <span>{con}</span>
              </li>
            ))}
            {cons.length === 0 && (
              <p className="text-xs text-cyber-muted italic">Yeterli veri yok.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
