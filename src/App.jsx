import React, { useState, useMemo, useCallback, useEffect, createContext, useContext } from 'react'
import { BarChart3, ArrowLeftRight, XCircle, LayoutDashboard, Search, ChevronDown, ChevronUp, Info, Github, Mail, ClipboardList, Calendar, Download, Save, RotateCcw, FileText, Filter, Plus, Flag, MessageSquare, Send, Undo2, History, X, User, LogOut, Sparkles, Share2, Link2, ExternalLink, Heart, Eye, Play, ChevronRight, Copy, Check } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import data from './data.json'

// ── Identity (non-blocking) ─────────────────────────────────────────────────
const IDENTITY_KEY = 'demo_reviewer_identity'

function loadIdentity() {
  try { return JSON.parse(localStorage.getItem(IDENTITY_KEY)) || null } catch { return null }
}

const IdentityContext = createContext()
function useIdentity() { return useContext(IdentityContext) }

function IdentityProvider({ children }) {
  const [identity, setIdentity] = useState(loadIdentity)
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const requireIdentity = useCallback((action) => {
    if (identity) { action(); return }
    setPendingAction(() => action)
    setShowPrompt(true)
  }, [identity])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return }
    const id = { name: name.trim(), email: email.trim().toLowerCase(), signedInAt: new Date().toISOString() }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id))
    setIdentity(id)
    setShowPrompt(false)
    if (pendingAction) { pendingAction(); setPendingAction(null) }
  }

  const signOut = () => {
    localStorage.removeItem(IDENTITY_KEY)
    setIdentity(null)
    setName('')
    setEmail('')
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    setPendingAction(null)
    setError('')
  }

  const value = useMemo(() => ({
    identity, requireIdentity, signOut,
    name: identity?.name || null,
    email: identity?.email || null,
  }), [identity, requireIdentity])

  return (
    <IdentityContext.Provider value={value}>
      {children}
      {showPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={dismissPrompt} />
          <div className="relative bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-lg">
            <button onClick={dismissPrompt} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-4">
              <User size={24} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">Sign in to interact</h2>
            <p className="text-xs text-gray-400 text-center mb-5">Your name and email will be attached to your changes</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </IdentityContext.Provider>
  )
}

// ── Edit Context ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'demo_review_edits'
const LOG_KEY = 'demo_change_log'
const CUSTOM_CATS_KEY = 'demo_custom_categories'
const FEEDBACK_KEY = 'demo_general_feedback'

function loadEdits() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}
function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || [] } catch { return [] }
}
function loadCustomCats() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY)) || [] } catch { return [] }
}
function loadFeedback() {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || [] } catch { return [] }
}

const EditContext = createContext()

function EditProvider({ children }) {
  const { identity, requireIdentity } = useIdentity()
  const [edits, setEdits] = useState(loadEdits)
  const [changeLog, setChangeLog] = useState(loadLog)
  const [customCategories, setCustomCategories] = useState(loadCustomCats)
  const [feedback, setFeedback] = useState(loadFeedback)
  const identityRef = React.useRef(identity)
  useEffect(() => { identityRef.current = identity }, [identity])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(edits)) }, [edits])
  useEffect(() => { localStorage.setItem(LOG_KEY, JSON.stringify(changeLog)) }, [changeLog])
  useEffect(() => { localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(customCategories)) }, [customCategories])
  useEffect(() => { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback)) }, [feedback])

  const getUserStamp = () => {
    const id = identityRef.current
    return { user_name: id?.name || null, user_email: id?.email || null }
  }

  const allCategories = useMemo(() => [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ], [customCategories])

  const addCategory = useCallback((key) => {
    const normalized = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    if (!normalized) return null
    if (allCategories.includes(normalized)) return normalized
    setCustomCategories(prev => [...prev, normalized])
    setChangeLog(prev => [...prev, { timestamp: new Date().toISOString(), type: 'category_added', category: normalized, ...getUserStamp() }])
    return normalized
  }, [allCategories])

  const updateCategory = useCallback((txnId, oldCat, newCat, description) => {
    setEdits(prev => ({ ...prev, [txnId]: { ...prev[txnId], category: newCat } }))
    setChangeLog(prev => [...prev, { timestamp: new Date().toISOString(), type: 'category_change', transaction_id: txnId, description, from: oldCat, to: newCat, ...getUserStamp() }])
  }, [])

  const updateNote = useCallback((txnId, note, description) => {
    setEdits(prev => ({ ...prev, [txnId]: { ...prev[txnId], note } }))
    setChangeLog(prev => [...prev, { timestamp: new Date().toISOString(), type: 'note', transaction_id: txnId, description, note, ...getUserStamp() }])
  }, [])

  const toggleFlag = useCallback((txnId, description) => {
    setEdits(prev => {
      const cur = prev[txnId] || {}
      return { ...prev, [txnId]: { ...cur, flagged: !cur.flagged } }
    })
    setChangeLog(prev => [...prev, { timestamp: new Date().toISOString(), type: 'flag_toggle', transaction_id: txnId, description, ...getUserStamp() }])
  }, [])

  const addFeedback = useCallback((page, text) => {
    const entry = { timestamp: new Date().toISOString(), page, text, ...getUserStamp() }
    setFeedback(prev => [...prev, entry])
    setChangeLog(prev => [...prev, { ...entry, type: 'general_feedback' }])
  }, [])

  const undoChange = useCallback((index) => {
    const entry = changeLog[index]
    if (!entry) return
    if (entry.type === 'category_change') {
      setEdits(prev => {
        const updated = { ...prev }
        if (updated[entry.transaction_id]) {
          const { category, ...rest } = updated[entry.transaction_id]
          if (Object.keys(rest).some(k => rest[k] !== undefined && rest[k] !== '' && rest[k] !== false)) {
            updated[entry.transaction_id] = rest
          } else { delete updated[entry.transaction_id] }
        }
        return updated
      })
    } else if (entry.type === 'note') {
      setEdits(prev => {
        const updated = { ...prev }
        if (updated[entry.transaction_id]) {
          const { note, ...rest } = updated[entry.transaction_id]
          if (Object.keys(rest).some(k => rest[k] !== undefined && rest[k] !== '' && rest[k] !== false)) {
            updated[entry.transaction_id] = rest
          } else { delete updated[entry.transaction_id] }
        }
        return updated
      })
    } else if (entry.type === 'flag_toggle') {
      setEdits(prev => {
        const updated = { ...prev }
        if (updated[entry.transaction_id]) {
          const { flagged, ...rest } = updated[entry.transaction_id]
          if (Object.keys(rest).some(k => rest[k] !== undefined && rest[k] !== '' && rest[k] !== false)) {
            updated[entry.transaction_id] = rest
          } else { delete updated[entry.transaction_id] }
        }
        return updated
      })
    } else if (entry.type === 'general_feedback') {
      setFeedback(prev => prev.filter(f => !(f.timestamp === entry.timestamp && f.text === entry.text)))
    }
    setChangeLog(prev => prev.filter((_, i) => i !== index))
  }, [changeLog])

  const resetAll = useCallback(() => {
    if (window.confirm('Reset ALL edits and notes? This cannot be undone.')) {
      setEdits({}); setChangeLog([]); setCustomCategories([]); setFeedback([])
      localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LOG_KEY)
      localStorage.removeItem(CUSTOM_CATS_KEY); localStorage.removeItem(FEEDBACK_KEY)
    }
  }, [])

  const transactions = useMemo(() =>
    data.transactions.map(t => {
      const e = edits[t.transaction_id]
      if (!e) return t
      return { ...t, tax_category: e.category ?? t.tax_category, _note: e.note ?? '', _flagged: !!e.flagged, _originalCategory: t.tax_category, _edited: true }
    }), [edits]
  )

  const categories = useMemo(() => {
    const catMap = {}
    for (const c of data.categories) { catMap[c.key] = { ...c, count: 0, total: 0 } }
    for (const t of transactions) {
      const key = t.tax_category
      if (!catMap[key]) catMap[key] = { key, name: key, count: 0, total: 0, isBusiness: true }
      catMap[key].count++; catMap[key].total += t.amount
    }
    return Object.values(catMap)
  }, [transactions])

  const downloadChangeLog = useCallback(() => {
    const blob = new Blob([JSON.stringify(changeLog, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `demo_change_log_${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }, [changeLog])

  const downloadEditsSnapshot = useCallback(() => {
    const edited = transactions.filter(t => edits[t.transaction_id])
    const snapshot = edited.map(t => ({
      transaction_id: t.transaction_id, date: t.date, amount: t.amount, description: t.description, account: t.account,
      original_category: t._originalCategory || t.tax_category, new_category: t.tax_category, note: t._note || '', flagged: !!t._flagged,
    }))
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `demo_edits_snapshot_${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }, [transactions, edits])

  const value = useMemo(() => ({
    edits, transactions, categories, changeLog, feedback,
    updateCategory, updateNote, toggleFlag, addFeedback, undoChange, resetAll,
    downloadChangeLog, downloadEditsSnapshot, addCategory, allCategories, customCategories,
    requireIdentity,
  }), [edits, transactions, categories, changeLog, feedback, updateCategory, updateNote, toggleFlag, addFeedback, undoChange, resetAll, downloadChangeLog, downloadEditsSnapshot, addCategory, allCategories, customCategories, requireIdentity])

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

function useEdits() { return useContext(EditContext) }

// ── CSV Export Utility ──────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = String(r[h] ?? '').replace(/"/g, '""')
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v
    }).join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}

const DEFAULT_CATEGORIES = [
  'client_payments', 'material_expenses', 'contractor_labor', 'shop_overhead',
  'office_overhead', 'insurance', 'gas_travel', 'dining_meals', 'owner_compensation',
  'not_business', 'transfer',
]

const CAT_LABELS = {
  client_payments: 'Client Payments',
  material_expenses: 'Material Expenses',
  contractor_labor: 'Contractor/Labor',
  shop_overhead: 'Shop Overhead',
  office_overhead: 'Office Overhead',
  insurance: 'Insurance',
  gas_travel: 'Gas/Travel',
  dining_meals: 'Dining/Meals',
  owner_compensation: 'Owner Compensation',
  not_business: 'Not Business',
  transfer: 'Transfer',
}

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

// ── Demo Banner ─────────────────────────────────────────────────────────────
const BANNER_DISMISSED_KEY = 'demo_banner_dismissed'

function DemoBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(BANNER_DISMISSED_KEY) === 'true')

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="flex-shrink-0" />
          <p className="text-sm">
            <strong>This is an interactive demo</strong> with anonymized data. Try changing categories, adding notes, flagging transactions, or leaving feedback!
          </p>
        </div>
        <button onClick={dismiss} className="text-white/70 hover:text-white flex-shrink-0 cursor-pointer" title="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Onboarding Hints (pulse animations on first visit) ──────────────────────
const HINTS_SEEN_KEY = 'demo_hints_seen'

function OnboardingHints() {
  const [seen, setSeen] = useState(() => localStorage.getItem(HINTS_SEEN_KEY) === 'true')

  useEffect(() => {
    if (seen) return
    const timer = setTimeout(() => {
      setSeen(true)
      localStorage.setItem(HINTS_SEEN_KEY, 'true')
    }, 30000)
    return () => clearTimeout(timer)
  }, [seen])

  useEffect(() => {
    if (seen) return
    const style = document.createElement('style')
    style.id = 'onboarding-hints-style'
    style.textContent = `
      @keyframes demo-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
      }
      .demo-hint-flag button:first-child,
      .demo-hint-note span,
      .demo-hint-category select {
        animation: demo-pulse 2s ease-in-out 3;
        border-radius: 4px;
      }
    `
    document.head.appendChild(style)
    return () => { document.getElementById('onboarding-hints-style')?.remove() }
  }, [seen])

  return null
}

// ── Guided Tour ─────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    title: 'Change a Category',
    description: 'Use the dropdown on any transaction to reassign its tax category. You can even add custom categories.',
    tab: 'categories',
    icon: BarChart3,
  },
  {
    title: 'Add a Note',
    description: 'Click any cell in the Notes column to type a note about a specific transaction.',
    tab: 'categories',
    icon: MessageSquare,
  },
  {
    title: 'Flag for Review',
    description: 'Click the flag icon on any row to mark it for review. Use the "Flagged" filter to see only flagged items.',
    tab: 'categories',
    icon: Flag,
  },
  {
    title: 'Leave Feedback',
    description: 'Scroll to the bottom of any page to leave general feedback or suggestions.',
    tab: 'summary',
    icon: Send,
  },
  {
    title: 'View Change Log',
    description: 'Click "Change Log" in the header to see all your changes. You can undo any individual change.',
    tab: 'categories',
    icon: History,
  },
  {
    title: 'Export Your Work',
    description: 'Use the header buttons to download your change log, export edits as JSON, or export filtered CSV data.',
    tab: 'categories',
    icon: Download,
  },
]

function GuidedTour({ onNavigate }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setStep(0); }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
        title="Take a guided tour of the dashboard"
      >
        <Play size={14} /> Take a Tour
      </button>
    )
  }

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={() => setActive(false)} />
      <div className="relative bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
        <button onClick={() => setActive(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Icon size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-indigo-600 font-semibold">Step {step + 1} of {TOUR_STEPS.length}</p>
            <h3 className="text-lg font-bold text-gray-900">{current.title}</h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{current.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-indigo-600' : i < step ? 'bg-indigo-300' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => { setStep(step - 1); onNavigate(TOUR_STEPS[step - 1].tab); }} className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                Back
              </button>
            )}
            {isLast ? (
              <button onClick={() => setActive(false)} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                <Check size={14} /> Done
              </button>
            ) : (
              <button onClick={() => { setStep(step + 1); onNavigate(TOUR_STEPS[step + 1].tab); }} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Visitor Counter (localStorage-based, simulated) ─────────────────────────
const VISITOR_KEY = 'demo_visitor_id'
const VISIT_COUNT_KEY = 'demo_visit_count'

function useVisitorCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let c = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10)
    if (!localStorage.getItem(VISITOR_KEY)) {
      localStorage.setItem(VISITOR_KEY, crypto.randomUUID?.() || Math.random().toString(36).slice(2))
      c = c + Math.floor(Math.random() * 3) + 1
    } else {
      c = c + 1
    }
    localStorage.setItem(VISIT_COUNT_KEY, String(c))
    setCount(c + 142)
  }, [])
  return count
}

// ── Email List / Bizzib Popup (shows after ~60s) ────────────────────────────
const POPUP_DISMISSED_KEY = 'demo_email_popup_dismissed'

function EmailListPopup() {
  const [show, setShow] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(POPUP_DISMISSED_KEY) === 'true') return
    const timer = setTimeout(() => setShow(true), 60000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!emailInput.trim() || !emailInput.includes('@')) return
    const signups = JSON.parse(localStorage.getItem('demo_email_signups') || '[]')
    signups.push({ name: nameInput.trim(), email: emailInput.trim().toLowerCase(), timestamp: new Date().toISOString() })
    localStorage.setItem('demo_email_signups', JSON.stringify(signups))
    setSubmitted(true)
    setTimeout(dismiss, 3000)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={dismiss} />
      <div className="relative bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-xl">
        <button onClick={dismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Thanks for signing up!</h3>
            <p className="text-sm text-gray-500 mt-1">I'll be in touch soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-4">
              <Heart size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Enjoying the demo?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-2">I build custom automation tools for small businesses.</p>

            <form onSubmit={handleSubmit} className="space-y-2.5 mt-4">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Your email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="submit" className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                Join My Email List
              </button>
              <p className="text-[10px] text-gray-400 text-center">I will never sell or share your data. Unsubscribe anytime.</p>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-2.5">Or learn more about what I do:</p>
              <div className="flex gap-2">
                <a href="https://bizzib.ai" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">
                  <ExternalLink size={12} /> bizzib.ai
                </a>
                <a href="https://bizzib.ai/free-consultation" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                  <Calendar size={12} /> Free Consultation
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Share Buttons ────────────────────────────────────────────────────────────
function ShareButtons() {
  const [copied, setCopied] = useState(false)
  const url = 'https://transaction-review-demo.netlify.app'
  const text = 'Check out this interactive transaction review dashboard — built with React to automate small business tax prep!'

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
      </button>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 bg-[#0077b5] text-white rounded-lg text-xs font-medium hover:bg-[#006299] transition-colors"
      >
        <Share2 size={12} /> LinkedIn
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
      >
        <Share2 size={12} /> X / Twitter
      </a>
    </div>
  )
}

const TABS = [
  { id: 'summary', label: 'Summary', icon: LayoutDashboard },
  { id: 'categories', label: 'Categories', icon: BarChart3 },
  { id: 'excluded', label: 'Excluded', icon: XCircle },
  { id: 'transfers', label: 'Transfer Pairs', icon: ArrowLeftRight },
  { id: 'jobs', label: 'Job Audit', icon: ClipboardList },
  { id: 'monthly', label: 'Monthly', icon: Calendar },
  { id: 'about', label: 'About', icon: Info },
]

function App() {
  const [activeTab, setActiveTab] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [expandedPairs, setExpandedPairs] = useState(new Set())
  const [changeLogOpen, setChangeLogOpen] = useState(false)
  const { changeLog, downloadChangeLog, downloadEditsSnapshot, resetAll, edits } = useEdits()
  const { identity, signOut } = useIdentity()
  const editCount = Object.keys(edits).length
  const visitorCount = useVisitorCount()

  const navigateToTab = useCallback((tab) => {
    setActiveTab(tab)
    setSelectedCategory(null)
    setSearchTerm('')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHints />
      <EmailListPopup />
      <ChangeLogPanel open={changeLogOpen} onClose={() => setChangeLogOpen(false)} />
      <DemoBanner />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Review Dashboard</h1>
              <p className="text-sm text-gray-500">{data.year} Tax Year &middot; {data.totalTransactions.toLocaleString()} transactions
                {editCount > 0 && <span className="ml-2 text-amber-600 font-medium">({editCount} edits)</span>}
                <span className="ml-2 text-gray-400"><Eye size={11} className="inline -mt-0.5" /> {visitorCount} views</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {identity && (
                <>
                  <span className="text-xs text-gray-500 flex items-center gap-1.5 mr-2">
                    <User size={12} /> {identity.name}
                  </span>
                  <button onClick={signOut} className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-600 text-xs cursor-pointer" title="Sign out">
                    <LogOut size={12} />
                  </button>
                </>
              )}
              <GuidedTour onNavigate={navigateToTab} />
              {changeLog.length > 0 && (
                <button onClick={() => setChangeLogOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer" title="View change log">
                  <History size={14} /> Change Log ({changeLog.length})
                </button>
              )}
              {editCount > 0 && (
                <>
                  <button onClick={downloadChangeLog} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer" title="Download change log (JSON)">
                    <FileText size={14} /> Download Log
                  </button>
                  <button onClick={downloadEditsSnapshot} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors cursor-pointer" title="Download edits snapshot (JSON)">
                    <Download size={14} /> Export Edits
                  </button>
                  <button onClick={resetAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer" title="Reset all edits">
                    <RotateCcw size={14} /> Reset
                  </button>
                </>
              )}
            </div>
          </div>
          <nav className="flex gap-1 mt-3">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => navigateToTab(tab.id)}
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
        {activeTab === 'jobs' && <JobAuditView />}
        {activeTab === 'monthly' && <MonthlyView />}
        {activeTab === 'about' && <AboutView />}
        <FeedbackPanel page={activeTab} />
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
  const { categories } = useEdits()
  const bizCats = categories.filter(c => c.isBusiness)
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
          <p className="text-sm text-gray-500 mb-4">Business account balances</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Accounts Summary</h3>
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

function NoteCell({ txn }) {
  const { edits, updateNote, requireIdentity } = useEdits()
  const currentNote = edits[txn.transaction_id]?.note ?? ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(currentNote)

  useEffect(() => { setDraft(edits[txn.transaction_id]?.note ?? '') }, [edits, txn.transaction_id])

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { updateNote(txn.transaction_id, draft, txn.description); setEditing(false) }
            if (e.key === 'Escape') { setDraft(currentNote); setEditing(false) }
          }}
          className="w-full px-1.5 py-0.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Add note..."
        />
        <button onClick={() => { updateNote(txn.transaction_id, draft, txn.description); setEditing(false) }} className="text-green-600 hover:text-green-800 cursor-pointer"><Save size={12} /></button>
      </div>
    )
  }

  return (
    <span
      onClick={() => requireIdentity(() => setEditing(true))}
      className={`cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs block min-h-[20px] ${currentNote ? 'text-blue-700 bg-blue-50/50 font-medium' : 'text-gray-300 italic'}`}
      title="Click to add/edit note"
    >
      {currentNote || 'click to add note'}
    </span>
  )
}

function CategorySelect({ txn }) {
  const { updateCategory, addCategory, edits, allCategories, requireIdentity } = useEdits()
  const originalCat = data.transactions.find(o => o.transaction_id === txn.transaction_id)?.tax_category || txn.tax_category
  const catChanged = edits[txn.transaction_id]?.category && edits[txn.transaction_id].category !== originalCat

  const handleChange = (e) => {
    const val = e.target.value
    requireIdentity(() => {
      if (val === '__new__') {
        const name = window.prompt('Enter new category name (e.g. "Tools & Equipment"):')
        if (!name) return
        const key = addCategory(name)
        if (key) updateCategory(txn.transaction_id, originalCat, key, txn.description)
      } else {
        updateCategory(txn.transaction_id, originalCat, val, txn.description)
      }
    })
  }

  return (
    <div>
      <select
        value={txn.tax_category}
        onChange={handleChange}
        className={`text-xs px-1.5 py-1 rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 ${catChanged ? 'border-amber-400 bg-amber-50 font-semibold' : 'border-gray-200 bg-white'}`}
        style={{ color: CATEGORY_COLORS[txn.tax_category] || '#374151' }}
      >
        {allCategories.map(cat => (
          <option key={cat} value={cat} style={{ color: CATEGORY_COLORS[cat] || '#374151' }}>
            {CAT_LABELS[cat] || cat}
          </option>
        ))}
        <option value="__new__" style={{ color: '#2563eb', fontWeight: 600 }}>+ Add New Category...</option>
      </select>
      {catChanged && <span className="block text-[10px] text-gray-400 mt-0.5 line-through">{originalCat}</span>}
    </div>
  )
}

function TransactionTable({ transactions, showCategory = true }) {
  const { edits, toggleFlag, requireIdentity } = useEdits()

  if (transactions.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No transactions found.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-8 py-2 px-1" title="Flag for review"><Flag size={12} className="text-gray-400 mx-auto" /></th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Description</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Account</th>
            {showCategory && <th className="text-left py-2 px-3 font-medium text-gray-500">Category</th>}
            <th className="text-left py-2 px-3 font-medium text-gray-500">Memo</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Notes</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => {
            const originalCat = data.transactions.find(o => o.transaction_id === t.transaction_id)?.tax_category || t.tax_category
            const catChanged = edits[t.transaction_id]?.category && edits[t.transaction_id].category !== originalCat
            const isFlagged = !!edits[t.transaction_id]?.flagged
            return (
              <tr key={t.transaction_id || i} className={`border-b border-gray-50 transition-colors ${isFlagged ? 'bg-red-50/60' : catChanged ? 'bg-amber-50/60' : 'hover:bg-blue-50/50'}`}>
                <td className="py-2 px-1 text-center">
                  <button
                    onClick={() => requireIdentity(() => toggleFlag(t.transaction_id, t.description))}
                    className={`cursor-pointer p-0.5 rounded transition-colors ${isFlagged ? 'text-red-500 hover:text-red-700' : 'text-gray-300 hover:text-red-400'}`}
                    title={isFlagged ? 'Unflag' : 'Flag for review'}
                  >
                    <Flag size={14} fill={isFlagged ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{String(t.date).slice(0, 10)}</td>
                <td className={`py-2 px-3 text-right font-mono font-medium whitespace-nowrap ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(t.amount)}
                </td>
                <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={t.description}>{t.description}</td>
                <td className="py-2 px-3 text-gray-500 whitespace-nowrap text-xs">{t.account}</td>
                {showCategory && (
                  <td className="py-2 px-3">
                    <CategorySelect txn={t} />
                  </td>
                )}
                <td className="py-2 px-3 text-gray-400 text-xs max-w-[150px] truncate" title={t.memo || t.venmo_note || ''}>{t.memo || t.venmo_note || ''}</td>
                <td className="py-1 px-3 min-w-[160px]">
                  <NoteCell txn={t} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── General Feedback Panel ──────────────────────────────────────────────────
function FeedbackPanel({ page }) {
  const { feedback, addFeedback, requireIdentity } = useEdits()
  const [draft, setDraft] = useState('')
  const pageFeedback = feedback.filter(f => f.page === page)

  const submit = () => {
    if (!draft.trim()) return
    requireIdentity(() => {
      addFeedback(page, draft.trim())
      setDraft('')
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">General Feedback</h3>
        <span className="text-xs text-gray-400">Leave notes or suggestions about this page</span>
      </div>
      {pageFeedback.length > 0 && (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {pageFeedback.map((f, i) => (
            <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-800">
              <p>{f.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">{f.user_name && <span className="font-medium text-gray-500">{f.user_name} &middot; </span>}{new Date(f.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder="Type feedback here... (Enter to submit, Shift+Enter for new line)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
          rows={2}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  )
}

// ── Change Log Panel (slide-out) ────────────────────────────────────────────
function ChangeLogPanel({ open, onClose }) {
  const { changeLog, undoChange } = useEdits()

  if (!open) return null

  const typeLabel = (entry) => {
    switch (entry.type) {
      case 'category_change': return 'Category'
      case 'note': return 'Note'
      case 'flag_toggle': return 'Flag'
      case 'general_feedback': return 'Feedback'
      case 'category_added': return 'New Category'
      default: return entry.type
    }
  }

  const typeColor = (entry) => {
    switch (entry.type) {
      case 'category_change': return 'bg-amber-100 text-amber-800'
      case 'note': return 'bg-blue-100 text-blue-800'
      case 'flag_toggle': return 'bg-red-100 text-red-800'
      case 'general_feedback': return 'bg-purple-100 text-purple-800'
      case 'category_added': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const describeEntry = (entry) => {
    switch (entry.type) {
      case 'category_change':
        return <><span className="font-medium">{entry.description?.slice(0, 40)}</span> <span className="text-gray-400">&rarr;</span> <span className="line-through text-gray-400">{entry.from}</span> <span className="text-gray-400">&rarr;</span> <span className="font-semibold">{entry.to}</span></>
      case 'note':
        return <><span className="font-medium">{entry.description?.slice(0, 40)}</span>: <span className="italic text-blue-700">"{entry.note?.slice(0, 50)}"</span></>
      case 'flag_toggle':
        return <><span className="font-medium">{entry.description?.slice(0, 50)}</span></>
      case 'general_feedback':
        return <><span className="text-purple-700">({entry.page})</span> "{entry.text?.slice(0, 60)}"</>
      case 'category_added':
        return <>Added: <span className="font-semibold">{entry.category}</span></>
      default:
        return JSON.stringify(entry).slice(0, 60)
    }
  }

  const reversed = [...changeLog].map((entry, originalIndex) => ({ entry, originalIndex })).reverse()

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Change Log</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{changeLog.length} entries</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {reversed.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No changes yet. Start editing transactions!</p>
          ) : (
            <div className="space-y-2">
              {reversed.map(({ entry, originalIndex }) => (
                <div key={originalIndex} className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeColor(entry)}`}>{typeLabel(entry)}</span>
                      {entry.user_name && <span className="text-[10px] text-gray-500 font-medium">{entry.user_name}</span>}
                      <span className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-700 truncate">{describeEntry(entry)}</p>
                  </div>
                  <button
                    onClick={() => undoChange(originalIndex)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg cursor-pointer flex-shrink-0"
                    title="Undo this change"
                  >
                    <Undo2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CSVExportPanel({ transactions, filenamePrefix }) {
  const { categories, edits, allCategories } = useEdits()
  const [showPanel, setShowPanel] = useState(false)
  const [csvCats, setCsvCats] = useState(new Set(DEFAULT_CATEGORIES.filter(c => c !== 'transfer')))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountFilter, setAmountFilter] = useState('all')

  const toggleCat = (cat) => {
    setCsvCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const doExport = () => {
    let rows = transactions.filter(t => csvCats.has(t.tax_category))
    if (dateFrom) rows = rows.filter(t => t.date >= dateFrom)
    if (dateTo) rows = rows.filter(t => t.date <= dateTo)
    if (amountFilter === 'positive') rows = rows.filter(t => t.amount >= 0)
    if (amountFilter === 'negative') rows = rows.filter(t => t.amount < 0)

    const csvRows = rows.map(t => ({
      date: t.date, amount: t.amount, description: t.description, account: t.account,
      category: t.tax_category, memo: t.memo || t.venmo_note || '',
      note: edits[t.transaction_id]?.note || '', transaction_id: t.transaction_id,
    }))
    downloadCSV(csvRows, `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (!showPanel) {
    return (
      <button onClick={() => setShowPanel(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer">
        <Download size={14} /> Export CSV
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Filter size={14} /> CSV Export Options</h4>
        <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer">Close</button>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Categories</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setCsvCats(new Set(allCategories))} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">All</button>
          <button onClick={() => setCsvCats(new Set())} className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer">None</button>
          {allCategories.map(cat => (
            <label key={cat} className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="checkbox" checked={csvCats.has(cat)} onChange={() => toggleCat(cat)} className="rounded cursor-pointer" />
              <span style={{ color: CATEGORY_COLORS[cat] }}>{CAT_LABELS[cat] || cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Date From</p>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Date To</p>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
          <select value={amountFilter} onChange={e => setAmountFilter(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 cursor-pointer">
            <option value="all">All</option>
            <option value="positive">Positive only</option>
            <option value="negative">Negative only</option>
          </select>
        </div>
      </div>
      <button onClick={doExport} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer">
        <Download size={14} /> Download CSV
      </button>
    </div>
  )
}

function CategoryView({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }) {
  const [showAll, setShowAll] = useState(false)
  const [showFlagged, setShowFlagged] = useState(false)
  const { transactions, categories, edits } = useEdits()
  const bizCats = categories.filter(c => c.isBusiness).sort((a, b) => a.total - b.total)

  const flaggedCount = useMemo(() =>
    transactions.filter(t => edits[t.transaction_id]?.flagged && categories.find(c => c.key === t.tax_category)?.isBusiness).length,
    [transactions, edits, categories]
  )

  const filteredTxns = useMemo(() => {
    let txns = transactions.filter(t => {
      if (selectedCategory) return t.tax_category === selectedCategory
      return categories.find(c => c.key === t.tax_category)?.isBusiness
    })
    if (showFlagged) txns = txns.filter(t => edits[t.transaction_id]?.flagged)
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
  }, [selectedCategory, searchTerm, transactions, categories, showFlagged, edits])

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
        {flaggedCount > 0 && (
          <button
            onClick={() => setShowFlagged(!showFlagged)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showFlagged ? 'bg-red-600 text-white' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <Flag size={14} /> Flagged ({flaggedCount})
          </button>
        )}
      </div>

      <CSVExportPanel transactions={filteredTxns} filenamePrefix="demo_categories" />

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
  const [showFlagged, setShowFlagged] = useState(false)
  const { transactions, categories, edits } = useEdits()

  const flaggedCount = useMemo(() =>
    transactions.filter(t => edits[t.transaction_id]?.flagged && (t.tax_category === 'not_business' || t.tax_category === 'transfer')).length,
    [transactions, edits]
  )

  const filteredTxns = useMemo(() => {
    let txns = transactions.filter(t => t.tax_category === showType)
    if (showFlagged) txns = txns.filter(t => edits[t.transaction_id]?.flagged)
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
  }, [showType, searchTerm, transactions, showFlagged, edits])

  const notBizCount = categories.find(c => c.key === 'not_business')?.count || 0
  const xferCount = categories.find(c => c.key === 'transfer')?.count || 0

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
        {flaggedCount > 0 && (
          <button
            onClick={() => setShowFlagged(!showFlagged)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showFlagged ? 'bg-red-600 text-white' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <Flag size={14} /> Flagged ({flaggedCount})
          </button>
        )}
      </div>

      <CSVExportPanel transactions={filteredTxns} filenamePrefix={`demo_excluded_${showType}`} />

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
        <TransactionTable transactions={showAll ? filteredTxns : filteredTxns.slice(0, 100)} showCategory={true} />
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

function JobAuditView() {
  const [selectedJob, setSelectedJob] = useState(null)
  const [expandedCats, setExpandedCats] = useState(new Set())

  const jobs = data.jobs || []
  const activeJob = jobs.find(j => j.code === selectedJob)

  const toggleCat = (key) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const totalExpenses = jobs.reduce((s, j) => s + j.expenses, 0)
  const totalIncome = jobs.reduce((s, j) => s + j.income, 0)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Job / Project Audit</h3>
        <p className="text-sm text-gray-500 mb-4">
          Review expenses and income by project. Each job card shows transactions tied to that project via PO codes and payment notes.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {jobs.map(job => (
            <button
              key={job.code}
              onClick={() => { setSelectedJob(selectedJob === job.code ? null : job.code); setExpandedCats(new Set()); }}
              className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedJob === job.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 truncate">{job.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{job.transactionCount} txns</p>
              <p className={`text-sm font-bold mt-1 ${job.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(job.net)}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Total Income (all jobs)</p>
            <p className="text-lg font-bold text-green-600">{fmt(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Expenses (all jobs)</p>
            <p className="text-lg font-bold text-red-600">{fmt(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net</p>
            <p className={`text-lg font-bold ${totalIncome + totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalIncome + totalExpenses)}</p>
          </div>
        </div>
      </div>

      {activeJob && (() => {
        const subs = activeJob.subcategories || activeJob.categories
        const expenseSubs = subs.filter(c => c.total < 0)
        const incomeSubs = subs.filter(c => c.total > 0)
        const SUB_COLORS = [
          '#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#06b6d4', '#eab308',
          '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16', '#a855f7',
          '#0ea5e9', '#d946ef', '#f59e0b', '#10b981', '#e11d48', '#7c3aed',
          '#059669', '#dc2626',
        ]
        return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {activeJob.income > 0 && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <p className="text-xs font-medium text-green-700">Client Payments</p>
                <p className="text-xl font-bold text-green-600 mt-1">{fmt(activeJob.income)}</p>
                <p className="text-xs text-green-500 mt-1">{incomeSubs.reduce((s, c) => s + c.count, 0)} transactions</p>
              </div>
            )}
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <p className="text-xs font-medium text-red-700">Total Expenses</p>
              <p className="text-xl font-bold text-red-600 mt-1">{fmt(activeJob.expenses)}</p>
              <p className="text-xs text-red-500 mt-1">{expenseSubs.reduce((s, c) => s + c.count, 0)} transactions across {expenseSubs.length} categories</p>
            </div>
            <div className={`rounded-xl border p-4 ${activeJob.net >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-medium ${activeJob.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net P&L</p>
              <p className={`text-xl font-bold mt-1 ${activeJob.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(activeJob.net)}</p>
              <p className="text-xs text-gray-500 mt-1">{activeJob.transactionCount} total &middot; Code: {activeJob.code}</p>
            </div>
          </div>

          {incomeSubs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Income</h4>
              <div className="space-y-1">
                {incomeSubs.map(cat => {
                  const isExpanded = expandedCats.has(cat.key)
                  const catTxns = activeJob.transactions.filter(t =>
                    activeJob.subcategories ? t.audit_subcategory === cat.key : t.tax_category === cat.key
                  )
                  return (
                    <div key={cat.key} className="border border-green-100 rounded-lg overflow-hidden bg-green-50/30">
                      <button
                        onClick={() => toggleCat(cat.key)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-green-50 transition-colors text-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="font-medium text-gray-900">{cat.key}</span>
                          <span className="text-gray-400 text-xs">{cat.count} txns</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">{fmt(cat.total)}</span>
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-green-100">
                          <TransactionTable transactions={catTxns} showCategory={false} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Expense Breakdown</h4>

            {expenseSubs.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <ResponsiveContainer width="100%" height={Math.max(200, expenseSubs.length * 32)}>
                  <BarChart
                    layout="vertical"
                    data={expenseSubs.map((c, i) => ({
                      name: c.key,
                      value: Math.abs(c.total),
                      fill: SUB_COLORS[i % SUB_COLORS.length],
                    }))}
                  >
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={180} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {expenseSubs.map((c, i) => (
                        <Cell key={c.key} fill={SUB_COLORS[i % SUB_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-1">
              {expenseSubs.map((cat, i) => {
                const isExpanded = expandedCats.has(cat.key)
                const catTxns = activeJob.transactions.filter(t =>
                  activeJob.subcategories ? t.audit_subcategory === cat.key : t.tax_category === cat.key
                )
                const letter = cat.key.charAt(0)
                const isSection = /^[A-S]-/.test(cat.key)
                return (
                  <div key={cat.key} className={`border rounded-lg overflow-hidden ${isSection ? 'border-gray-200' : 'border-gray-100'}`}>
                    <button
                      onClick={() => toggleCat(cat.key)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: SUB_COLORS[i % SUB_COLORS.length] }} />
                        <span className={`${isSection ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{cat.key}</span>
                        <span className="text-gray-400 text-xs">{cat.count} txns</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-red-600">{fmt(cat.total)}</span>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        <TransactionTable transactions={catTxns} showCategory={false} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function MonthlyView() {
  const [expandedMonth, setExpandedMonth] = useState(null)
  const { transactions } = useEdits()

  const bizCats = ['client_payments', 'material_expenses', 'contractor_labor', 'shop_overhead', 'office_overhead', 'insurance', 'gas_travel', 'dining_meals', 'owner_compensation']

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const key = String(i + 1).padStart(2, '0')
      const txns = transactions.filter(t => {
        const m = t.date?.slice(5, 7)
        return m === key && bizCats.includes(t.tax_category)
      })
      const income = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
      const expenses = txns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

      const byCat = {}
      for (const t of txns) {
        if (!byCat[t.tax_category]) byCat[t.tax_category] = { count: 0, total: 0 }
        byCat[t.tax_category].count++
        byCat[t.tax_category].total += t.amount
      }

      return {
        month: MONTHS[i],
        monthNum: key,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(Math.abs(expenses) * 100) / 100,
        net: Math.round((income + expenses) * 100) / 100,
        txnCount: txns.length,
        byCat,
        transactions: txns,
      }
    })
  }, [transactions])

  const ytdIncome = monthlyData.reduce((s, m) => s + m.income, 0)
  const ytdExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="YTD Income" value={fmt(ytdIncome)} color="text-green-600" />
        <StatCard label="YTD Expenses" value={fmt(-ytdExpenses)} color="text-red-600" />
        <StatCard label="YTD Net P+L" value={fmt(ytdIncome - ytdExpenses)} color={ytdIncome - ytdExpenses >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Txns</th>
              <th className="text-right py-3 px-4 font-semibold text-green-700">Income</th>
              <th className="text-right py-3 px-4 font-semibold text-red-700">Expenses</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Net</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((m) => {
              const isExpanded = expandedMonth === m.monthNum
              return (
                <React.Fragment key={m.monthNum}>
                  <tr
                    onClick={() => setExpandedMonth(isExpanded ? null : m.monthNum)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{m.month} 2025</td>
                    <td className="py-3 px-4 text-right text-gray-500">{m.txnCount}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">{m.income > 0 ? fmt(m.income) : '—'}</td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">{m.expenses > 0 ? fmt(-m.expenses) : '—'}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${m.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(m.net)}</td>
                    <td className="py-3 px-2">{isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {bizCats.filter(c => m.byCat[c]).map(c => (
                            <div key={c} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
                                <span className="text-gray-700">{CAT_LABELS[c]}</span>
                              </div>
                              <span className={`font-semibold ${m.byCat[c].total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {fmt(m.byCat[c].total)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <TransactionTable transactions={m.transactions.sort((a, b) => a.date < b.date ? -1 : 1)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            <tr className="bg-gray-50 font-semibold">
              <td className="py-3 px-4 text-gray-900">Total</td>
              <td className="py-3 px-4 text-right text-gray-700">{monthlyData.reduce((s, m) => s + m.txnCount, 0)}</td>
              <td className="py-3 px-4 text-right text-green-600">{fmt(ytdIncome)}</td>
              <td className="py-3 px-4 text-right text-red-600">{fmt(-ytdExpenses)}</td>
              <td className={`py-3 px-4 text-right ${ytdIncome - ytdExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(ytdIncome - ytdExpenses)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AboutView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How I Automated Tax Prep for a Small Construction Business</h2>
        <p className="text-sm text-gray-500 mb-6">A portfolio project by Michelle Griffith</p>

        <div className="prose prose-gray max-w-none space-y-4 text-gray-700 text-[15px] leading-relaxed">
          <p>
            My fiancé Eric runs a one-man construction company in a small town. Every year around tax time, he faces the same nightmare: pulling together transactions from <strong>eleven different accounts</strong> — business checking, savings, two credit cards, a Home Depot card, Venmo, and store credit accounts at the local hardware store and lumber yard — and figuring out what's a business expense, what's personal, and what's actually income.
          </p>
          <p>
            He's tried the off-the-shelf tools. QuickBooks, FreshBooks, Wave — they were either too expensive for a solo operator, too bloated with features he'd never use, or just didn't do the one thing he actually needed without also making him manage invoicing, payroll, CRM, and a dozen other things he wasn't looking for. He never found anything that quite fit, at least not easily enough to be worth the friction. So he'd fall back to spreadsheets. Every year.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 pt-2">The Problem</h3>
          <p>
            Eric's clients love paying through Venmo. His contractors expect Venmo too. The issue? When a client sends $5,000 for a kitchen remodel and Eric transfers that money to his business checking account, the bank sees <em>two</em> positive transactions — the Venmo payment and the checking deposit. Without careful tracking, it looks like $10,000 of income instead of $5,000. Multiply that across a year of projects and you're looking at a tax bill for money you never made.
          </p>
          <p>
            On top of that, Eric writes checks to his lumber yard, pays invoices at the hardware store on a store credit account, and has recurring insurance and utility payments scattered across multiple accounts. His accountant needs a clean summary by category — materials, contractor labor, insurance, overhead, gas — and Eric was doing all of this manually in a spreadsheet.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 pt-2">The Solution</h3>
          <p>I built a three-stage Python pipeline that processes everything automatically.</p>

          <div className="bg-gray-50 rounded-lg p-5 space-y-3 border border-gray-100">
            <div>
              <span className="font-semibold text-gray-900">Stage 1: Unify.</span>{' '}
              A processing script ingests CSVs from the banks, parses HTML statements from the hardware store, and extracts text from PDF statements from the lumber yard using <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">pdftotext</code>. Every transaction gets normalized into a single format. The script also detects inter-account transfers and pairs them, so that $5,000 moving from Venmo to checking is flagged as one transfer, not two income events. 1,310 transactions across 11 accounts, unified in seconds.
            </div>
            <div>
              <span className="font-semibold text-gray-900">Stage 2: Categorize.</span>{' '}
              A rules engine automatically assigns each transaction to a tax category. It uses regex pattern matching on descriptions, Venmo-specific rules that match counterparty names with payment notes, and account-level defaults as a fallback. The result: 100% of transactions categorized with zero manual intervention.
            </div>
            <div>
              <span className="font-semibold text-gray-900">Stage 3: Report.</span>{' '}
              A summary script aggregates everything into the exact format the accountant expects — client payments, material expenses, contractor labor, shop overhead, office overhead, insurance, gas, owner draws, and net P&amp;L. It also tracks the opening and closing balances of the business accounts.
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 pt-2">The Dashboard</h3>
          <p>
            To make it easy for Eric to review everything before sending it to his accountant, I built this interactive dashboard with seven views:
          </p>
          <ul className="space-y-1 text-sm">
            <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> <strong>Summary</strong> — High-level KPIs, account balances, expense charts, and a full category table</li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> <strong>Categories</strong> — Drill into any tax category and see every transaction, with full-text search and editable fields</li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> <strong>Excluded</strong> — Everything marked personal or as a transfer, to verify nothing was missed</li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> <strong>Transfer Pairs</strong> — Every matched debit ↔ credit pair across accounts</li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> <strong>Job Audit</strong> — Per-project expense breakdowns from PO codes and payment notes, replacing the grueling audit spreadsheets Eric used to maintain by hand</li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">→</span> <strong>Monthly</strong> — Income vs. expenses by month with expandable category breakdowns</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 pt-2">Interactive Features</h3>
          <p>
            This isn't just a read-only dashboard. Eric can actively review and annotate transactions right in the browser:
          </p>
          <ul className="space-y-1 text-sm">
            <li className="flex gap-2"><span className="text-indigo-600 font-bold">→</span> <strong>Change categories</strong> — Reassign any transaction's tax category via dropdown, or add a custom category</li>
            <li className="flex gap-2"><span className="text-indigo-600 font-bold">→</span> <strong>Add notes</strong> — Click any row's Notes cell to leave free-text annotations</li>
            <li className="flex gap-2"><span className="text-indigo-600 font-bold">→</span> <strong>Flag for review</strong> — Mark transactions for follow-up with a single click</li>
            <li className="flex gap-2"><span className="text-indigo-600 font-bold">→</span> <strong>Leave feedback</strong> — Page-level feedback panel at the bottom of every view</li>
            <li className="flex gap-2"><span className="text-indigo-600 font-bold">→</span> <strong>Change log with undo</strong> — Every edit is timestamped and reversible from the Change Log panel</li>
            <li className="flex gap-2"><span className="text-indigo-600 font-bold">→</span> <strong>Export</strong> — Download the change log as JSON, export edits snapshots, or export filtered CSV data</li>
          </ul>
          <p>
            In this public demo, interactive actions prompt you for your name and email so every change is attributed. In the real version, Eric accesses the dashboard behind a password and his changes are automatically tracked.
          </p>
          <p>
            The whole pipeline runs in under 10 seconds. What used to take days of manual spreadsheet work now takes one command.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 pt-2">Tech Stack</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="text-gray-500">Data pipeline:</span> Python, pandas</div>
            <div><span className="text-gray-500">PDF parsing:</span> pdftotext + regex</div>
            <div><span className="text-gray-500">HTML parsing:</span> Regex extraction</div>
            <div><span className="text-gray-500">Dashboard:</span> React 19, Vite, TailwindCSS 4</div>
            <div><span className="text-gray-500">Charts:</span> Recharts</div>
            <div><span className="text-gray-500">Icons:</span> Lucide React</div>
            <div><span className="text-gray-500">State:</span> React Context + localStorage</div>
            <div><span className="text-gray-500">Deployment:</span> Netlify</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share This Demo</h3>
        <ShareButtons />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://github.com/meeshmg/transaction-review-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Github size={18} />
            View Source on GitHub
          </a>
          <a
            href="mailto:michelle@bizzib.ai"
            className="flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Mail size={18} />
            michelle@bizzib.ai
          </a>
        </div>
        <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-semibold text-gray-900 mb-3">Interested in a custom solution for your business?</p>
          <div className="flex flex-wrap gap-3">
            <a href="https://bizzib.ai/free-consultation" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">Schedule a Free Consultation</a>
            <a href="https://bizzib.ai/contact" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">Contact Me</a>
            <a href="https://bizzib.ai/about" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">About Me</a>
            <a href="https://bizzib.ai/services" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">Services</a>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          This dashboard uses anonymized sample data. The real version processes live financial data from 11 accounts with a password-protected interface.
        </p>
      </div>
    </div>
  )
}

function WrappedApp() {
  return (
    <IdentityProvider>
      <EditProvider>
        <App />
      </EditProvider>
    </IdentityProvider>
  )
}

export default WrappedApp
