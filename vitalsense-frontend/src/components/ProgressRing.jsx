export default function ProgressRing({ 
  value = 0, 
  max = 100, 
  size = 120, 
  strokeWidth = 10, 
  color = '#4CAF7D',
  bgColor = '#E8F5EE',
  label = '',
  sublabel = '',
  showValue = true,
  className = ''
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary font-heading">
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-[10px] text-text-muted font-medium mt-0.5">{label}</span>
          )}
        </div>
      )}
      {sublabel && (
        <span className="text-xs text-text-muted mt-2 font-medium">{sublabel}</span>
      )}
    </div>
  )
}
