// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { WhalePet } from '../src/client/pet.tsx'
import { PET_KEY, petMood, petPosition, petPreferences } from '../src/client/pet-state.ts'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })
const state = (running = 0) => ({ masterId: 'main', paused: false, setup: { problem: null },
  load: { running, queued: 0, maxWorkers: 3 }, health: { runtime: { state: 'ready' } } })
it('reflects actual load, setup, pause and connectivity without masking service failures with sleep', () => {
  expect(petMood(state(1), false, false)).toBe('working')
  expect(petMood(state(), false, false)).toBe('idle')
  expect(petMood({ ...state(), paused: true }, false, false)).toBe('waiting')
  expect(petMood({ ...state(), load: { running: 0, queued: 2 } }, false, false)).toBe('waiting')
  expect(petMood(state(), false, true)).toBe('sleeping')
  expect(petMood({ ...state(), health: { runtime: { state: 'error' } } }, false, true)).toBe('alert')
  expect(petMood({ ...state(), setup: { problem: 'missing account' } }, false, false)).toBe('alert')
  expect(petMood(state(1), true, true)).toBe('offline')
})
it('recovers malformed stored preferences and keeps dragged positions reachable after viewport changes', () => {
  expect(petPreferences('{broken')).toEqual(petPreferences(null))
  expect(petPreferences('{"x":"wrong","y":null,"collapsed":true}')).toMatchObject({ x: null, y: null, collapsed: true })
  expect(petPosition(1000, -300, 375, 667)).toEqual({ x: 219, y: 8 })
  expect(petPosition(-100, 2000, 100, 100)).toEqual({ x: 8, y: 8 })
})
it('feeds, sleeps, collapses and restores locally, and opens the existing Session without backend mutations', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => state() } as Response)
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container); const onOpen = vi.fn(async () => {})
  const click = async (name: string) => {
    const button = [...container.querySelectorAll('button')].find(b => b.getAttribute('aria-label')?.includes(name) || b.textContent?.includes(name))
    expect(button, name).toBeDefined()
    await act(async () => { button!.click() })
  }
  try {
    await act(async () => { root.render(<WhalePet onOpen={onOpen} />) })
    await act(async () => { await Promise.resolve() })
    await click('点击互动')
    await click('喂白饭')
    expect(container.textContent).toContain('白饭！')
    await click('休息')
    expect(JSON.parse(localStorage.getItem(PET_KEY)!)).toMatchObject({ sleeping: true })
    expect(container.textContent).toContain('后台任务照常运行')
    await click('打开主会话')
    expect(onOpen).toHaveBeenCalledWith('main')
    await click('点击互动')
    await click('收起伙伴')
    expect(container.querySelector('.whale-character')).toBeNull()
    await click('显示鲸鱼娘')
    expect(container.querySelector('.whale-character')).not.toBeNull()
    expect(fetch.mock.calls.every(([url, options]) => url === '/orchestrator/api/state' && !options?.method)).toBe(true)
  } finally { await act(async () => { root.unmount() }); container.remove() }
})
