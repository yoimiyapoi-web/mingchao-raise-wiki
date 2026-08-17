export default function SectionTitle({ kicker, title, aside }) {
  return (
    <div className="section-title">
      <div>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2>{title}</h2>
      </div>
      {aside && <div className="section-aside">{aside}</div>}
    </div>
  )
}
