export default function StatCard({ icon, label, value, subtitle, trend, color = 'green' }) {
  const colorMap = {
    green: { bg: 'bg-primary-pale', text: 'text-primary-accent', ring: 'ring-primary-accent/20' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-200' },
    red: { bg: 'bg-red-50', text: 'text-red-500', ring: 'ring-red-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-200' },
  }
  const c = colorMap[color] || colorMap.green

  return (
    <div className="bg-bg-card rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-accent/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ring-2 ${c.ring} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary font-heading">{value}</p>
      <p className="text-sm text-text-muted mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-text-light mt-1">{subtitle}</p>}
    </div>
  )
}
