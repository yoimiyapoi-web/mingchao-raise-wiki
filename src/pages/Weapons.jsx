import { useMemo, useState } from 'react'
import FilterBar from '../components/FilterBar'
import EmptyState from '../components/EmptyState'
import Stars from '../components/Stars'
import Chip from '../components/Chip'
import weapons from '../data/weapons.json'
import { WEAPONS } from '../lib/attributes'

const STAR_OPTIONS = [5, 4, 3, 2, 1].map((s) => ({ value: s, label: `${s} 星` }))
const GROUPS = [
  { key: 'type', label: '类型', options: WEAPONS.map((w) => ({ value: w.name, label: w.name })) },
  { key: 'star', label: '星级', options: STAR_OPTIONS },
]

export default function Weapons() {
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
    return weapons
      .filter((w) => {
        if (q && !w.name.toLowerCase().includes(q)) return false
        if (active.type?.length && !active.type.includes(w.type)) return false
        if (active.star?.length && !active.star.includes(w.star)) return false
        return true
      })
      .sort((a, b) => b.star - a.star || a.name.localeCompare(b.name, 'zh-Hans-CN'))
  }, [search, active])

  return (
    <div className="page container">
      <div className="page-head">
        <h1>武器图鉴</h1>
        <p>按类型与星级浏览全部武器,图标与资料来自官方 Wiki。</p>
        <p className="meta">共 {weapons.length} 把武器</p>
      </div>

      <FilterBar
        groups={GROUPS}
        active={active}
        onToggle={toggle}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="搜索武器名"
        countText={`共 ${list.length} 把`}
      />

      {list.length ? (
        <div className="icon-grid fade-up">
          {list.map((w, i) => (
            <div className="icon-card" key={`${w.name}-${i}`}>
              <div className="icon-card-media">
                <img src={w.icon} alt={w.name} loading="lazy" />
              </div>
              <div className="icon-card-body">
                <b className="icon-card-name">{w.name}</b>
                <Stars star={w.star} />
                <div className="icon-card-tags">
                  {w.type && <Chip>{w.type}</Chip>}
                  {w.mainStat && <Chip color="var(--gold)">{w.mainStat}</Chip>}
                </div>
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
