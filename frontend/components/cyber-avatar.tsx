import { UserRound } from 'lucide-react'
import './cyber-avatar.css'

export type AvatarId = 'escudo' | 'cadeado' | 'chave' | 'digital' | 'terminal' | 'radar' | 'firewall' | 'bug'

type AvatarInfo = { id: AvatarId; nome: string; descricao: string; cor: string; imagem: string }

export const AVATARES: AvatarInfo[] = [
  {
    id: 'escudo',
    nome: 'Guardião',
    descricao: 'Protege a rede antes do ataque chegar.',
    cor: '#b2ff00',
    imagem: '/images/avatares/escudo.webp',
  },
  {
    id: 'cadeado',
    nome: 'Cofre',
    descricao: 'Senhas fortes e dados bem guardados.',
    cor: '#24b4ff',
    imagem: '/images/avatares/cadeado.webp',
  },
  {
    id: 'chave',
    nome: 'Chave-mestra',
    descricao: 'Autenticação em dois fatores sempre ligada.',
    cor: '#ffd34e',
    imagem: '/images/avatares/chave.webp',
  },
  {
    id: 'digital',
    nome: 'Identidade',
    descricao: 'Sabe que a identidade digital é única.',
    cor: '#c28cf5',
    imagem: '/images/avatares/digital.webp',
  },
  {
    id: 'terminal',
    nome: 'Terminal',
    descricao: 'Resolve tudo pela linha de comando.',
    cor: '#b2ff00',
    imagem: '/images/avatares/terminal.webp',
  },
  {
    id: 'radar',
    nome: 'Radar',
    descricao: 'Detecta phishing de longe.',
    cor: '#24b4ff',
    imagem: '/images/avatares/radar.webp',
  },
  {
    id: 'firewall',
    nome: 'Firewall',
    descricao: 'Bloqueia o que não deveria entrar.',
    cor: '#ff4654',
    imagem: '/images/avatares/firewall.webp',
  },
  {
    id: 'bug',
    nome: 'Caçador de bugs',
    descricao: 'Encontra a falha antes de qualquer um.',
    cor: '#ffd34e',
    imagem: '/images/avatares/bug.webp',
  },
]

export function isAvatarId(valor: unknown): valor is AvatarId {
  return AVATARES.some((avatar) => avatar.id === valor)
}

export function CyberAvatar({ id, title }: { id: AvatarId; title?: string }) {
  const avatar = AVATARES.find((item) => item.id === id) ?? AVATARES[0]
  return <img className="cyber-avatar" src={avatar.imagem} alt={title ?? ''} width={256} height={256} decoding="async" draggable={false} />
}

export function ProfilePicture({ foto, avatar, iconSize = 18, alt = 'Foto de perfil' }: { foto?: string | null; avatar?: string | null; iconSize?: number; alt?: string }) {
  if (foto) return <img src={foto} alt={alt} />
  if (isAvatarId(avatar)) return <CyberAvatar id={avatar} title={alt} />
  return <UserRound size={iconSize} />
}
