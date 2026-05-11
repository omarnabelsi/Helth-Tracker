import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Crown, TrendingUp, DollarSign, Utensils, Dumbbell, UserPlus, Activity, Search, RefreshCw, ChevronUp, ChevronDown, Trash2, ArrowUpDown } from 'lucide-react'

const Admin = () => {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      // Fetch stats via view
      const { data: statsData, error: statsErr } = await supabase
        .from('admin_stats').select('*').maybeSingle()
      if (statsErr) console.warn('Stats error:', statsErr.message)

      // Fetch all profiles joined with subscriptions
      // Supabase FK join returns subscriptions as array — normalize it
      const { data: usersData, error: usersErr } = await supabase
        .from('profiles')
        .select(`
          user_id, name, goal, created_at, is_admin,
          subscriptions ( plan, status, started_at, expires_at )
        `)
        .order('created_at', { ascending: false })

      if (usersErr) {
        console.error('Users fetch error:', usersErr.message, usersErr.details)
      }

      // Normalize: Supabase returns subscriptions as array from FK join
      const normalized = (usersData || []).map(u => ({
        ...u,
        subscriptions: Array.isArray(u.subscriptions)
          ? u.subscriptions[0] || null
          : u.subscriptions
      }))

      setStats(statsData)
      setUsers(normalized)
    } catch (e) {
      console.error('Admin fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const upgradeUser = async (userId) => {
    setActionLoading(userId + '_up')
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan: 'premium',
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    }, { onConflict: 'user_id' })
    setActionLoading(null)
    fetchAll()
  }

  const downgradeUser = async (userId) => {
    setActionLoading(userId + '_down')
    await supabase.from('subscriptions')
      .update({ plan: 'free', status: 'active', expires_at: null })
      .eq('user_id', userId)
    setActionLoading(null)
    fetchAll()
  }

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setActionLoading(userId + '_del')
    await supabase.from('profiles').delete().eq('user_id', userId)
    setActionLoading(null)
    fetchAll()
  }

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(searchLower);
    const idMatch = (u.user_id || '').includes(search);
    return nameMatch || idMatch;
  })

  const premiumCount = users.filter(u => u.subscriptions?.plan === 'premium').length
  const revenue = (premiumCount * 9.99).toFixed(2)
  const conversionRate = users.length > 0 ? ((premiumCount / users.length) * 100).toFixed(1) : '0.0'

  const statCards = [
    { label: 'Total Users',     value: stats?.total_users || users.length,        icon: Users,    color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { label: 'Premium Users',   value: stats?.premium_users || premiumCount,       icon: Crown,    color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Free Users',      value: stats?.free_users || (users.length - premiumCount), icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Monthly Revenue', value: `$${revenue}`,                              icon: DollarSign, color: 'text-green-400',  bg: 'bg-green-400/10' },
    { label: 'Meals This Week', value: stats?.meals_logged_week || '—',            icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Workouts/Week',   value: stats?.workouts_week || '—',                icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'New Users/Week',  value: stats?.new_users_week || '—',               icon: UserPlus, color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
    { label: 'Conversion Rate', value: `${conversionRate}%`,                       icon: TrendingUp, color: 'text-pink-400',   bg: 'bg-pink-400/10' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-bg-main">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-primary-accent/30 border-t-primary-accent rounded-full animate-spin mx-auto" />
        <p className="text-text-muted text-sm font-medium">Loading admin dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg-main p-6 overflow-y-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-text-primary flex items-center gap-2">
            <span className="text-2xl">🛡️</span> Admin Dashboard
          </h1>
          <p className="text-text-muted text-sm mt-1">VitalSense AI — Control Panel</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 bg-bg-card border border-border-color text-primary-accent rounded-xl px-4 py-2 text-sm font-semibold hover:bg-bg-card/80 transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        {statCards.map((s, i) => (
          <div key={i} className="bg-bg-card border border-border-color rounded-2xl p-4 space-y-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-text-muted text-xs mt-0.5 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 animate-fade-in">
        {['overview', 'users', 'subscriptions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              tab === t
                ? 'bg-primary-accent text-white border-transparent shadow-lg shadow-primary-accent/20'
                : 'bg-bg-card text-text-muted border-border-color hover:text-text-primary'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {(tab === 'users' || tab === 'subscriptions') && (
        <div className="bg-bg-card border border-border-color rounded-2xl overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-4 border-b border-border-color flex items-center gap-3">
            <Search size={16} className="text-text-muted flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users by name or ID..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/3">
                  {['User', 'Goal', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border-color"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const plan = u.subscriptions?.plan || 'free'
                  const isPrem = plan === 'premium'
                  return (
                    <tr
                      key={u.user_id}
                      className={`border-b border-border-color hover:bg-white/2 transition-colors ${i % 2 !== 0 ? 'bg-white/1' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{u.name || 'No name'}</div>
                            <div className="text-[10px] text-text-muted">{u.user_id?.slice(0, 14)}...</div>
                          </div>
                        </div>
                      </td>
                      {/* Goal */}
                      <td className="px-4 py-3.5 text-text-muted text-sm">{u.goal || '—'}</td>
                      {/* Plan badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          isPrem ? 'bg-yellow-400/15 text-yellow-400' : 'bg-white/5 text-text-muted'
                        }`}>
                          {isPrem ? '👑 Premium' : '🌱 Free'}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-400">
                          ● Active
                        </span>
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3.5 text-text-muted text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {!isPrem ? (
                            <button
                              onClick={() => upgradeUser(u.user_id)}
                              disabled={actionLoading === u.user_id + '_up'}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/25 transition-all disabled:opacity-50"
                            >
                              {actionLoading === u.user_id + '_up' ? '...' : '⬆ Upgrade'}
                            </button>
                          ) : (
                            <button
                              onClick={() => downgradeUser(u.user_id)}
                              disabled={actionLoading === u.user_id + '_down'}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-text-muted border border-border-color hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                              {actionLoading === u.user_id + '_down' ? '...' : '⬇ Downgrade'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(u.user_id, u.name)}
                            disabled={actionLoading === u.user_id + '_del'}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {actionLoading === u.user_id + '_del' ? '...' : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border-color text-text-muted text-xs">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Revenue card */}
          <div className="bg-bg-card border border-border-color rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
              <DollarSign size={16} className="text-green-400" />
              Revenue Overview
            </h3>
            <div className="text-4xl font-extrabold text-green-400">${revenue}</div>
            <p className="text-text-muted text-xs">Monthly recurring revenue</p>
            <div className="bg-white/3 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Premium users × $9.99</span>
                <span className="text-text-primary font-semibold">{premiumCount} users</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: users.length > 0 ? `${(premiumCount / users.length) * 100}%` : '0%' }}
                />
              </div>
              <div className="text-[10px] text-text-muted text-right">{conversionRate}% conversion</div>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-bg-card border border-border-color rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-bold text-text-primary text-base flex items-center gap-2">
              <UserPlus size={16} className="text-cyan-400" />
              Recent Users
            </h3>
            <div className="space-y-3">
              {users.slice(0, 5).map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{u.name || 'Unknown'}</div>
                    <div className="text-[10px] text-text-muted">{u.goal || 'No goal set'}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    u.subscriptions?.plan === 'premium'
                      ? 'bg-yellow-400/15 text-yellow-400'
                      : 'bg-white/5 text-text-muted'
                  }`}>
                    {u.subscriptions?.plan === 'premium' ? '👑 PRO' : 'FREE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Admin
