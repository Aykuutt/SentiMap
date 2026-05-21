import React from 'react';

/**
 * SentimentGauge - A premium glowing circular gauge representing positive sentiment ratio.
 * 
 * @param {Object} props
 * @param {number} props.value - Sentiment score from 0 to 100
 * @param {number} [props.size=120] - Width/height of the gauge in pixels
 * @param {number} [props.strokeWidth=10] - Stroke thickness of the gauge
 * @param {string} [props.label="Duygu Skoru"] - Optional sub-label
 */
export const SentimentGauge = ({ value = 0, size = 120, strokeWidth = 10, label = "Duygu Skoru" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Determine color theme based on score
  const getColorScheme = (score) => {
    if (score >= 75) {
      return {
        text: 'text-cyber-success',
        stroke: '#10b981',
        shadow: '0 0 15px rgba(16, 185, 129, 0.4)',
        bg: 'rgba(16, 185, 129, 0.1)',
        status: 'Çok İyi'
      };
    } else if (score >= 50) {
      return {
        text: 'text-cyber-warning',
        stroke: '#f59e0b',
        shadow: '0 0 15px rgba(245, 158, 11, 0.4)',
        bg: 'rgba(245, 158, 11, 0.1)',
        status: 'Orta'
      };
    } else {
      return {
        text: 'text-cyber-danger',
        stroke: '#f43f5e',
        shadow: '0 0 15px rgba(244, 63, 94, 0.4)',
        bg: 'rgba(244, 63, 94, 0.1)',
        status: 'Kritik'
      };
    }
  };

  const scheme = getColorScheme(value);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glowing Background Radial */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-700 ease-out"
          style={{ 
            boxShadow: scheme.shadow,
            background: scheme.bg,
            filter: 'blur(10px)',
            opacity: 0.15,
            zIndex: 0
          }}
        />

        {/* Circular Gauge */}
        <svg width={size} height={size} className="transform -rotate-90 relative z-10">
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Fill Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scheme.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 4px ${scheme.stroke})`
            }}
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className={`text-3xl font-extrabold tracking-tight ${scheme.text}`}>
            %{value}
          </span>
          <span className="text-[10px] text-cyber-muted font-medium uppercase tracking-widest mt-0.5">
            Pozitif
          </span>
        </div>
      </div>

      {label && (
        <div className="mt-3 text-center">
          <p className="text-xs text-cyber-muted font-medium">{label}</p>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded-full border bg-slate-900/60 transition-all duration-500`}
                style={{ 
                  color: scheme.stroke, 
                  borderColor: `${scheme.stroke}33`
                }}>
            {scheme.status}
          </span>
        </div>
      )}
    </div>
  );
};

export default SentimentGauge;
