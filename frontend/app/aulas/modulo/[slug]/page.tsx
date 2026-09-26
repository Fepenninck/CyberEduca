import { TrackModulePage } from '@/app/trilhas/[slug]/page'

export default function AulaModuloPage({ params }: { params: Promise<{ slug: string }> }) {
  return <TrackModulePage params={params} />
}
