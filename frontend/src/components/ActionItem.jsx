import React from 'react';
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, HelpCircle, Lightbulb } from 'lucide-react';

/**
 * ActionItem - Interactive B2B card displaying AI action suggestions.
 * 
 * @param {Object} props
 * @param {Object} props.item - Action item data (id, title, description, impact, category, actioned)
 * @param {Function} props.onToggle - Callback when the done state is toggled
 */
export const ActionItem = ({ item, onToggle }) => {
  if (!item) return null;

  const { id, title, description, impact = 'Medium', category = 'Genel', actioned = false } = item;

  // Impact level styles
  const getImpactStyle = (level) => {
    switch (level.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-cyber-danger/10',
          border: 'border-cyber-danger/30',
          text: 'text-cyber-danger',
          label: 'Yüksek Etki'
        };
      case 'medium':
        return {
          bg: 'bg-cyber-warning/10',
          border: 'border-cyber-warning/30',
          text: 'text-cyber-warning',
          label: 'Orta Etki'
        };
      case 'low':
        return {
          bg: 'bg-cyber-accent/10',
          border: 'border-cyber-accent/30',
          text: 'text-cyber-accent',
          label: 'Düşük Etki'
        };
      default:
        return {
          bg: 'bg-slate-800',
          border: 'border-slate-700',
          text: 'text-slate-400',
          label: 'Normal Etki'
        };
    }
  };

  const style = getImpactStyle(impact);

  return (
    <div 
      className={`glass-panel rounded-xl p-5 border transition-all duration-500 relative overflow-hidden ${
        actioned 
          ? 'opacity-60 border-slate-800/40 bg-slate-950/20' 
          : 'hover:border-cyber-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyber-primary/5'
      }`}
    >
      {/* Glow highlight for high impact pending actions */}
      {!actioned && impact.toLowerCase() === 'high' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-cyber-danger" />
      )}
      {!actioned && impact.toLowerCase() === 'medium' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-cyber-warning" />
      )}
      {!actioned && impact.toLowerCase() === 'low' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-cyber-accent" />
      )}

      <div className="flex items-start gap-4">
        {/* Toggle Checkbox Button */}
        <button 
          onClick={() => onToggle && onToggle(id, !actioned)}
          className="mt-1 focus:outline-none group text-slate-500 hover:text-cyber-accent transition-colors duration-300"
          title={actioned ? "Aktif Et" : "Tamamlandı Olarak İşaretle"}
        >
          {actioned ? (
            <CheckCircle2 className="w-5 h-5 text-cyber-success fill-cyber-success/10" />
          ) : (
            <Circle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 stroke-slate-500 group-hover:stroke-cyber-accent" />
          )}
        </button>

        {/* Content Area */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`text-sm font-semibold transition-all duration-300 ${actioned ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {title}
            </h4>
            <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
              {style.label}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyber-muted border border-slate-800">
              {category}
            </span>
          </div>

          <p className={`text-xs leading-relaxed transition-colors duration-300 ${actioned ? 'text-slate-500' : 'text-slate-400'}`}>
            {description}
          </p>

          {!actioned && (
            <div className="flex items-center gap-1.5 pt-1.5 text-[10px] text-cyber-accent font-medium">
              <Lightbulb size={12} className="stroke-[2.5]" />
              <span>Yapay zeka bu aksiyonun sentiment skorunuzu +3-5 puan artıracağını tahmin ediyor.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionItem;
