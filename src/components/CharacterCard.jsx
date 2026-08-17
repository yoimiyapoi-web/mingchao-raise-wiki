import { useState } from 'react'
import { Link } from 'react-router-dom'
import Stars from './Stars'
import Chip from './Chip'
import { attributeColor } from '../lib/attributes'

// 角色库卡片:官方立绘 + 星级 + 属性/武器 + 定位标签
export default function CharacterCard({ character, latest }) {
  const [broken, setBroken] = useState(false)
  return (
    <Link
      to={`/character/${character.entryId}`}
      className={`character-card ${latest ? 'is-latest' : ''}`}
      style={{ '--attr': attributeColor(character.attribute) }}
    >
      <div className="character-card-media">
        {broken ? (
          <div className="character-card-fallback">
            <span>{character.name.slice(0, 1)}</span>
          </div>
        ) : (
          <img
            src={character.portrait}
            alt={character.name}
            loading="lazy"
            onError={() => setBroken(true)}
          />
        )}
        <div className="character-card-veil" />
        <span className="character-card-version">{character.version || '—'}</span>
        {character.hasDetail === false && (
          <span className="character-card-pending">资料未发布</span>
        )}
      </div>
      <div className="character-card-body">
        <div className="character-card-title">
          <b>{character.name}</b>
          <Stars star={character.star} />
        </div>
        <div className="character-card-tags">
          <Chip color={attributeColor(character.attribute)} dot>
            {character.attribute || '未知属性'}
          </Chip>
          <Chip>{character.weapon || '未知武器'}</Chip>
        </div>
        {character.roles?.length > 0 && (
          <p className="character-card-roles">{character.roles.join(' · ')}</p>
        )}
      </div>
    </Link>
  )
}
