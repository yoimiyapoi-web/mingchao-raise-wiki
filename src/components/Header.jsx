import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: '首页', end: true },
  { to: '/characters', label: '角色库' },
  { to: '/calculator', label: '养成计算器' },
  { to: '/weapons', label: '武器' },
  { to: '/materials', label: '素材' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
            <path
              d="M12 40c6-12 14 12 20 0s14-12 20 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="32" cy="26" r="6" fill="var(--gold)" />
          </svg>
          <span className="brand-text">
            <b>鸣潮养成 Wiki</b>
            <i>角色图鉴 · 养成计算</i>
          </span>
        </NavLink>

        <button
          type="button"
          className={`nav-toggle ${open ? 'is-open' : ''}`}
          aria-label="打开导航"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`site-nav ${open ? 'is-open' : ''}`}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
