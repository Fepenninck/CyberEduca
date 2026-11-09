import { apiFetch, type TrackSummary } from './api';
export function unlockedLearningCourses(tracks: TrackSummary[]): string[] {
  return tracks.filter(track => !track.bloqueada && track.totalAulas > 0).map(track => track.id);
}
export async function loadLearningAccess(): Promise<string[]> {
  const response = await apiFetch('/trilhas', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível verificar o progresso das trilhas. Entre na sua conta e tente novamente.');
  return unlockedLearningCourses(await response.json());
}
