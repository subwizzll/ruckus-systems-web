const STORAGE_KEY = 'ruckus-service-cta-tones-v1'

const TONE_CLASSES = [
  'service-cta-primary',
  'service-cta-secondary',
  'service-cta-accent-sage',
  'service-cta-accent-terracotta',
  'service-cta-accent-gold',
  'service-cta-accent-teal',
] as const

/** Set for O(1) membership checks; typed as Set<string> so cached (string) values are accepted. */
const TONE_SET: Set<string> = new Set(TONE_CLASSES)

function readCachedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let idx = out.length - 1; idx > 0; idx -= 1) {
    const swapIdx = Math.floor(Math.random() * (idx + 1))
    ;[out[idx], out[swapIdx]] = [out[swapIdx], out[idx]]
  }
  return out
}

/**
 * Applies cached (or newly randomized) CTA tone classes to service links in #services.
 * Persists the mapping in localStorage until cache is cleared.
 */
export function initServiceCtaTones(): void {
  const serviceLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('#services a[data-booking-open][data-service]'),
  )
  if (!serviceLinks.length) return

  const toneClasses = [...TONE_CLASSES]
  const toneByService = readCachedMap()
  const assignedTones = new Set(
    Object.values(toneByService).filter((value) => TONE_SET.has(value)),
  )
  const availableTones = shuffle(toneClasses.filter((tone) => !assignedTones.has(tone)))
  let changed = false

  serviceLinks.forEach((link, idx) => {
    const serviceId = link.getAttribute('data-service')
    if (!serviceId) return

    let toneClass = toneByService[serviceId]
    if (!TONE_SET.has(toneClass)) {
      toneClass = availableTones.shift() ?? toneClasses[idx % toneClasses.length]
      toneByService[serviceId] = toneClass
      changed = true
    }

    link.classList.remove(...toneClasses)
    link.classList.add(toneClass)
  })

  if (!changed) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toneByService))
  } catch {
    // Ignore storage write failures (private mode, disabled storage, etc.)
  }
}

