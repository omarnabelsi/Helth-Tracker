export default function MacroBar({ label, current, target, color = '#3B82F6', unit = 'g' }) {
  const percentage = Math.min((current / target) * 100, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        <span className="text-xs text-text-muted">
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
            animation: 'progressBar 1.2s ease-out',
          }}
        />
      </div>
    </div>
  )
}
