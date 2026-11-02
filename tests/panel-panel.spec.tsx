// @vitest-environment jsdom
// Panel search, glossary, route persistence, and host-down fallback.
import { act } from 'react'
import { expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.ts'
import { usePanel, mount, remount, settle, all, click, type, text, field } from './fixtures/panel.tsx'
import { server, found } from './fixtures/panel-server.ts'

usePanel()
it('states why a filtered search result has no Thread instead of opening an empty one', async () => {
  server.search = { items: [found('e9', '2026-09-20T00:00:00Z', { source: 'github', actor: { source: 'github', id: 'someone' },
    preview: 'issue text', threads: ['github:7'],
    filtered: 'source_disabled' })], threads: [] }
  await mount()
  await type(field<HTMLInputElement>(zh.searchLabel), 'issue')
  await act(async () => { field<HTMLInputElement>(zh.searchLabel).closest('form')!.requestSubmit() }); await settle()
  expect(text()).toContain('被来源过滤：来源已停用')
  expect(all('.dt-search-results button').some(button => button.textContent === 'issue text')).toBe(false)
})

it('opens a search result older than the newest page around its Trigger', async () => {
  server.search = { items: [found('e1', '2026-09-20T00:00:00Z')], threads: [] }
  await mount()
  await type(field<HTMLInputElement>(zh.searchLabel), 'message')
  await act(async () => { field<HTMLInputElement>(zh.searchLabel).closest('form')!.requestSubmit() }); await settle()
  expect(text()).toContain('找到 0 个工单、0 个线程、1 条触发')
  await click(all('.dt-search-results button').find(button => button.textContent === 'message e1')!)
  expect(server.requests.some(request => request.path.includes('around=e1'))).toBe(true)
  expect(document.querySelector('.dt-highlight')?.textContent).toContain('message e1')
})

it('explains what can be searched when nothing matches', async () => {
  await mount()
  await type(field<HTMLInputElement>(zh.searchLabel), 'nothing')
  await act(async () => { field<HTMLInputElement>(zh.searchLabel).closest('form')!.requestSubmit() }); await settle()
  expect(text()).toContain('没有找到。可以输入触发文字')
})

it('returns to the exact page after a remount of the main panel', async () => {
  await mount()
  await click('修复回归')
  await remount()
  expect(document.querySelector('.dt-page-title h2')?.textContent).toBe('修复回归')
})

it('shows domain terms in the interface language only and lists both languages in the (?) glossary', async () => {
  await mount(en)
  expect(all('[role="tab"]').map(tab => tab.textContent)).toEqual(['Workspace', 'Tasks', 'Activity', 'Settings'])
  await click('Glossary')
  const dialog = document.querySelector('[role="dialog"]')!
  const row = [...dialog.querySelectorAll('tr')].find(item => item.textContent?.startsWith('Ticket'))!
  expect([...row.querySelectorAll('td')].map(cell => cell.textContent)).toEqual(['Ticket', '工单', 'An authorized unit of work'])
  expect(dialog.textContent).toContain('Accept 接单')
  // Terms are grouped the way the tabs follow the flow, after the roles that act in it.
  expect([...dialog.querySelectorAll('th.dt-glossary-group')].map(cell => cell.textContent)).toEqual(['Roles', 'Source', 'Activity', 'Eval',
    'Tasks'])
  expect([...dialog.querySelectorAll('tr')].find(item => item.textContent?.startsWith('Main Session'))!.textContent).toContain('prompts call it the orchestrator')
})

it('says dsh-superagent is not answering when its routes are gone, as while it restarts', async () => {
  server.down = true
  await mount()
  expect(text()).toContain(zh.hostNotRunning)
  expect(text()).not.toContain('404')
})

it('closes search results on Escape and on a click outside the search', async () => {
  await mount()
  const search = field<HTMLInputElement>(zh.searchLabel)
  const submit = async () => { await type(search,
    'nothing'); await act(async () => { search.closest('form')!.requestSubmit() }); await settle() }
  await submit()
  expect(document.querySelector('.dt-search-results')).not.toBeNull()
  await act(async () => { search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
  expect(document.querySelector('.dt-search-results')).toBeNull()
  await submit()
  await act(async () => { document.querySelector('main')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) })
  expect(document.querySelector('.dt-search-results')).toBeNull()
})

it('shows the answer to the latest search only', async () => {
  server.search = { items: [found('e1', '2026-09-20T00:00:00Z', { preview: 'old message' }), found('e2', '2026-09-21T00:00:00Z',
    { preview: 'new message' })], threads: [] }
  let release = () => {}
  server.searching = async query => { if (query === 'old') await new Promise<void>(resolve => { release = resolve }) }
  await mount()
  const search = field<HTMLInputElement>(zh.searchLabel)
  for (const query of ['old', 'new']) { await type(search,
    query); await act(async () => { search.closest('form')!.requestSubmit() }); await settle() }
  expect(all('.dt-search-results .dt-row-title').map(title => title.textContent)).toEqual(['new message'])
  await act(async () => { release() }); await settle()
  expect(all('.dt-search-results .dt-row-title').map(title => title.textContent)).toEqual(['new message'])
})

it('guides task creation with the configured repository and same-account command, without posting anything', async () => {
  await mount()
  await click(zh.newTask)
  const dialog = document.querySelector('[role="dialog"]')!
  const link = dialog.querySelector<HTMLAnchorElement>('a')!
  const url = new URL(link.href)
  expect(url.origin).toBe('https://github.com')
  expect(url.pathname).toBe('/acme/widgets/issues/new')
  expect(url.searchParams.get('body')).toMatch(/^@\S+ \/task /)
  expect(dialog.textContent).toContain(zh.newTaskFollowup)
  expect(server.requests.filter(request => request.method === 'POST')).toEqual([])
})

it('keeps legacy status routes inside Activity with working navigation and tabpanel labels', async () => {
  sessionStorage.setItem('dsh-superagent/route', JSON.stringify({ route: { page: 'source' }, stack: [] }))
  await mount()
  expect(document.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe('dt-tab-trigger')
  expect(document.querySelector('.dt-record-nav [aria-current="page"]')?.textContent).toBe(zh['records.source'])
  await click(zh['records.eval'])
  expect(document.querySelector('.dt-record-nav [aria-current="page"]')?.textContent).toBe(zh['records.eval'])
  expect(document.querySelector('#dt-tab-trigger')?.getAttribute('aria-selected')).toBe('true')
})

it('keeps full prompts accessible under Advanced and restores that location after remounting', async () => {
  await mount()
  await click(zh['tab.settings'])
  await click(zh['settingsGroup.deployment'])
  await click(zh.advancedPrompts)
  expect(document.querySelector('.dt-settings-link[aria-current="page"]')?.textContent).toBe(zh['settingsGroup.deployment'])
  await remount()
  expect(document.querySelector('.dt-record-nav [aria-current="page"]')?.textContent).toBe(zh.advancedPrompts)
})

it('switches all three palettes immediately, keeps the choice across remounts and leaves agent configuration untouched', async () => {
  await mount()
  await click(zh['tab.settings'])
  await click(zh['settingsGroup.appearance'])
  for (const theme of ['warm', 'dark', 'light'] as const) {
    await click(zh[`theme.${theme}`])
    expect(document.querySelector('.dt-page')?.getAttribute('data-gh-theme')).toBe(theme)
    expect(localStorage.getItem('guang-harness/appearance')).toBe(theme)
    expect(document.querySelector('.gh-theme-option[aria-pressed="true"]')?.textContent).toContain(zh[`theme.${theme}`])
  }
  await click(zh['theme.dark'])
  await remount()
  expect(document.querySelector('.dt-page')?.getAttribute('data-gh-theme')).toBe('dark')
  expect(server.requests.filter(request => request.method === 'PUT' || request.method === 'POST')).toEqual([])
})

it('falls back from an obsolete theme and follows appearance changes from another browser tab', async () => {
  localStorage.setItem('guang-harness/appearance', 'unknown-theme')
  await mount()
  expect(document.querySelector('.dt-page')?.getAttribute('data-gh-theme')).toBe('light')
  await act(async () => {
    localStorage.setItem('guang-harness/appearance', 'warm')
    window.dispatchEvent(new StorageEvent('storage', { key: 'guang-harness/appearance', newValue: 'warm' }))
  })
  expect(document.querySelector('.dt-page')?.getAttribute('data-gh-theme')).toBe('warm')
})

it('supports vertical keyboard navigation and retains the GH brand while opening task details', async () => {
  await mount()
  const nav = document.querySelector<HTMLElement>('.gh-navigation')!
  expect(nav.getAttribute('aria-orientation')).toBe('vertical')
  await act(async () => { nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })) })
  await settle()
  expect(document.querySelector('#dt-tab-execution')?.getAttribute('aria-selected')).toBe('true')
  await click('修复回归')
  expect(document.querySelector('.gh-brand')?.textContent).toContain('guang harness')
  expect(document.querySelector('.dt-page-title h2')?.textContent).toBe('修复回归')
})
