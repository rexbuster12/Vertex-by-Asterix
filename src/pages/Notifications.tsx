import { useEffect, useState } from "react"
import { Link } from "react-router"
import {
  Bell,
  Megaphone,
  UserPlus,
  Users,
  CheckCheck,
  Trash2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  subscribeToNotifications,
  mergeRemoteNotifications,
  type VertexNotification,
  type NotificationType,
} from "../lib/notificationStore"
import { syncNotificationsFromDb } from "../lib/supabaseService"
import { getActiveProfile, getActiveUser } from "../lib/tempStore"

function Notifications() {
  const [notifications, setNotifications] = useState<VertexNotification[]>([])
  const [filter, setFilter] = useState<"ALL" | NotificationType>("ALL")

  useEffect(() => {
    setNotifications(getNotifications())
    const unsubscribe = subscribeToNotifications(() => {
      setNotifications(getNotifications())
    })

    async function syncRemoteNotifs() {
      const active = getActiveProfile()
      const user = getActiveUser()
      const targetName = active?.display_name || user?.name || ""
      const targetUser = active?.username || user?.username || ""
      if (targetName || targetUser) {
        try {
          const remoteNotifs = await syncNotificationsFromDb(targetName, targetUser)
          if (remoteNotifs && remoteNotifs.length > 0) {
            mergeRemoteNotifications(remoteNotifs)
          }
        } catch { }
      }
    }

    syncRemoteNotifs()
    const interval = setInterval(syncRemoteNotifs, 3000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true
    return n.type === filter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "announcement_posted":
        return <Megaphone className="w-4 h-4 text-[#d84c23]" />
      case "connection_received":
        return <UserPlus className="w-4 h-4 text-[#2b59ff]" />
      case "member_joined":
        return <Users className="w-4 h-4 text-[#25D366]" />
      default:
        return <Bell className="w-4 h-4 text-[#141c2b]" />
    }
  }

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case "announcement_posted":
        return "COMMUNITY BULLETIN"
      case "connection_received":
        return "CONNECTION"
      case "member_joined":
        return "NEW MEMBER"
      default:
        return "ALERT"
    }
  }

  return (
    <div className="editorial-shell space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-6 sm:p-8 shadow-[5px_5px_0px_#141c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#d84c23] text-white rounded-full">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141c2b] tracking-tight font-serif">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-[#545e6d] max-w-xl">
            Real-time updates on student connections, newly joined members, and community broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/home"
            className="secondary-action font-mono text-xs uppercase flex items-center gap-1.5"
            style={{ padding: "0.55rem 1.1rem" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-[#faf7f2] border-2 border-[#141c2b] rounded-lg p-4 shadow-[4px_4px_0px_#141c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-2 border-[#141c2b] transition-all cursor-pointer ${filter === "ALL"
                ? "bg-[#141c2b] text-white shadow-[2px_2px_0px_#d84c23] -translate-y-0.5"
                : "bg-[#f5f1ea] text-[#141c2b] hover:bg-white hover:-translate-y-0.5 shadow-[2px_2px_0px_#141c2b]"
              }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("announcement_posted")}
            className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-2 border-[#141c2b] transition-all cursor-pointer ${filter === "announcement_posted"
                ? "bg-[#141c2b] text-white shadow-[2px_2px_0px_#d84c23] -translate-y-0.5"
                : "bg-[#f5f1ea] text-[#141c2b] hover:bg-white hover:-translate-y-0.5 shadow-[2px_2px_0px_#141c2b]"
              }`}
          >
            Bulletins
          </button>
          <button
            type="button"
            onClick={() => setFilter("member_joined")}
            className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-2 border-[#141c2b] transition-all cursor-pointer ${filter === "member_joined"
                ? "bg-[#141c2b] text-white shadow-[2px_2px_0px_#d84c23] -translate-y-0.5"
                : "bg-[#f5f1ea] text-[#141c2b] hover:bg-white hover:-translate-y-0.5 shadow-[2px_2px_0px_#141c2b]"
              }`}
          >
            Community Joins
          </button>
          <button
            type="button"
            onClick={() => setFilter("connection_received")}
            className={`font-mono text-xs font-bold uppercase px-3 py-1.5 rounded-xs border-2 border-[#141c2b] transition-all cursor-pointer ${filter === "connection_received"
                ? "bg-[#141c2b] text-white shadow-[2px_2px_0px_#d84c23] -translate-y-0.5"
                : "bg-[#f5f1ea] text-[#141c2b] hover:bg-white hover:-translate-y-0.5 shadow-[2px_2px_0px_#141c2b]"
              }`}
          >
            Connections
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="font-mono text-xs font-bold uppercase text-[#141c2b] bg-[#f5f1ea] hover:bg-white border-2 border-[#141c2b] px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#141c2b] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#141c2b] active:translate-y-0 active:shadow-[1px_1px_0px_#141c2b] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="font-mono text-xs font-bold uppercase text-[#d84c23] bg-[#fbe8e6] hover:bg-[#d84c23] hover:text-white border-2 border-[#d84c23] px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#d84c23] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#d84c23] active:translate-y-0 active:shadow-[1px_1px_0px_#d84c23] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 sm:p-5 rounded-lg border-2 border-[#141c2b] transition-all relative ${item.read
                  ? "bg-[#faf7f2] shadow-[3px_3px_0px_#141c2b] opacity-85"
                  : "bg-white shadow-[4px_4px_0px_#d84c23] border-l-6 border-l-[#d84c23]"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category Icon */}
                  <div className="w-9 h-9 rounded-xs bg-[#f5f1ea] border-2 border-[#141c2b] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#141c2b] mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  {/* Body Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#141c2b] text-white rounded-xs">
                        {getTypeLabel(item.type)}
                      </span>
                      {item.communityName && (
                        <span className="font-mono text-[10px] text-[#545e6d] font-bold">
                          • {item.communityName}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-[#8892a0]">
                        • {item.timestamp}
                      </span>
                      {!item.read && (
                        <span className="font-mono text-[9px] font-bold uppercase text-[#d84c23] bg-[#fbe8e6] px-1.5 py-0.2 rounded-2xs">
                          NEW
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#141c2b]">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#545e6d] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right Action Link */}
                {item.linkUrl && (
                  <Link
                    to={item.linkUrl}
                    className="font-mono text-[11px] font-bold uppercase px-3 py-1.5 bg-[#f5f1ea] hover:bg-[#141c2b] hover:text-white border-2 border-[#141c2b] rounded-xs shadow-[2px_2px_0px_#141c2b] transition-colors flex items-center gap-1.5 flex-shrink-0 self-center cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#faf7f2] border-2 border-dashed border-[#141c2b] rounded-lg p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f5f1ea] border-2 border-[#141c2b] flex items-center justify-center mx-auto text-[#8892a0]">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#141c2b]">
              No notifications yet
            </h3>
            <p className="text-xs text-[#545e6d] max-w-md mx-auto leading-relaxed">
              When people connect with your profile, join your communities, or broadcast announcements, you'll see alerts here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
