import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Stepper from '../components/Stepper'
import MaterialItem from '../components/MaterialItem'
import Chip from '../components/Chip'
import EmptyState from '../components/EmptyState'
import { loadCharacterDetail } from '../lib/character-data'
import { CHARACTER_LEVELS, computePlan } from '../lib/calculator'
import { formatNumber, buildCopyText } from '../lib/format'
import characters from '../data/characters/index.json'

const STORAGE_KEY = 'mc-wiki-calc-v1'

function defaultPlan(detail) {
  const skills = {}
  for (const branch of detail.skillCosts || []) {
    if (branch.levels?.length) skills[branch.branch] = { current: 1, target: 10 }
  }
  return { charLevel: { current: 1, target: 90 }, skills, includePassives: true }
}

export default function Calculator() {
  const [params] = useSearchParams()
  const queryChar = params.get('c')
  const [entryId, setEntryId] = useState(queryChar || '')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const boxRef = useRef(null)

  const character = characters.find((c) => c.entryId === entryId)

  // 初始化:优先读取本地保存,其次使用查询参数指向的角色
  useEffect(() => {
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    } catch {
      saved = null
    }
    const target = saved?.entryId || queryChar
    if (target && characters.some((c) => c.entryId === target)) {
      setEntryId(target)
    } else {
      setEntryId(characters.find((c) => c.star === 5 && c.entryId)?.entryId || '')
    }
  }, [])

  // 选中角色后加载详情并初始化默认养成计划
  useEffect(() => {
    if (!entryId) {
      setDetail(null)
      setPlan(null)
      return
    }
    let alive = true
    setLoading(true)
    let savedPlan = null
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (raw && raw.entryId === entryId) savedPlan = raw
    } catch {
      savedPlan = null
    }
    loadCharacterDetail(entryId).then((d) => {
      if (!alive || !d) return
      setDetail(d)
      const base = defaultPlan(d)
      setPlan(savedPlan ? { ...base, ...savedPlan } : base)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [entryId])

  // 计划变更时持久化
  useEffect(() => {
    if (!entryId || !plan) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entryId, ...plan }))
    } catch {
      /* 忽略存储失败 */
    }
  }, [entryId, plan])

  // 点击外部关闭角色选择器
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filteredChars = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? characters.filter((c) => c.name.toLowerCase().includes(q)) : characters
    return [...list].sort((a, b) => b.star - a.star).slice(0, 80)
  }, [query])

  const result = useMemo(() => {
    if (!detail || !plan) return null
    return computePlan(detail, plan)
  }, [detail, plan])

  const setCharLevel = (key, value) => {
    setPlan((p) => {
      if (!p) return p
      const charLevel = { ...p.charLevel, [key]: value }
      // 保证目标等级不低于当前等级
      if (charLevel.target <= charLevel.current) {
        const idx = CHARACTER_LEVELS.indexOf(charLevel.current)
        charLevel.target = CHARACTER_LEVELS[Math.min(idx + 1, CHARACTER_LEVELS.length - 1)]
      }
      return { ...p, charLevel }
    })
  }

  const setSkillLevel = (branch, key, value) => {
    setPlan((p) => {
      if (!p) return p
      const skills = { ...p.skills }
      const current = { ...(skills[branch] || { current: 1, target: 10 }) }
      current[key] = value
      if (current.target <= current.current) current.target = Math.min(10, current.current + 1)
      skills[branch] = current
      return { ...p, skills }
    })
  }

  const reset = () => {
    if (detail) setPlan(defaultPlan(detail))
  }

  const copyList = async () => {
    if (!result || !character) return
    const sections = [
      { title: `${character.name} · 角色突破材料`, items: result.ascItems },
      ...result.branchResults.map((b) => ({
        title: `${character.name} · ${b.branch} 技能材料`,
        items: b.items,
      })),
    ]
    const text = buildCopyText(sections)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 剪贴板不可用时静默失败 */
    }
  }

  const levelIndex = (level) => CHARACTER_LEVELS.indexOf(level)

  return (
    <div className="page container">
      <div className="page-head">
        <h1>养成计算器</h1>
        <p>选择角色与目标,自动汇总突破材料、技能升级材料与贝币消耗。</p>
      </div>

      <div className="calc-layout">
        <div className="calc-controls">
          <div className="calc-panel">
            <h2>1 · 选择角色</h2>
            <div className="char-picker" ref={boxRef}>
              <input
                type="text"
                value={query}
                placeholder={character ? character.name : '搜索角色…'}
                onFocus={() => setPickerOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPickerOpen(true)
                }}
              />
              {pickerOpen && (
                <div className="char-picker-list">
                  {filteredChars.map((c) => (
                    <button
                      key={c.entryId}
                      type="button"
                      className={c.entryId === entryId ? 'is-active' : ''}
                      onClick={() => {
                        setEntryId(c.entryId)
                        setPickerOpen(false)
                        setQuery('')
                      }}
                    >
                      <span className="picker-name">{c.name}</span>
                      <span className="picker-star">{c.star} 星</span>
                    </button>
                  ))}
                  {!filteredChars.length && <p className="picker-empty">没有匹配的角色</p>}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="page-loading">加载养成数据…</div>
          ) : !detail ? (
            <EmptyState title="暂无可用的养成数据" />
          ) : !detail.ascension?.length && !detail.skillCosts?.length ? (
            <EmptyState title={`${character?.name}的养成资料尚未发布`} />
          ) : (
            plan && (
              <>
                <div className="calc-panel">
                  <h2>2 · 角色等级</h2>
                  <div className="stepper-row">
                    <Stepper
                      label="当前等级"
                      value={levelIndex(plan.charLevel.current)}
                      min={0}
                      max={CHARACTER_LEVELS.length - 1}
                      onChange={(i) => setCharLevel('current', CHARACTER_LEVELS[i])}
                      display={(i) => `${CHARACTER_LEVELS[i]} 级`}
                    />
                    <span className="stepper-arrow">→</span>
                    <Stepper
                      label="目标等级"
                      value={levelIndex(plan.charLevel.target)}
                      min={0}
                      max={CHARACTER_LEVELS.length - 1}
                      onChange={(i) => setCharLevel('target', CHARACTER_LEVELS[i])}
                      display={(i) => `${CHARACTER_LEVELS[i]} 级`}
                    />
                  </div>
                </div>

                <div className="calc-panel">
                  <h2>3 · 技能等级</h2>
                  <p className="calc-note">每个分支独立设定,默认 1 → 10。</p>
                  <div className="skill-steppers">
                    {detail.skillCosts
                      .filter((b) => b.levels?.length)
                      .map((branch) => {
                        const s = plan.skills[branch.branch] || { current: 1, target: 10 }
                        return (
                          <div className="skill-stepper" key={branch.branch}>
                            <span className="skill-stepper-name">{branch.branch}</span>
                            <div className="skill-stepper-row">
                              <Stepper
                                label="当前"
                                value={s.current}
                                min={1}
                                max={10}
                                onChange={(v) => setSkillLevel(branch.branch, 'current', v)}
                                display={(v) => `Lv.${v}`}
                              />
                              <span className="stepper-arrow">→</span>
                              <Stepper
                                label="目标"
                                value={s.target}
                                min={1}
                                max={10}
                                onChange={(v) => setSkillLevel(branch.branch, 'target', v)}
                                display={(v) => `Lv.${v}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  <label className="calc-check">
                    <input
                      type="checkbox"
                      checked={plan.includePassives}
                      onChange={(e) =>
                        setPlan((p) => (p ? { ...p, includePassives: e.target.checked } : p))
                      }
                    />
                    <span>包含分支强化材料(一次性,按被升级的分支各计一次)</span>
                  </label>
                </div>

                <div className="calc-panel calc-actions">
                  <button type="button" className="btn btn-ghost" onClick={reset}>
                    恢复默认
                  </button>
                  <button type="button" className="btn btn-primary" onClick={copyList} disabled={!result?.totalItems.length}>
                    {copied ? '已复制 ✓' : '复制材料清单'}
                  </button>
                </div>
              </>
            )
          )}
        </div>

        <div className="calc-result">
          {!result ? (
            <div className="calc-result-empty">
              <p>选择角色后,这里会汇总所需材料</p>
            </div>
          ) : (
            <>
              <div className="result-summary">
                <div className="result-summary-main">
                  <span>贝币消耗</span>
                  <b>{formatNumber(result.shellCredits)}</b>
                </div>
                <div className="result-summary-sub">
                  <div>
                    <span>突破阶段</span>
                    <b>{result.ascStages.length} 阶</b>
                  </div>
                  <div>
                    <span>技能分支</span>
                    <b>{result.branchResults.length} 项</b>
                  </div>
                  <div>
                    <span>材料种类</span>
                    <b>{result.materialItems.length} 种</b>
                  </div>
                </div>
              </div>

              <div className="result-section">
                <h3>突破材料</h3>
                <div className="result-stages">
                  {result.ascStages.map((s) => (
                    <Chip key={s.stage} color="var(--gold)">
                      {s.stage}
                    </Chip>
                  ))}
                </div>
                <div className="result-items">
                  {result.ascItems.map((item, i) => (
                    <MaterialItem key={`${item.name}-${i}`} item={item} />
                  ))}
                </div>
              </div>

              {result.branchResults.map((b) => (
                <div className="result-section" key={b.branch}>
                  <h3>
                    {b.branch}
                    <span className="result-levels">
                      Lv.{b.current} → Lv.{b.target}
                    </span>
                  </h3>
                  {b.passiveItems.length > 0 && (
                    <p className="result-passive-note">含分支强化(一次性)</p>
                  )}
                  <div className="result-items">
                    {b.items.map((item, i) => (
                      <MaterialItem key={`${item.name}-${i}`} item={item} />
                    ))}
                  </div>
                </div>
              ))}

              <div className="result-section result-total">
                <h3>材料总览</h3>
                <div className="result-items">
                  {result.materialItems.map((item, i) => (
                    <MaterialItem key={`${item.name}-${i}`} item={item} />
                  ))}
                  {result.shellCredits > 0 && (
                    <MaterialItem
                      item={{ name: '贝币', icon: result.totalItems.find((i) => i.name === '贝币')?.icon, count: result.shellCredits }}
                    />
                  )}
                </div>
                <p className="result-hint">
                  数据来自官方 Wiki 的突破与技能升级表;材料名称以游戏内为准。
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
