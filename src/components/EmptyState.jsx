export default function EmptyState({ title = '没有找到匹配的内容', desc }) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M20 42c4-8 8 8 12 0s8-8 12 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p>{title}</p>
      {desc && <span>{desc}</span>}
    </div>
  )
}
