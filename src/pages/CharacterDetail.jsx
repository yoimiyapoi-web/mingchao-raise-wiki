import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Stars from '../components/Stars'
import Chip from '../components/Chip'
import MaterialItem from '../components/MaterialItem'
import RichText from '../components/RichText'
import EmptyState from '../components/EmptyState'
import { loadCharacterDetail } from '../lib/character-data'
import { attributeColor } from '../lib/attributes'
import characters from '../data/characters/index.json'

export default function CharacterDetail() {
  const { id } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ascension')
  const [openSkill, setOpenSkill] = useState(0)

  const character = useMemo(() => characters.find((c) => c.entryId === id), [id])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setDetail(null)
    loadCharacterDetail(id).then((d) => {
      if (!alive) return
      setDetail(d)
      setLoading(false)
      setTab('ascension')
      setOpenSkill(0)
    })
    return () => {
      alive = false
    }
  }, [id])

  const tabs = useMemo(() => {
    if (!detail) return []
    const list = []
    if (detail.ascension?.length) list.push({ key: 'ascension', label: '突破材料' })
    if (detail.skillCosts?.length) list.push({ key: 'skillcost', label: '技能材料' })
    if (detail.skills?.length) list.push({ key: 'skills', label: '技能' })
    if (detail.stats?.length) list.push({ key: 'stats', label: '属性' })
    if (detail.resonanceChain?.length) list.push({ key: 'chain', label: '共鸣链' })
    if (detail.guide) list.push({ key: 'guide', label: '攻略' })
    if (detail.profile?.length) list.push({ key: 'profile', label: '档案' })
    return list
  }, [detail])

  const notPublished = detail && !detail.ascension?.length && !detail.skills?.length
  const mainFigure = detail?.figures?.[0]?.url || character?.portrait

  return (
    <div className="page container">
      <div className="detail-head">
        <Link to="/characters" className="back-link">← 返回角色库</Link>
        {character && (
          <div className="detail-header">
            {mainFigure ? (
              <div className="detail-portrait">
                <img src={mainFigure} alt={character.name} />
              </div>
            ) : null}
            <div className="detail-summary">
              <div className="detail-title">
                <h1>{character.name}</h1>
                <Stars star={character.star} />
              </div>
              <div className="detail-tags">
                <Chip color={attributeColor(character.attribute)} dot>
                  {character.attribute || '未知属性'}
                </Chip>
                <Chip>{character.weapon || '未知武器'}</Chip>
                <Chip color="var(--gold)">{character.version || '—'}</Chip>
              </div>
              {character.roles?.length > 0 && (
                <p className="detail-roles">定位:{character.roles.join(' · ')}</p>
              )}
              {(detail?.info?.性别 || detail?.info?.出生) && (
                <dl className="detail-info">
                  {detail.info.性别 && (
                    <div><dt>性别</dt><dd>{detail.info.性别}</dd></div>
                  )}
                  {detail.info.出生 && (
                    <div><dt>出生</dt><dd>{detail.info.出生.trim()}</dd></div>
                  )}
                </dl>
              )}
              <Link
                to={`/calculator?c=${character.entryId}`}
                className="btn btn-primary detail-cta"
              >
                开始养成计算
              </Link>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="page-loading">加载角色资料…</div>
      ) : notPublished ? (
        <EmptyState
          title={`${character?.name || '该角色'}的养成资料尚未发布`}
          desc="新版本预告角色上线后,运行 npm run refresh-data 即可同步"
        />
      ) : detail && tabs.length ? (
        <>
          <nav className="detail-tabs" aria-label="角色详情分节">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="detail-content fade-up">
            {tab === 'ascension' && (
              <section>
                <h2>突破材料</h2>
                <p className="detail-note">
                  六阶突破所需材料,等级上限从 40 级一路解锁至 90 级。
                </p>
                <div className="ascension-grid">
                  {detail.ascension.map((stage) => (
                    <div className="ascension-card" key={stage.stage}>
                      <div className="ascension-card-head">
                        <b>{stage.stage}</b>
                        <span>
                          {stage.reqLevel} → {stage.capLevel} 级
                        </span>
                      </div>
                      <div className="ascension-items">
                        {stage.items.map((item, i) => (
                          <MaterialItem key={`${item.name}-${i}`} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tab === 'skillcost' && (
              <section>
                <h2>技能升级材料</h2>
                <p className="detail-note">
                  各技能分支从 LV.2 至 LV.10 的逐级消耗;「分支强化」为一次性材料。
                </p>
                {detail.skillCosts.map((branch) => (
                  <div className="skillcost-block" key={branch.branch}>
                    <h3>{branch.branch}</h3>
                    {branch.passives?.length > 0 && (
                      <div className="passive-list">
                        {branch.passives.map((p, i) => (
                          <div className="passive-row" key={`${p.gate}-${i}`}>
                            <Chip color="var(--gold)">{p.gate}</Chip>
                            <span className="passive-label">分支强化</span>
                            <div className="ascension-items">
                              {p.items.map((item, j) => (
                                <MaterialItem key={`${item.name}-${j}`} item={item} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {branch.levels?.length > 0 && (
                      <table className="level-table">
                        <thead>
                          <tr>
                            <th>等级</th>
                            <th>消耗材料</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branch.levels.map((lv) => (
                            <tr key={lv.level}>
                              <td className="level-cell">LV.{lv.level}</td>
                              <td>
                                <div className="ascension-items">
                                  {lv.items.map((item, i) => (
                                    <MaterialItem key={`${item.name}-${i}`} item={item} size="s" />
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </section>
            )}

            {tab === 'skills' && (
              <section>
                <h2>技能说明</h2>
                {detail.skills.map((skill, i) => (
                  <div className="skill-block" key={skill.branch}>
                    <button
                      type="button"
                      className={`skill-block-head ${openSkill === i ? 'is-open' : ''}`}
                      onClick={() => setOpenSkill(openSkill === i ? -1 : i)}
                      aria-expanded={openSkill === i}
                    >
                      <b>{skill.branch}</b>
                      <span>{openSkill === i ? '收起' : '展开'}</span>
                    </button>
                    {openSkill === i && (
                      <div className="skill-block-body">
                        <RichText html={skill.html} />
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {tab === 'stats' && (
              <section>
                <h2>基础属性</h2>
                <div className="stat-scroll">
                  <table className="stat-table">
                    <thead>
                      <tr>
                        <th>属性</th>
                        {detail.stats.map((s) => (
                          <th key={s.level}>{s.level} 级</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...new Set(
                          detail.stats.flatMap((s) => s.rows.map((r) => r.label)),
                        ),
                      ].map((label) => (
                        <tr key={label}>
                          <th>{label}</th>
                          {detail.stats.map((s) => {
                            const row = s.rows.find((r) => r.label === label)
                            return <td key={s.level}>{row ? row.value : '—'}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === 'chain' && (
              <section>
                <h2>共鸣链</h2>
                <table className="chain-table">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>效果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.resonanceChain.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name.replace(/\[图\]\s*/g, '')}</td>
                        <td>{c.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {tab === 'guide' && (
              <section>
                <h2>角色攻略</h2>
                <div className="rich-panel">
                  <RichText html={detail.guide} />
                </div>
              </section>
            )}

            {tab === 'profile' && (
              <section>
                <h2>角色档案</h2>
                {detail.profile.map((p, i) => (
                  <div className="profile-block" key={i}>
                    <h3>{p.title}</h3>
                    <div className="rich-panel">
                      <RichText html={p.html} />
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </>
      ) : (
        <EmptyState title="未找到该角色" desc="请返回角色库重新选择" />
      )}
    </div>
  )
}
