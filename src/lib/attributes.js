// 六属性与武器类型的展示元数据
export const ATTRIBUTES = [
  { name: '气动', color: 'var(--attr-气动)' },
  { name: '导电', color: 'var(--attr-导电)' },
  { name: '冷凝', color: 'var(--attr-冷凝)' },
  { name: '热熔', color: 'var(--attr-热熔)' },
  { name: '衍射', color: 'var(--attr-衍射)' },
  { name: '湮灭', color: 'var(--attr-湮灭)' },
]

export const WEAPONS = [
  { name: '长刃', color: 'var(--text-2)' },
  { name: '臂铠', color: 'var(--text-2)' },
  { name: '迅刀', color: 'var(--text-2)' },
  { name: '佩枪', color: 'var(--text-2)' },
  { name: '音感仪', color: 'var(--text-2)' },
]

export function attributeColor(name) {
  return ATTRIBUTES.find((a) => a.name === name)?.color || 'var(--text-2)'
}

export function starColor(star) {
  return star >= 5 ? 'var(--gold)' : 'var(--silver)'
}
