import { aggregateItems } from './format.js'

// 角色等级可选项(与官方突破门槛一致;1→20 无需突破材料)
export const CHARACTER_LEVELS = [1, 20, 40, 50, 60, 70, 80, 90]

// 计算需要的突破阶段:门槛等级在 [当前等级, 目标等级) 之间
// 例:40→50 只需要「二阶突破(40)」;50→70 需要「三阶(50)、四阶(60)」
export function neededAscensionStages(ascension, current, target) {
  return (ascension || []).filter(
    (stage) => stage.reqLevel >= current && stage.reqLevel < target,
  )
}

// 单个技能分支:从 current 升到 target 需要的等级档位
// 数据里 level=N 表示升到 N 级的消耗
export function neededSkillLevels(levels, current, target) {
  return (levels || []).filter((lv) => lv.level > current && lv.level <= target)
}

// 汇总某个角色在当前/目标配置下的全部材料
export function computePlan(detail, { charLevel, skills, includePassives }) {
  const ascStages = neededAscensionStages(detail.ascension, charLevel.current, charLevel.target)
  const ascItems = aggregateItems(ascStages.map((s) => s.items))

  const branchResults = []
  for (const branch of detail.skillCosts || []) {
    const plan = skills[branch.branch]
    if (!plan || plan.target <= plan.current) continue
    const steps = neededSkillLevels(branch.levels, plan.current, plan.target)
    if (!steps.length && !includePassives) continue
    const levelItems = aggregateItems(steps.map((s) => s.items))
    const passiveItems = includePassives ? aggregateItems((branch.passives || []).map((p) => p.items)) : []
    branchResults.push({
      branch: branch.branch,
      current: plan.current,
      target: plan.target,
      steps,
      levelItems,
      passiveItems,
      items: aggregateItems([levelItems, passiveItems]),
    })
  }

  const totalItems = aggregateItems([ascItems, ...branchResults.map((b) => b.items)])
  const shellCredits = totalItems.find((i) => i.name === '贝币')?.count || 0
  const materialItems = totalItems.filter((i) => i.name !== '贝币')

  return { ascStages, ascItems, branchResults, totalItems, shellCredits, materialItems }
}
