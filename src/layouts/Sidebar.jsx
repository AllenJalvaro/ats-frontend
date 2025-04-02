import {
  FaSignOutAlt,
  FaTimesCircle,
  FaTable,
  FaUsers,
  FaChartBar,
  FaBriefcase
} from "react-icons/fa";

import { FaGear } from "react-icons/fa6";
import useUserStore from "../context/userStore";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({ isOpen, onToggleSidebar, onSelectView }) {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("dashboard");

  const handleSelectView = (view) => {
    setCurrentView(view);
    onSelectView(view);
    onToggleSidebar();
  };

  const handleLogout = () => {
    // Remove specific cookies
    Cookies.remove("token");
    
    // Remove all cookies
    const allCookies = Cookies.get();
    Object.keys(allCookies).forEach(cookieName => {
      Cookies.remove(cookieName);
    });
    
    // Clear localStorage items
    localStorage.removeItem("tabs");
    localStorage.removeItem("isNotificationRead");
    
    // Clear sessionStorage items for all analytics components
    sessionStorage.clear();
    
    // Clear user data from Zustand store
    setUser(null);
    
    // Redirect to login page
    navigate("/login");
  };

  return (
    <>
      {/* Overlay (closes sidebar when clicked) */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          } md:hidden`}
        onClick={onToggleSidebar}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col justify-between bg-white p-6 shadow-lg transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 md:shadow-none`}
      >
        {/* Close Button (only for mobile) */}
        <button
          className="absolute top-4 right-4 text-gray-500 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Close sidebar"
        >
          <FaTimesCircle className="h-5 w-5" />
        </button>

        <div>
          {/* User Info */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
            <div>
              {user ? (
                <>
                  <h3 className="font-semibold text-gray-900">{`${user.first_name} ${user.last_name}`}</h3>
                  <p className="text-sm text-gray-500">{user.user_email}</p>
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-teal-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <hr className="border-gray-light" />
            <SidebarLink
              text="Dashboard"
              icon={<FaTable />}
              onClick={() => handleSelectView("dashboard")}
              active={currentView === "dashboard"}
            />
            <SidebarLink
              text="Applicants"
              icon={<FaUsers />}
              onClick={() => handleSelectView("listings")}
              active={currentView === "listings"}
            />
            <SidebarLink
              text="Analytics"
              icon={<FaChartBar />}
              onClick={() => handleSelectView("analytics")}
              active={currentView === "analytics"}
            />
            <SidebarLink
              text="Jobs"
              icon={<FaBriefcase />}
              onClick={() => handleSelectView("jobs")}
              active={currentView === "jobs"}
            />
            <SidebarLink
              text="Configurations"
              icon={<FaGear />}
              onClick={() => handleSelectView("config")}
              active={currentView === "config"}
            />
          </nav>
        </div>

        {/* Logout Button */}
        <div className="space-y-3">
          <button
            className="border-teal text-teal hover:bg-teal-soft flex w-full items-center justify-center gap-2 rounded-md border bg-white px-4 py-2"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

// Reusable SidebarLink Component
function SidebarLink({ text, icon, onClick, active }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 rounded-md px-4 py-2 font-medium text-gray-dark transition ${active ? "bg-teal-600 text-white" : "hover:bg-gray-100"}`}
      onClick={onClick}
    >
      {icon}
      {text}
    </a>
  );
}
