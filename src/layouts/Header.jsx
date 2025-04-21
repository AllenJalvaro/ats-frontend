import { useState, useEffect, use } from "react"
import { FaBars } from "react-icons/fa"
import { FaBell } from "react-icons/fa6";
import api from "../api/axios"

export default function Header({ onSelectView, onToggleSidebar, onToggleATSHealthcheck, selectedView }) {
  const [currentView, setCurrentView] = useState("applicants")
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isNotificationRead, setIsNotificationRead] = useState(
    JSON.parse(localStorage.getItem("isNotificationRead")) || false,
  )
  const [titlePage, setTitlePage] = useState("")

  useEffect(() => {
    if (selectedView === "applicants") {
      setTitlePage("Applicants")
    } else if (selectedView === "analytics") {
      setTitlePage("Analytics")
    } else if (selectedView === "jobs") {
      setTitlePage("Jobs")
    } else if (selectedView === "config") {
      setTitlePage("Configurations")
    }
  })


  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        setLoading(true)
        const response = await api.get("/notification")
        const data = response.data

        if (!data || !data.ats || !Array.isArray(data.ats)) {
          setNotificationCount(0)
          return
        }

        // Get current date for comparison
        const now = new Date()
        const threeDaysAgo = new Date(now)
        threeDaysAgo.setDate(now.getDate() - 3)

        // Count applicants that need attention (not updated in 3+ days)
        const needsAttentionCount = data.ats.filter((applicant) => {
          const updatedDate = new Date(applicant.updated_at)
          return updatedDate < threeDaysAgo && applicant.status !== "BLACKLISTED" && applicant.status !== "NOT_FIT"
        }).length

        setNotificationCount(needsAttentionCount)
      } catch (err) {
        console.error("Error fetching notification count:", err)
        setNotificationCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationCount()
  }, [])

  useEffect(() => {
    localStorage.setItem("isNotificationRead", JSON.stringify(isNotificationRead))
  }, [isNotificationRead])

  const handleSelectView = (view) => {
    setCurrentView(view)
    onSelectView(view)
  }

  const handleNotificationClick = () => {
    setIsNotificationRead(true)
    onToggleATSHealthcheck()
  }

  return (
    <header className="top-0 flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-gray-dark focus:outline-none md:hidden">
          <FaBars size={24} />
        </button>
        <p className="display text-gray-dark block md:hidden">ATS</p>
        <p className="text-2xl font-bold text-gray-dark hidden md:block">{titlePage}</p>
      </div>
      <div className="flex items-center gap-4 ">
        <button
          className="rounded-full p-2 text-teal-600 hover:bg-teal-600/10 hover:text-teal-700 relative cursor-pointer"
          onClick={handleNotificationClick}
          aria-label={`Health check - ${notificationCount} notifications`}
        >
          <FaBell className="h-6 w-6 md:h-8 md:w-8" />

          {notificationCount > 0 && !isNotificationRead && (
            <span className="notification-badge absolute -top-1 -right-1 flex items-center justify-center">
              <span className="flex items-center justify-center bg-red-500 border-black text-white text-xs font-bold rounded-full h-5 w-5 shadow-sm">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

