import { starColor } from '../lib/attributes'

// 星级展示(4/5 星)
export default function Stars({ star }) {
  if (!star) return null
  return (
    <span className="stars" aria-label={`${star} 星`}>
      {Array.from({ length: star }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" style={{ color: starColor(star) }} aria-hidden="true">
          <path
            d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  )
}
