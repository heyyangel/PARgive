import { adminGetAnalytics } from '@/actions/admin'

function StatCard({ label, value, sub, accent = 'violet' }: {
  label:  string
  value:  string | number
  sub?:   string
  accent?: 'violet' | 'emerald' | 'sky' | 'amber'
}) {
  const colors = {
    violet:  'bg-violet-500/8 border-violet-500/15',
    emerald: 'bg-emerald-500/8 border-emerald-500/15',
    sky:     'bg-sky-500/8 border-sky-500/15',
    amber:   'bg-amber-500/8 border-amber-500/15',
  }
  return (
    <div className={`p-5 rounded-2xl border ${colors[accent]}`}>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboard() {
  const stats = await adminGetAnalytics()

  if (!stats) {
    return <p className="text-red-400">Failed to load analytics.</p>
  }

  const totalPool = stats.thisMonthPool + stats.jackpotCarry

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Platform overview — live data</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscribers"
          value={stats.activeSubscribers}
          sub={`of ${stats.totalUsers} total users`}
          accent="emerald"
        />
        <StatCard
          label="This Month's Prize Pool"
          value={`£${totalPool.toFixed(2)}`}
          sub={stats.jackpotCarry > 0 ? `inc. £${stats.jackpotCarry.toFixed(2)} jackpot carry` : 'No carry-in'}
          accent="violet"
        />
        <StatCard
          label="Participation Rate"
          value={`${stats.participationRate}%`}
          sub="subscribers entered this month"
          accent="sky"
        />
        <StatCard
          label="Total Draws Run"
          value={stats.totalDraws}
          sub={`${stats.totalEntries} total entries`}
          accent="amber"
        />
      </div>

      {/* Recent draws table */}
      <div>
        <h2 className="text-sm font-semibold text-white/70 mb-4">Recent Draws</h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                {['Month', 'Year', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.draws.map((draw: any) => {
                const monthName = new Date(draw.year, draw.month - 1).toLocaleDateString('en-GB', { month: 'long' })
                const statusColor =
                  draw.status === 'published' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' :
                  draw.status === 'closed'    ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' :
                  'text-white/40 bg-white/5 border-white/10'
                return (
                  <tr key={draw.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">{monthName}</td>
                    <td className="px-4 py-3 text-white/60">{draw.year}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${statusColor}`}>
                        {draw.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {stats.draws.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">No draws yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
