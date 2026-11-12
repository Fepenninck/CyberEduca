import type { CSSProperties, ReactNode } from 'react'
import { UserRound } from 'lucide-react'
import './cyber-avatar.css'

export type AvatarId = 'escudo' | 'cadeado' | 'chave' | 'digital' | 'terminal' | 'radar' | 'firewall' | 'bug'

type AvatarInfo = { id: AvatarId; nome: string; descricao: string; cor: string; desenho: ReactNode }

export const AVATARES: AvatarInfo[] = [
  {
    id: 'escudo',
    nome: 'Guardião',
    descricao: 'Protege a rede antes do ataque chegar.',
    cor: '#b2ff00',
    desenho: <><path d="M32 12 48 18v13c0 10-7 17-16 21-9-4-16-11-16-21V18Z" /><path d="m25 32 5 5 9-10" /></>,
  },
  {
    id: 'cadeado',
    nome: 'Cofre',
    descricao: 'Senhas fortes e dados bem guardados.',
    cor: '#24b4ff',
    desenho: <><rect x="19" y="29" width="26" height="19" rx="3" /><path d="M25 29v-6a7 7 0 0 1 14 0v6" /><path d="M32 36v5" /></>,
  },
  {
    id: 'chave',
    nome: 'Chave-mestra',
    descricao: 'Autenticação em dois fatores sempre ligada.',
    cor: '#ffd34e',
    desenho: <><circle cx="23" cy="32" r="8" /><path d="M31 32h19M44 32v6M50 32v5" /></>,
  },
  {
    id: 'digital',
    nome: 'Identidade',
    descricao: 'Sabe que a identidade digital é única.',
    cor: '#c28cf5',
    desenho: <><path d="M21 40c-2-10 3-20 11-20s13 7 12 16" /><path d="M26 45c-2-8-1-18 6-18s7 7 6 13" /><path d="M32 33c1 5 0 10-2 14" /><path d="M43 42c-1 3-2 5-4 7" /></>,
  },
  {
    id: 'terminal',
    nome: 'Terminal',
    descricao: 'Resolve tudo pela linha de comando.',
    cor: '#b2ff00',
    desenho: <><rect x="14" y="18" width="36" height="28" rx="3" /><path d="m21 28 6 5-6 5M31 38h11" /></>,
  },
  {
    id: 'radar',
    nome: 'Radar',
    descricao: 'Detecta phishing de longe.',
    cor: '#24b4ff',
    desenho: <><circle cx="32" cy="32" r="18" /><circle cx="32" cy="32" r="10" /><path d="m32 32 12-12" /><circle className="cyber-avatar-fill" cx="40" cy="27" r="2.4" /></>,
  },
  {
    id: 'firewall',
    nome: 'Firewall',
    descricao: 'Bloqueia o que não deveria entrar.',
    cor: '#ff4654',
    desenho: <><rect x="14" y="20" width="36" height="26" rx="2" /><path d="M14 29h36M14 37h36M26 20v9M38 20v9M20 29v8M32 29v8M44 29v8M26 37v9M38 37v9" /></>,
  },
  {
    id: 'bug',
    nome: 'Caçador de bugs',
    descricao: 'Encontra a falha antes de qualquer um.',
    cor: '#ffd34e',
    desenho: <><ellipse cx="32" cy="37" rx="9" ry="11" /><circle cx="32" cy="22" r="5" /><path d="M32 28v20M23 33l-7-3M23 40h-8M24 46l-6 4M41 33l7-3M41 40h8M40 46l6 4M29 18l-3-4M35 18l3-4" /></>,
  },
]

export function isAvatarId(valor: unknown): valor is AvatarId {
  return AVATARES.some((avatar) => avatar.id === valor)
}

export function CyberAvatar({ id, title }: { id: AvatarId; title?: string }) {
  const avatar = AVATARES.find((item) => item.id === id) ?? AVATARES[0]
  return (
    <svg className="cyber-avatar" viewBox="0 0 64 64" style={{ '--avatar-color': avatar.cor } as CSSProperties} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle className="cyber-avatar-bg" cx="32" cy="32" r="31" />
      <g className="cyber-avatar-dots">
        {[13, 19, 25].map((y) => [14, 20, 26].map((x) => <circle key={`${x}-${y}`} cx={x + (y === 19 ? 3 : 0)} cy={y} r="1.1" />))}
      </g>
      <g className="cyber-avatar-glyph" transform="translate(4.8 4.8) scale(.85)">{avatar.desenho}</g>
    </svg>
  )
}

export function ProfilePicture({ foto, avatar, iconSize = 18, alt = 'Foto de perfil' }: { foto?: string | null; avatar?: string | null; iconSize?: number; alt?: string }) {
  if (foto) return <img src={foto} alt={alt} />
  if (isAvatarId(avatar)) return <CyberAvatar id={avatar} title={alt} />
  return <UserRound size={iconSize} />
}
