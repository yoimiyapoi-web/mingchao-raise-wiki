import { useMemo, useState } from 'react'
import CharacterCard from '../components/CharacterCard'
import FilterBar from '../components/FilterBar'
import EmptyState from '../components/EmptyState'
import characters from '../data/characters/index.json'
import { ATTRIBUTES, WEAPONS } from '../lib/attributes'
import { versionRank } from '../lib/format'

const VERSIONS = [...new Set(characters.map((c) => c.version).filter(Boolean))]
  .sort((a, b) => {
    const ra = versionRank(a)
    const rb = versionRank(b)
    return rb[0] - ra[0] || rb[1] - ra[1]
  })

const GROUPS = [
  { key: 'attribute', label: '属性', options: ATTRIBUTES.map((a) => ({ value: a.name, label: a.name, color: a.color })) },
  { key: 'rarity', label: '稀有度', options: [{ value: 5, label: '5 星' }, { value: 4, label: '4 星' }] },
  { key: 'weapon', label: '武器', options: WEAPONS.map((w) => ({ value: w.name, label: w.name })) },
  { key: 'version', label: '版本', options: VERSIONS.map((v) => ({ value: v, label: v })) },
]

export default function Characters() {
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
    return characters
      .filter((c) => {
        if (q && !c.name.toLowerCase().includes(q)) return false
        if (active.attribute?.length && !active.attribute.includes(c.attribute)) return false
        if (active.rarity?.length && !active.rarity.includes(c.star)) return false
        if (active.weapon?.length && !active.weapon.includes(c.weapon)) return false
        if (active.version?.length && !active.version.includes(c.version)) return false
        return true
      })
      .sort((a, b) => b.star - a.star || a.name.localeCompare(b.name, 'zh-Hans-CN'))
  }, [search, active])

  return (
    <div className="page container">
      <div className="page-head">
        <h1>角色库</h1>
        <p>全部共鸣者一览,支持按属性、稀有度、武器与实装版本筛选。</p>
        <p className="meta">数据同步自库街区官方 Wiki,含未实装预告角色</p>
      </div>

      <FilterBar
        groups={GROUPS}
        active={active}
        onToggle={toggle}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="搜索角色名,如「今汐」「忌炎」"
        countText={`共 ${list.length} 位`}
      />

      {list.length ? (
        <div className="card-grid characters-grid fade-up">
          {list.map((c) => (
            <CharacterCard key={c.entryId} character={c} />
          ))}
        </div>
      ) : (
        <EmptyState desc="换个关键词或清除筛选条件试试" />
      )}
    </div>
  )
}
