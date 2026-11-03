/** GUANG application identity, independent of the Superagent panel's name and route. */
import WHALE_LOGO from '../../assets/whale-girl-logo.png?data'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

/** Global application mark shared by the expanded sidebar and collapsed rail. */
export function HarnessBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="guang harness · GH">
    <rect x="1" y="1" width="22" height="22" rx="6" fill="currentColor" opacity=".09" />
    <path d="M10.5 8H7.8C6 8 5 9.5 5 12s1 4 2.8 4h2.7v-4H8M14 8v8M19 8v8M14 12h5"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}
/** Global product wordmark; feature panels retain their own names. */
export function HarnessBrandName() {
  return <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.4px', whiteSpace: 'nowrap' }}>guang harness</span>
}
/**
 * Project the host's product suffix into the customized application name while retaining active session titles.
 * The host has brand slots but no configurable document-title suffix; observe only its title node and restore on disposal.
 */
export function installApplicationTitle(): () => void {
  const existing = document.querySelector('title')
  const node = existing ?? document.head.appendChild(document.createElement('title'))
  const update = () => {
    const title = document.title
    const branded = title ? title.replace(/DeepSeek Harness$/, 'guang harness') : 'guang harness'
    if (branded !== title) document.title = branded
  }
  const observer = new MutationObserver(update)
  observer.observe(node, { childList: true, characterData: true, subtree: true })
  update()
  return () => {
    observer.disconnect()
    if (!existing && node.textContent === 'guang harness') node.remove()
    else if (document.title.endsWith('guang harness')) document.title = document.title.replace(/guang harness$/, 'DeepSeek Harness')
  }
}

/** Existing whale-girl app artwork used only in the New Session hero, without mounting another pet. */
export function WhaleGirlHeroMark({ size, className }: { size: number; className?: string }) {
  return <img src={WHALE_LOGO} alt="鲸鱼娘" className={className} width={size} height={size}
    draggable={false} style={{ display: 'block', objectFit: 'contain', borderRadius: Math.max(6, size / 5) }} />
}
