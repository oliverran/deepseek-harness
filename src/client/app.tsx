/** Root panel shell: header with global search and glossary, top-level navigation tabs, and active route view. */
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useTheme } from './appearance.tsx'
import type { SearchView } from './api.ts'
import { Button, Dot, Icon, Input, Modal, SegmentedTabs } from './controls.tsx'
import type { DeploymentForm } from './deployment.tsx'
import { EvalStatus } from './eval.tsx'
import { ExecutionStatus } from './execution.tsx'
import { ticketMark } from './marks.ts'
import { GLOSSARY, GLOSSARY_VALUES, en, zh, type DshSuperagentKey } from './locales.ts'
import { OverviewPage } from './overview.tsx'
import { PanelProvider, usePanel, usePanelData } from './provider.tsx'
import { HOME, TABS, initialLocation, lastSettingsGroup, remember, routeLabel, settingsRoute, topTab, type Location, type Route,
  type Tab } from './route.ts'
import { SettingsPage } from './settings.tsx'
import { SourceStatus } from './source.tsx'
import { actorName, errorText, reasonLabel, valueLabel, type T, readableMarkers } from './text.ts'
import { ThreadPage } from './thread.tsx'
import { TicketPage } from './ticket.tsx'
import { TriggerStatus } from './trigger.tsx'
import { ActionLink, Hint, When } from './widgets.tsx'

export interface AppProps {
  t: T; openSession: (sessionId: string) => Promise<void>
  deploymentForm: DeploymentForm
}

function Glossary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = usePanel()
  const chinese = t('tab.overview') === zh['tab.overview']
  const [own, other] = chinese ? [zh, en] : [en, zh]
  const heading = (group: keyof typeof GLOSSARY) => t(group === 'roles' ? 'glossaryGroup.roles' : `tab.${group}`)
  return <Modal className="dt-glossary-modal" open={open} onClose={onClose} title={t('glossary')} closeLabel={t('close')}
    description={t('glossaryIntro')} footer={<Button variant="primary" onClick={onClose}>{t('close')}</Button>}>
    <div className="dt-glossary-body">
      <table className="dt-glossary">
        <thead><tr>
          <th>{t(chinese ? 'glossaryChinese' : 'glossaryEnglish')}</th><th>{t(chinese ? 'glossaryEnglish' : 'glossaryChinese')}</th>
          <th>{t('glossaryMeaning')}</th>
        </tr></thead>
        {Object.entries(GLOSSARY).map(([group, keys]) => <tbody key={group}>
          <tr><th colSpan={3} scope="rowgroup" className="dt-glossary-group">{heading(group as keyof typeof GLOSSARY)}</th></tr>
          {keys.map(key => <tr key={key}><td>{own[`term.${key}`]}</td><td>{other[`term.${key}`]}</td><td>{own[`meaning.${key}`]}</td></tr>)}
        </tbody>)}
      </table>
      <p className="dt-legend-title">{t('legendTitle')}</p>
      <ul className="dt-legend">{(['done', 'ongoing', 'warning', 'error', 'idle'] as const).map(state => <li key={state}>
        <Dot state={state} /><span>{t(`legend.${state}`)}</span>
      </li>)}</ul>
      <dl className="dt-values">{Object.entries(GLOSSARY_VALUES).map(([group, values]) => <div key={group} style={{ display: 'contents' }}>
        <dt>{own[`term.${group}` as DshSuperagentKey]}</dt>
        <dd>{values.map(key => `${own[key]} ${other[key]}`).join(' · ')}</dd>
      </div>)}</dl>
    </div>
  </Modal>
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (index < 0) return <>{text}</>
  return <>{text.slice(0, index)}<mark className="dt-mark">{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>
}
function Result({ name, open, children }: { name: ReactNode; open: (() => void) | undefined; children: ReactNode }) {
  return <li className="dt-row dt-link"><div className="dt-row-main">
    <div className="dt-row-title">{open ? <button type="button" className="dt-open" onClick={open}>{name}</button> : name}</div>
    <div className="dt-row-meta">{children}</div>
  </div></li>
}
function SearchResults({ result, query, onClose }: { result: SearchView; query: string; onClose: () => void }) {
  const { t, navigate } = usePanel()
  const { setup } = usePanelData()
  const empty = !result.items.length && !result.threads.length && !result.tickets.length
  const counts = { tickets: result.tickets.length, threads: result.threads.length, items: result.items.length }
  const go = (route: Route) => () => { onClose(); navigate(route) }
  return <div className="dt-search-results" role="region" aria-label={t('searchLabel')}>
    <div className="dt-search-head">
      <span className="dt-hint">{empty ? t(setup?.accounts?.feishu ? 'searchNone' : 'searchNoneGithub')
        : t(result.items.length >= 20 ? 'searchFoundCapped' : 'searchFound', counts)}</span>
      <Button variant="ghost" size="sm" icon={<Icon name="close" size={14} />} aria-label={t('close')} onClick={onClose} />
    </div>
    {!empty && <ul className="dt-list">
      {result.tickets.map(ticket => <Result key={ticket.id} name={<Highlight text={ticket.title} query={query} />}
        open={go({ page: 'execution', id: ticket.id })}>
        <span>{t('term.ticket')}</span><span>{ticket.stage === 'ended' ? t('ticket.ended') : ticketMark(t, ticket).label}</span>
      </Result>)}
      {result.threads.map(thread => <Result key={thread.key} name={readableMarkers(t, thread.title)} open={go({ page: 'trigger',
        id: thread.key })}>
        <span>{t('term.thread')}</span>
      </Result>)}
      {/* Filtered triggers have no Thread and display their filter reason instead of a link. */}
      {result.items.map(item => <Result key={item.id} name={<Highlight text={readableMarkers(t, item.preview) || t('empty')}
        query={query} />}
        open={item.filtered === undefined ? go({ page: 'trigger', id: item.threads[0]!, query: { trigger: item.id } }) : undefined}>
        <span>{valueLabel(t, 'source', item.source)}</span><span>{actorName(t, item.actor)}</span><When at={item.at} />
        {item.threadTitle && <span className="dt-ellipsis">{t('inThread', { thread: readableMarkers(t, item.threadTitle) })}</span>}
        {item.filtered !== undefined && <span>{t('searchFiltered', { reason: reasonLabel(t, item.filtered) })}</span>}
      </Result>)}
    </ul>}
  </div>
}

function Header({ masterId }: { masterId: string | undefined }) {
  const { t, call, openSession, notify } = usePanel()
  const [glossary, setGlossary] = useState(false)
  const [creating, setCreating] = useState(false)
  const { setup } = usePanelData()
  const accounts = setup?.accounts
  const command = accounts ? `@${accounts.agent} /task ` : ''
  const issueUrl = accounts ? `https://github.com/${accounts.repository}/issues/new?${new URLSearchParams({ body: `${command}请描述你希望完成的任务。\n\n验收标准：\n- ` })}` : undefined
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ query: string; value: SearchView }>()
  // Ignore responses from superseded or cleared search requests.
  const latest = useRef(0)
  const show = (value?: { query: string; value: SearchView }) => { latest.current++; setResult(value) }
  const search = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!result) return
    const close = (event: PointerEvent) => { if (!search.current?.contains(event.target as Node)) show() }
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('pointerdown', close) }
  }, [result])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = query.trim()
    if (!text) { show(); return }
    const request = ++latest.current
    call('GET search', { query: { q: text } }).then(value => { if (request === latest.current) setResult({ query: text, value }) },
      failure => { if (request === latest.current) notify(errorText(failure)) })
  }
  return <header className="dt-head">
    <div className="dt-head-title"><span className="gh-mobile-mark" aria-hidden="true">GH</span><h1 className="dt-title">{t('title')}</h1></div>
    <div className="dt-toolbar">
      <form ref={search} className="dt-search" role="search" onSubmit={submit} onKeyDown={event => { if (event.key === 'Escape') show() }}>
        <Input type="search" icon={<Icon name="search" />} value={query} placeholder={t('searchPlaceholder')} aria-label={t('searchLabel')}
          onChange={event => { setQuery(event.target.value); if (!event.target.value) show() }} />
        {result && <SearchResults result={result.value} query={result.query} onClose={() => { show() }} />}
      </form>
      <Button variant="primary" size="sm" onClick={() => setCreating(true)}>{t('newTask')}</Button>
      <Button variant="ghost" size="sm" icon={<Icon name="question" />} aria-label={t('glossary')} title={t('glossary')} aria-haspopup="dialog"
        onClick={() => setGlossary(true)} />
      <Button variant="outline" size="sm" icon={<Icon name="session" size={14} />} disabled={!masterId}
        onClick={() => { if (masterId) openSession(masterId).catch(failure => notify(errorText(failure))) }}>{t('openMaster')}</Button>
    </div>
    <Modal open={creating} onClose={() => setCreating(false)} title={t('newTask')} closeLabel={t('close')}
      description={t('newTaskIntro')} footer={issueUrl ? <ActionLink href={issueUrl}>{t('newTaskGithub')}</ActionLink>
        : <Button onClick={() => setCreating(false)}>{t('close')}</Button>}>
      {accounts ? <><p>{t('newTaskRepository', { repository: accounts.repository })}</p>
        <ol><li>{t('newTaskStep1')}</li><li>{t('newTaskStep2')}</li><li>{t('newTaskStep3')}</li></ol>
        <pre className="dt-code">{command}{t('newTaskExample')}</pre><Hint>{t('newTaskFollowup')}</Hint></>
        : <Hint>{t('newTaskSetup')}</Hint>}
    </Modal>
    <Glossary open={glossary} onClose={() => setGlossary(false)} />
  </header>
}

function Pages({ route, openTab, deploymentForm }: { route: Route; openTab: (tab: Tab) => void; deploymentForm: DeploymentForm }) {
  const { t, navigate } = usePanel()
  const { state, setup, error, reload } = usePanelData()
  const theme = useTheme()
  // Keep the active tab scrolled into view on narrow screens when routes change via links.
  useEffect(() => { document.getElementById(`dt-tab-${topTab(route)}`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }, [route.page])
  const waiting = error ? <p className="dt-error" role="alert">{error.message}</p> : <p className="dt-hint">{t('loading')}</p>
  const page = (() => {
    switch (route.page) {
      case 'overview': return <OverviewPage />
      case 'source': return <SourceStatus />
      case 'trigger': return route.id !== undefined ? <ThreadPage key={route.id} id={route.id} target={route.query?.trigger} />
        : <TriggerStatus filter={route.query?.filter ?? 'all'} />
      case 'eval': return <EvalStatus filter={route.query?.filter ?? 'work'} window={route.query?.window}
        paused={!!state?.paused} />
      case 'execution': return route.id !== undefined ? <TicketPage key={route.id} id={route.id} />
        : state ? <ExecutionStatus filter={route.query?.filter ?? 'open'} state={state} reload={reload} /> : waiting
      case 'settings': return state ? <SettingsPage key={state.masterId} group={route.query.group} query={route.query} state={state}
        deploymentForm={deploymentForm} /> : waiting
    }
  })()
  return <div className="gh-root"><div className="dt-page" data-gh-theme={theme}>
    <aside className="gh-sidebar" aria-label={t('brandNavigation')}>
      <div className="gh-brand"><span className="gh-module-mark" aria-hidden="true"><Icon name="queue" size={22} /></span>
        <div><strong>{t('panel')}</strong><span>GUANG HARNESS</span></div></div>
      <SegmentedTabs className="dt-tabs gh-navigation" label={t('pagesLabel')} value={topTab(route)} onChange={openTab}
        orientation="vertical"
        items={TABS.map(value => ({ value, label: t(`tab.${value}`), icon: <Icon name={value === 'overview' ? 'inbox'
          : value === 'execution' ? 'queue' : value === 'trigger' ? 'message' : 'settings'} />, id: `dt-tab-${value}`, panelId: 'dt-page' }))} />
      <div className="gh-sidebar-project"><span>{t('workspaceRepository')}</span>
        <strong>{setup?.accounts?.repository ?? t('empty')}</strong>
        <button type="button" className="dt-textlink" onClick={() => navigate({ page: 'source' })}>{t('workspaceConnection')}</button></div>
      <div className="gh-sidebar-footer"><span className="gh-account-mark" aria-hidden="true">{(setup?.accounts?.agent ?? 'G')[0]?.toUpperCase()}</span>
        <div><strong>{setup?.accounts?.agent ?? 'Superagent'}</strong><span>{t(error ? 'connectionOffline' : state ? 'connectionOnline' : 'loading')}</span></div>
        <button type="button" className="gh-appearance-shortcut" aria-label={t('appearanceTitle')}
          onClick={() => navigate(settingsRoute('appearance'))}><Icon name="settings" size={17} /></button></div>
    </aside>
    <div className="dt-column">
      <Header masterId={state?.masterId} />
      {error && state && <p className="dt-error" role="status">{error.message}</p>}
      <main id="dt-page" role="tabpanel" aria-labelledby={`dt-tab-${topTab(route)}`} className="dt-main">
        {topTab(route) === 'trigger' && !route.id && <nav className="dt-record-nav" aria-label={t('recordsViews')}>
          {(['trigger', 'eval', 'source'] as const).map(value => <button key={value} type="button"
            aria-current={route.page === value ? 'page' : undefined} onClick={() => navigate(value === 'source' ? { page: 'source' } : value === 'eval' ? { page: 'eval' } : { page: 'trigger' }, true)}>
            {t(`records.${value}`)}</button>)}
        </nav>}
        {page}</main>
    </div>
  </div></div>
}

/** Root panel component managing route history and shared panel state. */
export function App({ t, openSession, deploymentForm }: AppProps) {
  const [location, setLocation] = useState(initialLocation)
  useEffect(() => { remember(location) }, [location])
  // Preserve the last opened settings group across navigation so the Settings tab reopens at it.
  const move = useCallback((next: (current: Location) => Pick<Location, 'route' | 'stack'>) =>
    setLocation(current => ({ ...next(current), group: lastSettingsGroup(current) })), [])
  /** Navigates to `route`; `replace` swaps the current entry (filters, paging) instead of pushing a back step. */
  const navigate = useCallback((route: Route, replace = false) => move(current => ({ route,
    stack: replace ? current.stack : [...current.stack, current.route].slice(-20) })), [move])
  const back = useCallback(() => move(current => ({ route: current.stack.at(-1) ?? HOME, stack: current.stack.slice(0, -1) })), [move])
  const openTab = useCallback((tab: Tab) => move(current => ({ stack: [], route: tab === 'settings'
    ? settingsRoute(lastSettingsGroup(current)) : { page: tab, id: undefined } })), [move])
  return <PanelProvider t={t} openSession={openSession} navigate={navigate} back={back} backLabel={routeLabel(t, location.stack.at(-1) ?? HOME)}>
    <Pages route={location.route} openTab={openTab} deploymentForm={deploymentForm} />
  </PanelProvider>
}
