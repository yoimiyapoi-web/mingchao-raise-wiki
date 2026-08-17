import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import CharacterCard from '../components/CharacterCard'
import characters from '../data/characters/index.json'
import meta from '../data/meta.json'
import weapons from '../data/weapons.json'
import materials from '../data/materials.json'
import { versionRank, formatNumber } from '../lib/format'

const FEATURES = [
  {
    to: '/characters',
    title: '角色图鉴',
    desc: '按属性、武器、版本筛选全部共鸣者,查看养成详情',
    icon: 'M32 6l26 14-26 14L6 20zM12 26v14c0 6 9 10 20 10s20-4 20-10V26',
  },
  {
    to: '/calculator',
    title: '养成计算器',
    desc: '输入当前与目标等级,自动汇总突破与技能材料',
    icon: 'M8 40h16M16 8v32M40 24h16M48 8v32M24 8h16M8 48h48',
  },
  {
    to: '/weapons',
    title: '武器图鉴',
    desc: '长刃、迅刀、音感仪…按类型与星级快速筛选',
    icon: 'M14 14l36 36M22 10l4 6M34 22l6 4M10 22l6 4M22 34l4 6',
  },
  {
    to: '/materials',
    title: '素材图鉴',
    desc: '突破、技能、升级材料的图标与分类一览',
    icon: 'M32 8v48M8 32h48M16 16c8 8 24 8 32 0M16 48c8-8 24-8 32 0',
  },
]

export default function Home() {
  const newest = [...characters]
    .filter((c) => c.portrait && c.version)
    .sort((a, b) => {
      const ra = versionRank(a.version)
      const rb = versionRank(b.version)
      return rb[0] - ra[0] || rb[1] - ra[1] || b.star - a.star
    })
    .slice(0, 8)
  // 主角位优先推荐资料已发布的角色,避免预告空档
  const featured = newest.find((c) => c.hasDetail) || newest[0]

  const stats = [
    { label: '共鸣者', value: characters.length },
    { label: '武器', value: weapons.length },
    { label: '素材与资源', value: materials.length },
    { label: '声骸', value: meta.counts?.echoes || 0 },
  ]

  return (
    <div className="home">
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy fade-up">
            <h1>
              为漂泊者准备的
              <br />
              <span className="hero-accent">角色养成手册</span>
            </h1>
            <p>
              覆盖当前版本全部共鸣者的图鉴与养成资料。突破材料、技能升级、分支强化,
              一个计算器全部算清;数据同步自库街区官方 Wiki。
            </p>
            <div className="hero-actions">
              <Link to="/characters" className="btn btn-primary">
                浏览角色库
              </Link>
              <Link to="/calculator" className="btn btn-ghost">
                打开养成计算器
              </Link>
            </div>
            <div className="hero-stats">
              {stats.map((s) => (
                <div className="hero-stat" key={s.label}>
                  <b>{formatNumber(s.value)}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {featured && (
            <div className="hero-figure fade-up">
              <div className="hero-figure-frame">
                <img src={featured.portrait} alt={featured.name} />
                <div className="hero-figure-caption">
                  <span>最新角色</span>
                  <b>{featured.name}</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <SectionTitle
            kicker="LATEST"
            title="最新共鸣者"
            aside={<Link to="/characters" className="more-link">查看全部 →</Link>}
          />
          <div className="card-grid">
            {newest.map((c) => (
              <CharacterCard key={c.entryId} character={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-features">
        <div className="container">
          <SectionTitle kicker="FEATURES" title="站点功能" />
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <Link to={f.to} className="feature-tile" key={f.to}>
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d={f.icon} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <b>{f.title}</b>
                <p>{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
