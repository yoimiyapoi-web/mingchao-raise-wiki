// 角色详情按需加载:映射由数据抓取脚本自动生成
import { detailLoaders } from './detail-loaders.js'

export async function loadCharacterDetail(entryId) {
  const loader = detailLoaders[entryId]
  if (!loader) return null
  try {
    return await loader()
  } catch {
    return null
  }
}
