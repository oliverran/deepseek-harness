/** Frame-wide companion. All interactions are cosmetic except opening the existing main Session. */
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { usePoll, type StateView } from './api.ts'
import { DEFAULT_PET, PET_KEY, petMood, petPosition, petPreferences, type PetMood } from './pet-state.ts'
import SPRITE from './pet-sprite.png?data'
import STYLE from './pet.css?raw'

const LABEL: Record<PetMood, string> = { idle: '待命摸鱼', working: '努力工作中', waiting: '等待下一步', alert: '有事需要你', sleeping: '休息一下', happy: '忙完一轮啦', offline: '暂时联系不上' }
const LINE: Record<PetMood, string> = { idle: '鱼片，要来一碗白饭吗？有任务就叫我～', working: '我在帮你盯着工单，先去忙你的吧。', waiting: '正在等下一步，去控制台看看吧。', alert: '有配置或运行问题，去控制台看一眼吧。', sleeping: '我眯一会儿，后台任务照常运行哦。', happy: '这轮忙完啦，记得去看看处理结果！', offline: '暂时读不到服务状态，我会再试试。' }
const FRAME: Record<PetMood, string> = { idle: '0px 0px', working: '-148px 0px', waiting: '-148px 0px', alert: '-148px 0px', sleeping: '-148px -148px', happy: '0px -148px', offline: '-148px -148px' }
function readPreferences() {
  try { return petPreferences(localStorage.getItem(PET_KEY)) } catch { return { ...DEFAULT_PET } }
}
async function readState(): Promise<StateView> {
  const response = await fetch('/orchestrator/api/state', { headers: { 'x-orchestrator-request': '1' }, signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('State unavailable')
  return await response.json() as StateView
}
export function WhalePet({ onOpen }: { onOpen: (id: string) => Promise<void> }) {
  const [prefs, setPrefs] = useState(readPreferences)
  const [menu, setMenu] = useState(false)
  const [message, setMessage] = useState('鲸鱼娘报到！点我互动，也可以拖着我换个位置。')
  const [happy, setHappy] = useState(false)
  const { data, error } = usePoll(readState, [], prefs.collapsed ? 30000 : 5000)
  const lastRunning = useRef(0)
  const gesture = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null)
  const blockClick = useRef(false)
  const mood = petMood(data, !!error, prefs.sleeping)
  const shown: PetMood = happy && (mood === 'idle' || mood === 'working') ? 'happy' : mood
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => { try { localStorage.setItem(PET_KEY, JSON.stringify(prefs)) } catch { /* Private mode or quota. */ } }, [prefs])
  useEffect(() => {
    const resize = () => { setSize({ width: window.innerWidth, height: window.innerHeight }) }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  useEffect(() => {
    const running = data?.load.running ?? 0
    if (lastRunning.current > 0 && running === 0 && !error && !prefs.sleeping) {
      setHappy(true); setMessage(LINE.happy)
    }
    lastRunning.current = running
  }, [data, error, prefs.sleeping])
  useEffect(() => { if (message) { const timer = setTimeout(() => setMessage(''), 6500); return () => clearTimeout(timer) } }, [message])
  useEffect(() => { if (happy) { const timer = setTimeout(() => setHappy(false), 3500); return () => clearTimeout(timer) } }, [happy])
  const position = petPosition(prefs.x ?? size.width - 180, prefs.y ?? size.height - 290, size.width, size.height)
  const speak = (text: string) => { setMessage(text); setMenu(true) }
  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    gesture.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y, moved: false }
    blockClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const drag = (event: PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current
    if (!g) return
    if (Math.hypot(event.clientX - g.x, event.clientY - g.y) > 5) g.moved = true
    if (g.moved) {
      blockClick.current = true
      setPrefs(p => ({ ...p, ...petPosition(g.left + event.clientX - g.x, g.top + event.clientY - g.y, size.width, size.height) }))
    }
  }
  const open = async () => {
    if (!data?.masterId) { speak('服务还没准备好，稍后再来找我吧。'); return }
    try { await onOpen(data.masterId); setMenu(false) } catch { speak('暂时无法打开主会话，请从 Superagent 面板进入。') }
  }
  if (prefs.collapsed) return <><style>{STYLE}</style><button className="whale-launcher" type="button" aria-label="显示鲸鱼娘"
    title="显示鲸鱼娘" onClick={() => setPrefs(p => ({ ...p, collapsed: false }))}>🐳</button></>
  return <><style>{STYLE}</style><aside className="whale-pet" style={{ left: position.x, top: position.y }} aria-label="鲸鱼娘虚拟伙伴"
    onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); setMessage('') } }}>
    {message && !menu && <div className="whale-bubble" role="status" style={{ left: Math.max(8, Math.min(position.x - 64, size.width - 232)), top: Math.max(8, position.y - 68) }}>{message}</div>}
    {menu && <div className="whale-menu" role="group" aria-label="鲸鱼娘互动" style={{ left: Math.max(8, Math.min(position.x - 96, size.width - 272)), top: Math.max(8, Math.min(position.y - 290, size.height - 370)) }}>
      <div className="whale-menu-head"><strong>鲸鱼娘</strong><button type="button" aria-label="关闭宠物菜单" onClick={() => setMenu(false)}>×</button></div>
      <p role="status">{message || LINE[mood]}</p>
      <div className="whale-menu-actions">
        <button type="button" onClick={() => { setHappy(true); setMessage('白饭！最喜欢鱼片啦～ 🍚') }}>🍚 喂白饭</button>
        <button type="button" onClick={() => { setPrefs(p => ({ ...p, sleeping: !p.sleeping })); setMessage(prefs.sleeping ? '醒啦，继续陪你工作！' : LINE.sleeping) }}>{prefs.sleeping ? '☀️ 叫醒' : '🌙 休息'}</button>
        <button type="button" onClick={() => { void open() }}>💬 打开主会话</button>
        <button type="button" onClick={() => { setMenu(false); setPrefs(p => ({ ...p, collapsed: true })) }}>↘ 收起伙伴</button>
        <button type="button" onClick={() => { setPrefs(p => ({ ...p, x: null, y: null })); setMenu(false) }}>⌖ 回到右下角</button>
      </div>
      <details className="whale-credit"><summary>形象与素材来源</summary><p>社区鲸鱼娘二创：上善无形「溟月」原型 / ZipZipPipe 女仆设定 / TreapGoGo 参考图。当前精灵由 AI 生成；非官方角色。</p><a href="https://iphsiibl.github.io/deepseek-whale-girl-gallery/" target="_blank" rel="noreferrer">参考图库 · CC BY-NC-SA 4.0</a></details>
    </div>}
    <button className="whale-character" type="button" data-mood={shown} aria-label={`鲸鱼娘：${LABEL[shown]}，点击互动或拖动换位置`}
      onPointerDown={startDrag} onPointerMove={drag} onPointerUp={() => { gesture.current = null }} onPointerCancel={() => { gesture.current = null }}
      onLostPointerCapture={() => { gesture.current = null }} onClick={() => { if (!blockClick.current) { setMenu(v => !v); setMessage(LINE[shown]) } blockClick.current = false }}>
      <span className="whale-sprite" role="img" aria-label="蓝发鲸鱼娘" style={{ backgroundImage: `url(${SPRITE})`, backgroundPosition: FRAME[shown] }} />
      <span className="whale-ground" />
    </button>
    <span className="whale-status" data-mood={shown}><i />{LABEL[shown]}{mood === 'working' && data ? ` · ${data.load.running}` : ''}</span>
  </aside></>
}
