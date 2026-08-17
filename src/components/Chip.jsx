// 小标签:用于属性、武器、版本等
export default function Chip({ children, color, dot, title }) {
  return (
    <span className="chip" style={color ? { '--chip-color': color } : undefined} title={title}>
      {dot && <i className="chip-dot" />}
      {children}
    </span>
  )
}
