/** Pure pet state and viewport-safe preferences; these never mutate agent state. */
export type PetMood = 'idle' | 'working' | 'waiting' | 'alert' | 'sleeping' | 'happy' | 'offline'
export interface PetPreferences { collapsed: boolean; sleeping: boolean; x: number | null; y: number | null }
export const PET_KEY = 'dsh.whale-pet.v1'
export const DEFAULT_PET: PetPreferences = { collapsed: false, sleeping: false, x: null, y: null }
export function petPreferences(raw: string | null): PetPreferences {
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<PetPreferences> | null
    return { collapsed: v?.collapsed === true, sleeping: v?.sleeping === true,
      x: typeof v?.x === 'number' && Number.isFinite(v.x) ? v.x : null,
      y: typeof v?.y === 'number' && Number.isFinite(v.y) ? v.y : null }
  } catch { return { ...DEFAULT_PET } }
}
export function petPosition(x: number, y: number, width: number, height: number) {
  return { x: Math.max(8, Math.min(x, width - 156)), y: Math.max(8, Math.min(y, height - 206)) }
}
export function petMood(state: { paused: boolean; setup?: { problem: unknown }; load: { running: number; queued: number };
  health: Record<string, { state: string }> } | undefined, offline: boolean, sleeping: boolean): PetMood {
  if (offline) return 'offline'
  if (!state) return 'idle'
  if (state.setup?.problem || Object.values(state.health).some(h => h.state === 'error')) return 'alert'
  if (sleeping) return 'sleeping'
  if (state.paused) return 'waiting'
  return state.load.running > 0 ? 'working' : state.load.queued > 0 ? 'waiting' : 'idle'
}
