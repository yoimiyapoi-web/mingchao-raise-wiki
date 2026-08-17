// 数值步进器:用于等级选择
export default function Stepper({ label, value, onChange, min, max, step = 1, display }) {
  const disabledMin = value <= min
  const disabledMax = value >= max
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-control">
        <button
          type="button"
          className="stepper-btn"
          disabled={disabledMin}
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`减少${label}`}
        >
          −
        </button>
        <output className="stepper-value">{display ? display(value) : value}</output>
        <button
          type="button"
          className="stepper-btn"
          disabled={disabledMax}
          onClick={() => onChange(Math.min(max, value + step))}
          aria-label={`增加${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
