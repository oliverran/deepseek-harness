/** Local appearance preferences shared by panels and browser tabs, independent of task configuration. */
import { useSyncExternalStore } from 'react'
import { usePanel } from './provider.tsx'

export const THEMES = ['light', 'warm', 'dark'] as const
export type Theme = typeof THEMES[number]
const KEY = 'guang-harness/appearance'
const EVENT = 'guang-harness:appearance'
let unsaved: Theme | undefined
/** Read a supported theme; unavailable or stale browser storage falls back to the light palette. */
export function readTheme(): Theme {
  if (unsaved) return unsaved
  try { return THEMES.find(value => value === localStorage.getItem(KEY)) ?? 'light' }
  catch (error) { void error; return 'light' /* Appearance remains usable when browser storage is disabled. */ }
}
/** Save a local preference and notify mounted panels without changing agent settings or restarting work. */
export function setTheme(theme: Theme): void {
  try { localStorage.setItem(KEY, theme); unsaved = undefined }
  catch (error) { void error; unsaved = theme /* Keep the user's choice for this process when persistence is unavailable. */ }
  window.dispatchEvent(new Event(EVENT))
}
function subscribe(onChange: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) { unsaved = undefined; onChange() } }
  window.addEventListener(EVENT, onChange); window.addEventListener('storage', storage)
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener('storage', storage) }
}
/** Subscribe to local and cross-tab changes using stable primitive snapshots. */
export const useTheme = (): Theme => useSyncExternalStore(subscribe, readTheme, () => 'light')
/** Apply the selected palette to the host shell and portal dialogs; restore the prior attribute on plugin disposal. */
export function installTheme(): () => void {
  const root = document.documentElement
  const previous = root.getAttribute('data-gh-theme')
  const update = () => root.setAttribute('data-gh-theme', readTheme())
  update()
  const dispose = subscribe(update)
  return () => { dispose(); if (previous === null) root.removeAttribute('data-gh-theme'); else root.setAttribute('data-gh-theme', previous) }
}
/** Live theme chooser; choices are device-local and never issue configuration API writes. */
export function AppearanceSettings() {
  const { t } = usePanel()
  const theme = useTheme()
  return <section className="gh-appearance" aria-label={t('appearanceTitle')}>
    <p className="dt-hint">{t('appearanceIntro')}</p>
    <div className="gh-theme-options" role="group" aria-label={t('appearanceTitle')}>
      {THEMES.map(value => <button key={value} type="button" className="gh-theme-option" aria-label={t(`theme.${value}`)} aria-pressed={theme === value}
        onClick={() => setTheme(value)}>
        <span className="gh-theme-preview" data-palette={value} aria-hidden="true"><i /><span><b /><em /><em /><em /></span></span>
        <span className="gh-theme-name">{t(`theme.${value}`)}<span aria-hidden="true">{theme === value ? '✓' : ''}</span></span>
        <span className="gh-theme-description">{t(`themeHelp.${value}`)}</span>
      </button>)}
    </div>
    <p className="dt-hint" role="status">{t('appearanceCurrent', { theme: t(`theme.${theme}`) })}</p>
    <div className="gh-series-note"><span className="gh-monogram" aria-hidden="true">GH</span><div><strong>guang harness</strong>
      <p>{t('seriesDescription')}</p><a href="https://github.com/oliverran/guang-code" target="_blank" rel="noopener noreferrer">guangcode ↗</a></div></div>
  </section>
}
