import { useState, useMemo } from 'react'
import { BarChart3, ArrowLeftRight, XCircle, LayoutDashboard, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import data from './data.json'

const CATEGORY_COLORS = {
  client_payments: '#22c55e',
  material_expenses: '#ef4444',
  contractor_labor: '#f97316',
  shop_overhead: '#eab308',
  office_overhead: '#3b82f6',
  insurance: '#8b5cf6',
  gas_travel: '#06b6d4',
  dining_meals: '#ec4899',
  owner_compensation: '#a855f7',
  not_business: '#6b7280',
  transfer: '#9ca3af',
}

const fmt = (n) => {
  const abs = Math.abs(n)
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-$${s}` : `$${s}`
}

const TABS = [
  { id: 'summary', label: 'Summary', icon: LayoutDashboard },
  { id: 'categories', label: 'Categories', icon: BarChart3 },
  { id: 'excluded', label: 'Excluded', icon: XCircle },
  { id: 'transfers', label: 'Transfer Pairs', icon: ArrowLeftRight },
]

function App() {
  const [activeTab, setActiveTab] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [expandedPairs, setExpandedPairs] = useState(new Set())

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Review Dashboard</h1>
              <p className="text-sm text-gray-500">{data.year} Tax Year &middot; {data.totalTransactions.toLocaleString()} transactions</p>
            </div>
            <nav className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); setSearchTerm(''); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'summary' && <SummaryView />}
        {activeTab === 'categories' && (
          <CategoryView
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
        {activeTab === 'excluded' && (
          <ExcludedView searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        )}
        {activeTab === 'transfers' && (
          <TransferView expandedPairs={expandedPairs} setExpandedPairs={setExpandedPairs} />
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SummaryView() {
  const bizCats = data.categories.filter(c => c.isBusiness)
  const income = bizCats.filter(c => c.total > 0).reduce((s, c) => s + c.total, 0)
  const expenses = bizCats.filter(c => c.total < 0).reduce((s, c) => s + c.total, 0)
  const net = income + expenses

  const chartData = bizCats
    .filter(c => c.key !== 'client_payments')
    .map(c => ({ name: c.name.replace(/ \(Overhead\)/, '').replace('Expenses', 'Exp.'), value: Math.abs(c.total), key: c.key }))
    .sort((a, b) => b.value - a.value)

  const pieData = bizCats
    .filter(c => c.total < 0)
    .map(c => ({ name: c.name.replace(/ \(Overhead\)/, ''), value: Math.abs(c.total), key: c.key }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Client Payments" value={fmt(income)} sub={`${bizCats.find(c => c.key === 'client_payments')?.count || 0} transactions`} color="text-green-600" />
        <StatCard label="Total Expenses" value={fmt(expenses)} sub={`${bizCats.filter(c => c.total < 0).reduce((s,c) => s + c.count, 0)} transactions`} color="text-red-600" />
        <StatCard label="Net P+L" value={fmt(net)} color={net >= 0 ? 'text-green-600' : 'text-red-600'} />
        <StatCard label="Total Transactions" value={data.totalTransactions.toLocaleString()} sub={`${data.transferPairs.length} transfer pairs matched`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Summary</h3>
          <p className="text-sm text-gray-500 mb-4">EHAS account balances</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-medium text-gray-500">Account</th>
                <th className="text-right py-2 font-medium text-gray-500">1/1/2025</th>
                <th className="text-right py-2 font-medium text-gray-500">12/31/2025</th>
                <th className="text-right py-2 font-medium text-gray-500">Change</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.balances).map(([label, vals]) => (
                <tr key={label} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{label}</td>
                  <td className="text-right text-gray-600">{fmt(vals.opening)}</td>
                  <td className="text-right text-gray-600">{fmt(vals.closing)}</td>
                  <td className={`text-right font-medium ${vals.closing - vals.opening >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(vals.closing - vals.opening)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Expense Breakdown</h3>
          <p className="text-sm text-gray-500 mb-4">By tax category</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={11}>
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Expense Categories</h3>
        <p className="text-sm text-gray-500 mb-4">Business expenses by category</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 140 }}>
            <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">EHAS Accts Summary</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">Category</th>
              <th className="text-right py-2 font-semibold text-gray-700">Transactions</th>
              <th className="text-right py-2 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {bizCats.sort((a, b) => a.total - b.total).map(c => (
              <tr key={c.key} className="border-b border-gray-50">
                <td className="py-2.5 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: CATEGORY_COLORS[c.key] }} />
                  <span className="font-medium text-gray-900">{c.name}</span>
                </td>
                <td className="text-right text-gray-500">{c.count}</td>
                <td className={`text-right font-semibold ${c.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.key === 'client_payments' ? fmt(c.total) : fmt(Math.abs(c.total))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td className="py-3 font-bold text-gray-900">Net P+L</td>
              <td></td>
              <td className={`text-right font-bold text-lg ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function TransactionTable({ transactions, showCategory = true }) {
  if (transactions.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No transactions found.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Description</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Account</th>
            {showCategory && <th className="text-left py-2 px-3 font-medium text-gray-500">Category</th>}
            <th className="text-left py-2 px-3 font-medium text-gray-500">Memo</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
              <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{String(t.date).slice(0, 10)}</td>
              <td className={`py-2 px-3 text-right font-mono font-medium whitespace-nowrap ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(t.amount)}
              </td>
              <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={t.description}>{t.description}</td>
              <td className="py-2 px-3 text-gray-500 whitespace-nowrap text-xs">{t.account}</td>
              {showCategory && (
                <td className="py-2 px-3">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS[t.tax_category]}20`, color: CATEGORY_COLORS[t.tax_category] }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[t.tax_category] }} />
                    {t.tax_category}
                  </span>
                </td>
              )}
              <td className="py-2 px-3 text-gray-400 text-xs max-w-[200px] truncate" title={t.memo || t.venmo_note || ''}>{t.memo || t.venmo_note || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoryView({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }) {
  const [showAll, setShowAll] = useState(false)
  const bizCats = data.categories.filter(c => c.isBusiness).sort((a, b) => a.total - b.total)

  const filteredTxns = useMemo(() => {
    let txns = data.transactions.filter(t => {
      if (selectedCategory) return t.tax_category === selectedCategory
      return data.categories.find(c => c.key === t.tax_category)?.isBusiness
    })
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      txns = txns.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.memo || '').toLowerCase().includes(q) ||
        (t.counterparty || '').toLowerCase().includes(q) ||
        (t.venmo_note || '').toLowerCase().includes(q) ||
        (t.account || '').toLowerCase().includes(q)
      )
    }
    return txns.sort((a, b) => a.date < b.date ? -1 : 1)
  }, [selectedCategory, searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            !selectedCategory ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Business ({bizCats.reduce((s, c) => s + c.count, 0)})
        </button>
        {bizCats.map(c => (
          <button
            key={c.key}
            onClick={() => setSelectedCategory(c.key === selectedCategory ? null : c.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === c.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={selectedCategory === c.key ? { backgroundColor: CATEGORY_COLORS[c.key] } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.key] }} />
            {c.name} ({c.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          <span className="text-xs text-gray-400">{filteredTxns.length} transactions</span>
        </div>
        <TransactionTable transactions={showAll ? filteredTxns : filteredTxns.slice(0, 100)} />
        {filteredTxns.length > 100 && (
          <div className="text-center py-3 border-t border-gray-100">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              {showAll ? `Show less` : `Show all ${filteredTxns.length} transactions`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ExcludedView({ searchTerm, setSearchTerm }) {
  const [showType, setShowType] = useState('not_business')
  const [showAll, setShowAll] = useState(false)

  const filteredTxns = useMemo(() => {
    let txns = data.transactions.filter(t => t.tax_category === showType)
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      txns = txns.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.memo || '').toLowerCase().includes(q) ||
        (t.counterparty || '').toLowerCase().includes(q) ||
        (t.account || '').toLowerCase().includes(q)
      )
    }
    return txns.sort((a, b) => a.date < b.date ? -1 : 1)
  }, [showType, searchTerm])

  const notBizCount = data.categories.find(c => c.key === 'not_business')?.count || 0
  const xferCount = data.categories.find(c => c.key === 'transfer')?.count || 0

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowType('not_business')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            showType === 'not_business' ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Not Business ({notBizCount})
        </button>
        <button
          onClick={() => setShowType('transfer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            showType === 'transfer' ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Transfers ({xferCount})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${showType === 'not_business' ? 'personal' : 'transfer'} transactions...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          <span className="text-xs text-gray-400">{filteredTxns.length} transactions</span>
        </div>
        <TransactionTable transactions={showAll ? filteredTxns : filteredTxns.slice(0, 100)} showCategory={false} />
        {filteredTxns.length > 100 && (
          <div className="text-center py-3 border-t border-gray-100">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              {showAll ? `Show less` : `Show all ${filteredTxns.length} transactions`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
function TransferView({ expandedPairs, setExpandedPairs }) {
  const togglePair = (id) => {
    setExpandedPairs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const unpaired = useMemo(() =>
    data.transactions.filter(t =>
      t.is_transfer === true &&
      (!t.transfer_pair_id || t.transfer_pair_id === '')
    ).sort((a, b) => a.date < b.date ? -1 : 1),
    []
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Matched Transfer Pairs</h3>
        <p className="text-sm text-gray-500 mb-4">{data.transferPairs.length} pairs &mdash; debit from one account matched to credit in another</p>

        <div className="space-y-2">
          {[...data.transferPairs].sort((a, b) => a.debit.date < b.debit.date ? -1 : 1).map(pair => {
            const isExpanded = expandedPairs.has(pair.id)
            return (
              <div key={pair.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePair(pair.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 text-xs w-20">{pair.debit.date}</span>
                    <span className="font-mono text-xs text-gray-400 w-16">{pair.id}</span>
                    <span className="text-red-600 font-medium">{fmt(pair.debit.amount)}</span>
                    <span className="text-gray-300">&harr;</span>
                    <span className="text-green-600 font-medium">{fmt(pair.credit.amount)}</span>
                    <span className="text-gray-400 text-xs">{pair.debit.account} &rarr; {pair.credit.account}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-3 grid grid-cols-2 gap-4 bg-gray-50 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-red-600">Debit Side</p>
                      <p><span className="text-gray-500">Date:</span> {pair.debit.date}</p>
                      <p><span className="text-gray-500">Account:</span> {pair.debit.account}</p>
                      <p><span className="text-gray-500">Amount:</span> {fmt(pair.debit.amount)}</p>
                      <p className="text-gray-600">{pair.debit.description}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-green-600">Credit Side</p>
                      <p><span className="text-gray-500">Date:</span> {pair.credit.date}</p>
                      <p><span className="text-gray-500">Account:</span> {pair.credit.account}</p>
                      <p><span className="text-gray-500">Amount:</span> {fmt(pair.credit.amount)}</p>
                      <p className="text-gray-600">{pair.credit.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Unpaired Transfers</h3>
        <p className="text-sm text-gray-500 mb-4">{unpaired.length} transfers without a matching counterpart (Venmo funding, Betterment, external A2A, etc.)</p>
        <TransactionTable transactions={unpaired} showCategory={false} />
      </div>
    </div>
  )
}

export default App
