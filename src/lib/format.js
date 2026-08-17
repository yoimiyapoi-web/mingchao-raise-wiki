// 材料聚合:把多组材料列表按名称合并数量
export function aggregateItems(itemLists) {
  const map = new Map()
  for (const list of itemLists) {
    for (const item of list || []) {
      const key = item.name
      const cur = map.get(key) || { name: item.name, icon: item.icon, count: 0 }
      cur.count += item.count
      map.set(key, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

// 版本号比较:V3.6 > V3.5 > V1.4
export function versionRank(version) {
  const m = String(version || '').match(/V(\d+)\.(\d+)/i)
  if (!m) return [0, 0]
  return [Number(m[1]), Number(m[2])]
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('zh-CN')
}

// 生成计算器结果的纯文本清单,便于复制
export function buildCopyText(sections) {
  const lines = []
  for (const section of sections) {
    if (!section.items.length) continue
    lines.push(`【${section.title}】`)
    for (const item of section.items) {
      lines.push(`  ${item.name} x${item.count}`)
    }
  }
  return lines.join('\n')
}
