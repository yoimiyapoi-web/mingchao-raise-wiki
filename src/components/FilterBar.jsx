import { useState } from 'react'

// 筛选条:搜索 + 多组多选标签
export default function FilterBar({
  groups,
  active,
  onToggle,
  search,
  onSearch,
  searchPlaceholder,
  countText,
}) {
  const [query, setQuery] = useState(search || '')
  return (
    <div className="filter-bar">
      <div className="filter-search-row">
        <label className="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(e) => {
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
          />
        </label>
        {countText && <span className="filter-count">{countText}</span>}
      </div>
      {groups.map((group) => (
        <div className="filter-group" key={group.key}>
          <span className="filter-label">{group.label}</span>
          <div className="filter-options">
            {group.options.map((opt) => {
              const selected = (active[group.key] || []).includes(opt.value)
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`filter-option ${selected ? 'is-active' : ''}`}
                  style={opt.color ? { '--opt-color': opt.color } : undefined}
                  onClick={() => onToggle(group.key, opt.value)}
                >
                  {opt.color && <i className="filter-option-dot" />}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
