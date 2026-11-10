'use client'

import { useState } from 'react'

type Founder = { name: string; fullName: string; photo: string; bio: string }

export function FounderCard({ founder }: { founder: Founder }) {
  const [flipped, setFlipped] = useState(false)

  return <button
    type="button"
    className={`about-founder${flipped ? ' is-flipped' : ''}`}
    aria-label={`${founder.name}, cofundador e criador. Virar cartão`}
    aria-pressed={flipped}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setFlipped(true) }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') setFlipped(false) }}
    onPointerDown={event => { if (event.pointerType === 'touch') event.preventDefault() }}
    onPointerUp={event => { if (event.pointerType === 'touch') setFlipped(value => !value) }}
    onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setFlipped(true) }}
    onBlur={() => setFlipped(false)}
    onClick={event => { if (event.detail === 0) setFlipped(value => !value) }}
    onKeyDown={event => { if (event.key === 'Escape') setFlipped(false) }}
  >
    <span className="about-founder-turn">
      <span className="about-founder-face about-founder-front" aria-hidden={flipped}>
        <img src={founder.photo} alt="" width={1024} height={1536} loading="lazy" />
        <span className="about-founder-caption"><strong>{founder.name}</strong><span>Cofundador & criador</span></span>
      </span>
      <span className="about-founder-face about-founder-back" aria-hidden={!flipped}>
        <span className="about-founder-caption"><strong>{founder.name}</strong><span>Cofundador & criador</span><span className="about-founder-bio">{founder.bio}</span></span>
      </span>
    </span>
  </button>
}
