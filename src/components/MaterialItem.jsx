// 单个材料:图标 + 名称 + 数量
export default function MaterialItem({ item, size = 'm' }) {
  return (
    <span className={`material-item ${size === 's' ? 'is-small' : ''}`}>
      <img src={item.icon} alt={item.name} loading="lazy" />
      <span className="material-name">{item.name}</span>
      <b className="material-count">×{item.count}</b>
    </span>
  )
}
