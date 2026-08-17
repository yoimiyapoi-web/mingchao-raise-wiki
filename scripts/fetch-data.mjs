/**
 * 数据抓取脚本:从库街区官方 Wiki 的公开接口拉取角色、武器、素材数据,
 * 解析成站点所需的紧凑 JSON,写入 src/data/ 目录。
 *
 * 用法: npm run refresh-data
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://api.kurobbs.com'
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data')
const CONCURRENCY = 4

const ATTR_NAMES = ['气动', '导电', '冷凝', '热熔', '衍射', '湮灭']
const WEAPON_NAMES = ['长刃', '臂铠', '迅刀', '佩枪', '音感仪']
const ROLE_TAGS = ['主力输出', '快速协奏', '协同攻击', '伤害加深', '解放充能', '生存治疗', '属性效应', '偏谐体系']

// 官方词条里偶发的错别字,归一化以免计算器把同一种材料拆成两行
const NAME_FIX = {
  碑趺古钟钟: '碑趺古钟',
}

const failures = []

/* ---------- 基础请求 ---------- */

async function post(pathname, payload) {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(payload || {})) {
    if (value === undefined || value === null) continue
    body.set(key, String(value))
  }
  const res = await fetch(new URL(pathname, BASE), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      source: 'h5',
      wiki_type: '9',
      devcode: 'wuwa-helper',
    },
    body,
  })
  const json = await res.json()
  if (json.code !== 200) {
    throw new Error(`${pathname} 返回 code=${json.code} ${json.msg || ''}`)
  }
  return json.data
}

async function fetchCatalogue(catalogueId) {
  const data = await post('/wiki/core/catalogue/item/getPage', {
    catalogueId,
    page: 1,
    limit: 1000,
  })
  return data
}

async function fetchDetail(entryId) {
  const data = await post('/wiki/core/catalogue/item/getEntryDetail', { id: entryId })
  return data.content
}

/* ---------- 标签与基础字段 ---------- */

function buildTagMap(tagTree) {
  const map = new Map()
  const stack = Array.isArray(tagTree) ? [...tagTree] : tagTree ? [tagTree] : []
  while (stack.length) {
    const node = stack.pop()
    if (!node) continue
    map.set(String(node.id), node.name)
    for (const child of node.children || []) stack.push(child)
  }
  return map
}

function tagNames(record, tagMap) {
  return (record.content?.relateTagIds || [])
    .map((id) => tagMap.get(String(id)))
    .filter(Boolean)
}

function starOf(tags, fallback) {
  const tagStar = tags.find((t) => /^[1-5]星$/.test(t))
  if (tagStar) return Number(tagStar[0])
  const n = Number(fallback)
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 0
}

function normalizeName(name) {
  const trimmed = String(name || '').trim()
  return NAME_FIX[trimmed] || trimmed
}

/* ---------- HTML 解析 ---------- */

// 从包含 <img> + 名称 + x数量 的 HTML 片段里提取材料列表
function extractItems(html) {
  // split 带捕获组:文本与 src 交替出现,避免链接残留污染字段
  const parts = String(html || '').split(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
  const items = []
  for (let i = 1; i < parts.length; i += 2) {
    const icon = parts[i]
    let text = (parts[i + 1] || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&times;/gi, 'x')
      .replace(/&middot;/g, '·')
      .replace(/\s+/g, ' ')
      .trim()
    const match = text.match(/^(.*?)(?:x\s*(\d+))?$/)
    let name = ''
    let count = 0
    if (match) {
      name = (match[1] || '').trim()
      count = match[2] !== undefined ? Number(match[2]) : 0
      // 名称本身以 x 结尾等异常情况,兜底用整段文本
      if (!name || (count === 0 && !/x\s*0$/.test(text))) {
        name = text.replace(/^x\s*/, '').trim()
      }
    } else {
      name = text
    }
    name = normalizeName(name)
    if (!name) continue
    items.push({ name, icon, count })
  }
  return items
}

function parseAscensionTab(html) {
  // 先去掉标签,因为「所需等级」和数字可能分别位于不同单元格
  const plain = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
  const req = Number((plain.match(/所需等级\s*(\d+)/) || [])[1])
  const cap = Number((plain.match(/等级上限\s*(\d+)/) || [])[1])
  return {
    reqLevel: Number.isFinite(req) ? req : 0,
    capLevel: Number.isFinite(cap) ? cap : 0,
    items: extractItems(html),
  }
}

function isLevelTable(html) {
  return /LV\.\s*\d+/i.test(html)
}

// 技能升级等级表:表头行为 LV.2..LV.10,下一行每个单元格是该等级的整组材料
function parseLevelTable(html) {
  const rows = []
  for (const tr of String(html).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[dh]((?:\s[^>]*)?)>([\s\S]*?)<\/t[dh]>/gi)].map(
      (m) => ({ html: m[2], colspan: Number((m[1].match(/colspan="(\d+)"/) || [])[1] || 1) }),
    )
    rows.push(cells)
  }
  let headerIndex = -1
  let levels = []
  for (let i = 0; i < rows.length; i += 1) {
    const parsed = rows[i].map((c) =>
      Number((c.html.replace(/<[^>]+>/g, '').trim().match(/^LV\.\s*(\d+)$/i) || [])[1]),
    )
    if (parsed.length && parsed.every((n) => Number.isFinite(n))) {
      headerIndex = i
      levels = parsed
      break
    }
  }
  if (headerIndex < 0 || !rows[headerIndex + 1]) return []
  const dataRow = rows[headerIndex + 1]
  return levels.map((level, i) => ({
    level,
    items: dataRow[i] ? extractItems(dataRow[i].html) : [],
  }))
}

// 技能材料 tab:<hr> 分段,单档表 = 分支强化(一次性),等级表 = LV.2..LV.10 逐级消耗
function parseSkillCostTab(html) {
  const sections = String(html || '')
    .split(/<hr\s*\/?>/i)
    .map((s) => s.trim())
    .filter(Boolean)
  const passives = []
  let levels = []
  for (const section of sections) {
    const tables = [...section.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0])
    if (!tables.length) continue
    const gate = (section.match(/([一二三四五六]阶突破)/) || [])[1] || '分支强化'
    for (const table of tables) {
      if (isLevelTable(table)) {
        levels = parseLevelTable(table)
      } else {
        const items = extractItems(table)
        if (items.length) passives.push({ gate, items })
      }
    }
  }
  return { levels, passives }
}

function parseStatsTable(html) {
  const rows = []
  for (const tr of String(html || '').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((m) =>
        m[1]
          .replace(/<img[^>]*>/g, '[图]')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, '')
          .trim(),
      )
      .filter(Boolean)
    if (!cells.length) continue
    const label = cells[0]
    if (/^(基础生命|基础攻击|基础防御|攻击提升)/.test(label)) {
      rows.push({ label, value: cells[1] || '' })
    }
  }
  return rows
}

function parseResonanceChain(html) {
  const out = []
  for (const tr of String(html || '').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((m) =>
        m[1]
          .replace(/<img[^>]*>/g, '[图]')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, '')
          .trim(),
      )
      .filter(Boolean)
    if (cells.length >= 2 && cells[0] !== '名称') {
      out.push({ name: cells[0], effect: cells.slice(1).join(' ') })
    }
  }
  return out
}

/* ---------- 富文本清洗(去危险标签 + 适配深色主题) ---------- */

function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?\/?>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, '$1="#"')
}

// 官方词条内容按浅色背景书写,这里把黑字/白底换成深色主题的对应色,保留其余内联样式
function tuneHtmlForDark(html) {
  return sanitizeHtml(html)
    .replace(/color:\s*rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/gi, 'color: rgb(233, 239, 249)')
    .replace(/color:\s*(#000|black)/gi, 'color: rgb(233, 239, 249)')
    .replace(/background-color:\s*rgb\(\s*247\s*,\s*247\s*,\s*247\s*\)/gi, 'background-color: rgb(17, 26, 46)')
    .replace(/background-color:\s*(#fff|white)/gi, 'background-color: rgb(17, 26, 46)')
    .replace(/border-color:\s*rgb\(\s*241\s*,\s*239\s*,\s*235\s*\)/gi, 'border-color: rgba(125, 170, 255, 0.22)')
}

/* ---------- 记录解析 ---------- */

function parseCharacter(record, tagMap) {
  const c = record.content || {}
  const tags = tagNames(record, tagMap)
  const attribute =
    ATTR_NAMES.find((a) => tags.includes(a)) ||
    ({ 1: '衍射', 2: '气动', 3: '导电', 4: '冷凝', 5: '热熔', 6: '湮灭' }[c.skillAttr] || '')
  const weapon = WEAPON_NAMES.find((w) => tags.includes(w)) || ''
  return {
    id: record.id,
    entryId: String(c.linkConfig?.entryId || record.entryId || ''),
    name: record.name || c.title || '',
    star: starOf(tags, c.star),
    attribute,
    weapon,
    version: tags.find((t) => /^V\d/.test(t)) || '',
    roles: tags.filter((t) => ROLE_TAGS.includes(t)),
    portrait: c.contentUrl || '',
  }
}

function parseWeapon(record, tagMap) {
  const c = record.content || {}
  const tags = tagNames(record, tagMap)
  const type = WEAPON_NAMES.find((w) => tags.includes(w)) || ''
  const mainStat = tags.find((t) => ['攻击', '生命', '防御', '共鸣效率', '暴击率', '暴击伤害'].includes(t)) || ''
  return {
    name: record.name || c.title || '',
    star: starOf(tags, c.star),
    type,
    mainStat,
    icon: c.contentUrl || '',
    entryId: String(c.linkConfig?.entryId || ''),
  }
}

function parseMaterial(record, tagMap, source) {
  const c = record.content || {}
  const tags = tagNames(record, tagMap)
  const category =
    tags.find((t) =>
      ['角色突破素材', '武器突破与技能升级材料', '升级材料', '声骸养成材料', '加工品', '食材', '药材', '印造材料', '特殊代币', '材料'].includes(t),
    ) || '其他'
  const tagRarity = Number(tags.find((t) => /^[1-5]$/.test(t)))
  return {
    name: record.name || c.title || '',
    category,
    rarity: tagRarity || Number(c.star) || 0,
    icon: c.contentUrl || '',
    source,
  }
}

/* ---------- 详情解析 ---------- */

function parseDetail(character, content) {
  const modules = content.modules || []
  const byTitle = (title) => modules.find((m) => m.title === title)
  const componentsOf = (module) => (module ? module.components || [] : [])

  // 基础资料
  const basic = byTitle('基础资料')
  const roleComp = componentsOf(basic).find((c) => c.role)
  const info = {}
  for (const line of roleComp?.role?.info || []) {
    const [key, value] = String(line.text || '').split('：')
    if (key && value) info[key] = value
  }
  const figures = (roleComp?.role?.figures || []).map((f) => ({ url: f.url, name: f.name || '' }))

  // 属性表:按等级分 tab
  const statsComp = componentsOf(basic).find((c) => c.tabs && /^\d+$/.test(c.tabs[0]?.title || ''))
  const stats = (statsComp?.tabs || [])
    .map((tab) => ({ level: tab.title, rows: parseStatsTable(tab.content) }))
    .filter((s) => s.rows.length)

  // 角色养成
  const raise = byTitle('角色养成')
  const raiseComps = componentsOf(raise)
  const ascensionComp = raiseComps.find((c) => c.tabs && /突破/.test(c.tabs[0]?.title || ''))
  const costComp = raiseComps.find((c) => c.tabs && /分支强化材料消耗/.test(c.tabs[0]?.content || ''))
  const chainComp = raiseComps.find((c) => c.title === '共鸣链')
  const skillsComp = raiseComps.find(
    (c) => c.tabs && c !== ascensionComp && c !== costComp && c !== chainComp,
  )

  const skills = (skillsComp?.tabs || []).map((tab) => ({
    branch: tab.title,
    html: tuneHtmlForDark(tab.content),
  }))
  const ascension = (ascensionComp?.tabs || []).map((tab) => ({
    stage: tab.title,
    ...parseAscensionTab(tab.content),
  }))
  const skillCosts = (costComp?.tabs || []).map((tab) => ({
    branch: tab.title,
    ...parseSkillCostTab(tab.content),
  }))
  const resonanceChain = chainComp ? parseResonanceChain(chainComp.content) : []

  // 攻略与档案
  const guideModule = byTitle('角色攻略')
  const guide = guideModule?.components?.[0]?.content ? tuneHtmlForDark(guideModule.components[0].content) : ''
  const profileModule = byTitle('角色档案')
  const profile = []
  for (const comp of componentsOf(profileModule)) {
    if (comp.tabs) {
      for (const tab of comp.tabs) {
        if (tab.content) profile.push({ title: `${comp.title || ''}·${tab.title}`, html: tuneHtmlForDark(tab.content) })
      }
    } else if (comp.content) {
      profile.push({ title: comp.title || '', html: tuneHtmlForDark(comp.content) })
    }
  }

  return {
    entryId: character.entryId,
    name: character.name,
    star: character.star,
    attribute: character.attribute,
    weapon: character.weapon,
    version: character.version,
    roles: character.roles,
    info,
    figures,
    stats,
    skills,
    ascension,
    skillCosts,
    resonanceChain,
    guide,
    profile,
  }
}

/* ---------- 输出 ---------- */

function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data), 'utf8')
}

/* ---------- 主流程 ---------- */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const charDir = path.join(OUT_DIR, 'characters')
  mkdirSync(charDir, { recursive: true })

  console.log('[1/5] 拉取角色列表…')
  const charPage = await fetchCatalogue(1105)
  const charTagMap = buildTagMap(charPage.tagTree)
  const characters = (charPage.results?.records || [])
    .filter((r) => r.content?.linkConfig?.entryId)
    .map((r) => parseCharacter(r, charTagMap))
  console.log(`      共 ${characters.length} 位共鸣者`)

  console.log('[2/5] 拉取角色详情…')
  let queueIndex = 0
  let okCount = 0
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queueIndex < characters.length) {
      const ch = characters[queueIndex]
      queueIndex += 1
      try {
        const content = await fetchDetail(ch.entryId)
        const detail = parseDetail(ch, content)
        ch.hasDetail = detail.ascension.length > 0 || detail.skills.length > 0
        writeJson(path.join(charDir, `${ch.entryId}.json`), detail)
        okCount += 1
      } catch (error) {
        ch.hasDetail = false
        failures.push({ name: ch.name, entryId: ch.entryId, error: String(error?.message || error) })
      }
    }
  })
  await Promise.all(workers)
  console.log(`      成功 ${okCount} / ${characters.length}${failures.length ? `,失败 ${failures.length}` : ''}`)

  console.log('[3/5] 拉取武器…')
  const weaponPage = await fetchCatalogue(1106)
  const weaponTagMap = buildTagMap(weaponPage.tagTree)
  const weapons = (weaponPage.results?.records || [])
    .map((r) => parseWeapon(r, weaponTagMap))
    .filter((w) => w.name && w.icon)

  console.log('[4/5] 拉取素材与资源…')
  const matPage = await fetchCatalogue(1218)
  const matTagMap = buildTagMap(matPage.tagTree)
  const resPage = await fetchCatalogue(1161)
  const resTagMap = buildTagMap(resPage.tagTree)
  const materials = [
    ...(matPage.results?.records || []).map((r) => parseMaterial(r, matTagMap, '素材')),
    ...(resPage.results?.records || []).map((r) => parseMaterial(r, resTagMap, '资源')),
  ].filter((m) => m.name && m.icon)

  console.log('[5/5] 声骸数量与元信息…')
  const echoPage = await fetchCatalogue(1107)
  const echoTotal = echoPage.results?.total || (echoPage.results?.records || []).length

  writeJson(path.join(OUT_DIR, 'characters', 'index.json'), characters)
  writeJson(path.join(OUT_DIR, 'weapons.json'), weapons)
  writeJson(path.join(OUT_DIR, 'materials.json'), materials)
  writeJson(path.join(OUT_DIR, 'meta.json'), {
    fetchedAt: new Date().toISOString(),
    counts: {
      characters: characters.length,
      weapons: weapons.length,
      materials: materials.length,
      echoes: echoTotal,
    },
    failures,
  })

  // 生成按需加载映射(供 Rollup 静态分析分包)
  const loadersPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/detail-loaders.js')
  const loadersLines = [
    '// 本文件由 scripts/fetch-data.mjs 自动生成,请勿手动修改',
    '// 角色详情按需加载:每个条目都是字面量动态导入,便于打包工具分包',
    'export const detailLoaders = {',
    ...characters.map(
      (c) => `  '${c.entryId}': () => import('../data/characters/${c.entryId}.json'),`,
    ),
    '}',
    '',
  ]
  writeFileSync(loadersPath, loadersLines.join('\n'), 'utf8')

  const withDetails = characters.filter((c) => failures.every((f) => f.entryId !== c.entryId))
  const ascStages = withDetails.map((c) => {
    try {
      const d = JSON.parse(requireLocal(path.join(charDir, `${c.entryId}.json`)))
      return { name: c.name, asc: d.ascension?.length || 0, branches: d.skillCosts?.length || 0 }
    } catch {
      return null
    }
  }).filter(Boolean)
  const minAsc = Math.min(...ascStages.map((a) => a.asc))
  const maxAsc = Math.max(...ascStages.map((a) => a.asc))
  const withLevelTables = ascStages.filter((a) => a.branches > 0).length
  console.log(`      突破阶段覆盖: ${minAsc}~${maxAsc} 阶;有技能材料分支的角色: ${withLevelTables}`)
  console.log(`      武器 ${weapons.length},素材+资源 ${materials.length},声骸 ${echoTotal}`)
  console.log('完成,数据已写入 src/data/')
}

// 仅用于统计的小工具:读取本地 JSON 文件
import { readFileSync } from 'node:fs'
function requireLocal(file) {
  return readFileSync(file, 'utf8')
}

main().catch((error) => {
  console.error('抓取失败:', error)
  process.exit(1)
})
