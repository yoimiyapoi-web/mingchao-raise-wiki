import { useMemo, useState } from 'react'
import FilterBar from '../components/FilterBar'
import EmptyState from '../components/EmptyState'
import materials from '../data/materials.json'

const CATEGORY_ORDER = [
  '角色突破素材',
  '武器突破与技能升级材料',
  '升级材料',
  '声骸养成材料',
  '印造材料',
  '加工品',
  '食材',
  '药材',
  '特殊代币',
  '材料',
  '其他',
]
const CATEGORIES = [...new Set(materials.map((m) => m.category))].sort(
  (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
)

const GROUPS = [
  { key: 'category', label: '分类', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
  { key: 'rarity', label: '稀有度', options: [5, 4, 3, 2, 1].map((s) => ({ value: s, label: String(s) })) },
]

export default function Materials() {
  const [search, setSearch] = useState('')
  const [active, setActive] = useState({})
  const toggle = (key, value) => {
    setActive((prev) => {
      const list = prev[key] || []
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...prev, [key]: next }
    })
  }

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return materials
      .filter((m) => {
        if (q && !m.name.toLowerCase().includes(q)) return false
        if (active.category?.length && !active.category.includes(m.category)) return false
        if (active.rarity?.length && !active.rarity.includes(m.rarity)) return false
        return true
      })
      .sort((a, b) => {
        const ca = CATEGORY_ORDER.indexOf(a.category)
        const cb = CATEGORY_ORDER.indexOf(b.category)
        return ca - cb || b.rarity - a.rarity || a.name.localeCompare(b.name, 'zh-Hans-CN')
      })
  }, [search, active])

  return (
    <div className="page container">
      <div className="page-head">
        <h1>素材图鉴</h1>
        <p>角色突破、武器突破与技能升级等各类素材的图标与分类一览。</p>
        <p className="meta">共 {materials.length} 种素材与资源(含素材与资源两类目录)</p>
      </div>

      <FilterBar
        groups={GROUPS}
        active={active}
        onToggle={toggle}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="搜索素材名,如「贝币」「啸叫声核」"
        countText={`共 ${list.length} 种`}
      />

      {list.length ? (
        <div className="icon-grid fade-up">
          {list.map((m, i) => (
            <div className="icon-card" key={`${m.name}-${i}`}>
              <div className="icon-card-media">
                <img src={m.icon} alt={m.name} loading="lazy" />
                {m.rarity > 0 && <span className="icon-card-rarity">{m.rarity}</span>}
              </div>
              <div className="icon-card-body">
                <b className="icon-card-name">{m.name}</b>
                <span className="icon-card-category">{m.category}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState desc="换个关键词或清除筛选条件试试" />
      )}
    </div>
  )
}
