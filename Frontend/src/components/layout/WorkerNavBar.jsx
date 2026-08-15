import { Moon, Sun, UserRound } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const TITLES = {
  jobs: 'Jobs',
  feed: 'Community Feed',
  history: 'History',
  profile: 'Profile',
}

export default function WorkerNavBar({ userName, userRole, userImage, activeTab, setActiveTab, onSignOut }) {
  const { theme, toggleTheme } = useTheme()

  const tabs = [
    ['jobs', 'Jobs'],
    ['feed', 'Feed'],
    ['history', 'History'],
    ['profile', 'Profile'],
  ]

  return (
    <header className="surface sticky top-0 z-40 flex items-center justify-between border-b px-4 py-4 md:px-10" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        {userImage ? (
          <img src={userImage} alt="" className="h-10 w-10 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full text-muted" style={{ background: 'var(--bg-muted)' }}>
            <UserRound size={16} />
          </div>
        )}
        <div>
          <p className="section-tag">Find Ace</p>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-app md:text-xl">{TITLES[activeTab] || 'Worker'}</h1>
          <p className="text-xs text-muted">
            {userName}
            {userRole ? <span className="capitalize"> · {userRole}</span> : null}
          </p>
        </div>
      </div>

      <nav className="hidden items-center gap-1 sm:flex">
        {tabs.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`nav-item ${activeTab === tab ? 'nav-item-active' : ''}`}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={toggleTheme} className="ml-2 btn-outline" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <button type="button" className="ml-2 nav-item" onClick={onSignOut}>Sign Out</button>
      </nav>

      <div className="flex items-center gap-2 sm:hidden">
        <select
          className="input-field !mt-0 max-w-[120px] py-2 text-xs"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          {tabs.map(([tab, label]) => (
            <option key={tab} value={tab}>{label}</option>
          ))}
        </select>
        <button type="button" onClick={toggleTheme} className="btn-outline p-2" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
        <button type="button" onClick={onSignOut} className="btn-ghost">Out</button>
      </div>
    </header>
  )
}
