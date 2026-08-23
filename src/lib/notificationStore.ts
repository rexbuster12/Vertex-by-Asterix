export type NotificationType = "connection_received" | "member_joined" | "announcement_posted"

export interface VertexNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  linkUrl?: string
  sourceName?: string
  sourceAvatar?: string
  communityName?: string
}

const NOTIFICATIONS_STORAGE_KEY = "vertex_notifications_v1"

// Listeners for real-time reactivity across components
type NotificationListener = () => void
const listeners: Set<NotificationListener> = new Set()

export function subscribeToNotifications(listener: NotificationListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (e) {
      console.error("Error in notification listener:", e)
    }
  })
}

export function getNotifications(): VertexNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn("Could not load notifications from localStorage", err)
  }
  return []
}

export function saveNotifications(notifications: VertexNotification[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
    notifyListeners()
  } catch (err) {
    console.warn("Could not save notifications to localStorage", err)
  }
}

export function addNotification(payload: {
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  sourceName?: string
  sourceAvatar?: string
  communityName?: string
}): VertexNotification {
  const current = getNotifications()
  const newNotif: VertexNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    timestamp: "Just now",
    read: false,
    linkUrl: payload.linkUrl,
    sourceName: payload.sourceName,
    sourceAvatar: payload.sourceAvatar,
    communityName: payload.communityName,
  }

  const updated = [newNotif, ...current]
  saveNotifications(updated)
  console.log("🔔 [VERTEX NOTIFICATION CREATED]:", newNotif)
  return newNotif
}

export function markAsRead(id: string) {
  const current = getNotifications()
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n))
  saveNotifications(updated)
}

export function markAllAsRead() {
  const current = getNotifications()
  const updated = current.map((n) => ({ ...n, read: true }))
  saveNotifications(updated)
}

export function clearNotifications() {
  saveNotifications([])
}

export function getUnreadNotificationCount(): number {
  const current = getNotifications()
  return current.filter((n) => !n.read).length
}
