import React, { useState } from "react";
import { UserProfile, NotificationEvent } from "../types";
import { LogOut, Bell, Menu, X, Calendar, MessageSquare, Info, Search, BookOpen, Users, Mail, Shield, Check } from "lucide-react";

interface NavbarProps {
  userProfile: UserProfile | null;
  notifications: NotificationEvent[];
  onMarkNotificationRead: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

// PREMIUM BRAND "M" LOGO SYMBOL (MATCHING image_3.png)
export const MindedgeLogoSymbol: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={`${className} transition-transform duration-300 hover:scale-105`} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="m-grad-logo" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFA15C" />
        <stop offset="25%" stopColor="#FB5A71" />
        <stop offset="55%" stopColor="#C046DF" />
        <stop offset="85%" stopColor="#8044F9" />
        <stop offset="100%" stopColor="#3C82F6" />
      </linearGradient>
    </defs>
    {/* A continuous rounded 'M' ribbon path that reproduces the curved structure of the Mindedge brand symbol precisely */}
    <path
      d="M27,73 L27,40 C27,24 43,24 45,39 C48,48 52,48 55,39 C57,24 73,24 73,40 L73,73"
      stroke="url(#m-grad-logo)"
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// FULL BRAND LOGO (M SYMBOL + "Mindedge" TYPOGRAPHY MATCHING image_2.png)
export const MindedgeFullLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <div className={`flex items-center space-x-2 select-none group ${className}`}>
    <MindedgeLogoSymbol className="w-8 h-8" />
    <span className="text-[21px] font-bold tracking-tight text-[#110D44] font-sans flex items-center">
      <span>Mind</span>
      <span className="bg-gradient-to-r from-[#D946EF] via-[#AB52F7] to-[#516CFF] bg-clip-text text-transparent font-extrabold">edge</span>
    </span>
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  notifications,
  onMarkNotificationRead,
  activeTab,
  setActiveTab,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Custom pill configurations according to the screenshot styling
  const roleLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    parent: { label: "Parent Advocate", bg: "bg-[#eefcf5]", text: "text-[#0ea35d]", border: "border-[#d1f2e1]" },
    student: { label: "Athlete Mindset", bg: "bg-[#f5f3ff]", text: "text-[#6d28d9]", border: "border-[#ddd6fe]" },
    therapist: { label: "Licensed Practitioner", bg: "bg-[#ecfdf5]", text: "text-[#047857]", border: "border-[#a7f3d0]" },
    school_admin: { label: "Institution Partner", bg: "bg-[#fffbeb]", text: "text-[#b45309]", border: "border-[#fde68a]" },
    admin: { label: "Super Administrator", bg: "bg-[#fff1f2]", text: "text-[#be123c]", border: "border-[#fecdd3]" }
  };

  const getRoleBadge = (role: string) => {
    const config = roleLabels[role] || { label: "Guest Reader", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
    return (
      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border} tracking-normal`}>
        {config.label}
      </span>
    );
  };

  const firstLetter = userProfile?.name?.charAt(0).toUpperCase() || "R";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* DESKTOP HEADER (MATCHES image_1.png) */}
        <div className="hidden md:flex justify-between items-center h-16">
          {/* Left Brand Area */}
          <div 
            className="cursor-pointer shrink-0" 
            onClick={() => setActiveTab(userProfile ? "dashboard" : "about")}
          >
            <MindedgeFullLogo />
          </div>

          {/* Center Links (Spaced & aligned according to image_1.png) */}
          <div className="flex items-center space-x-6 lg:space-x-8">
            {userProfile ? (
              <>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`text-xs font-bold tracking-tight transition-all cursor-pointer ${
                    activeTab === "dashboard"
                      ? "text-[#110D44]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  My Dashboard
                </button>
                {userProfile.role === "parent" && (
                  <>
                    <button
                      onClick={() => setActiveTab("children")}
                      className={`text-xs font-bold tracking-tight transition-all cursor-pointer ${
                        activeTab === "children"
                          ? "text-[#110D44]"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      My Childrens
                    </button>
                    <button
                      onClick={() => setActiveTab("appointments")}
                      className={`text-xs font-bold tracking-tight transition-all cursor-pointer ${
                        activeTab === "appointments"
                          ? "text-[#110D44]"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      My Appointments
                    </button>
                  </>
                )}
                {(userProfile.role === "parent" || userProfile.role === "therapist") && (
                  <button
                    onClick={() => setActiveTab("telehealth")}
                    className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "telehealth"
                        ? "text-[#110D44]"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                    Chat & Telehealth
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "about" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Info className="w-4 h-4 text-slate-400" />
                  About Mindedge
                </button>
                <button
                  onClick={() => setActiveTab("therapists")}
                  className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "therapists" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  Find Coaches
                </button>
                <button
                  onClick={() => setActiveTab("blogs")}
                  className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "blogs" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Mental Library
                </button>
                <button
                  onClick={() => setActiveTab("founders")}
                  className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "founders" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  Founders
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "contact" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  Contact Us
                </button>
              </>
            )}

            {userProfile && userProfile.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "admin"
                    ? "text-[#be123c]"
                    : "text-slate-400 hover:text-rose-600"
                }`}
              >
                <Shield className="w-4 h-4 text-rose-400" />
                Console Admin
              </button>
            )}
          </div>

          {/* Right Utility Area */}
          <div className="flex items-center space-x-4">
            {userProfile ? (
              <>
                {/* 1. Dynamic Soft Gradient Role pill */}
                {getRoleBadge(userProfile.role)}

                {/* 2. Notifications Bell with custom red circle notification badge */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1 px-2.5 text-[#7c6eff] hover:text-[#5b3af2] rounded-lg relative transition-all cursor-pointer mt-1"
                  >
                    <Bell className="w-[19px] h-[19px] stroke-[2.2]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-[1.5px] right-[4.5px] min-w-[15px] h-[15px] rounded-full bg-[#f43f5e] text-[8px] font-extrabold text-white flex items-center justify-center border-1.5 border-white px-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        <span className="text-[10px] text-indigo-600 font-extrabold">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-75 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-sans">
                            No notifications to display
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-4 hover:bg-slate-5/80 transition-colors ${!n.read ? "bg-violet-50/20" : ""}`}>
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-xs font-semibold text-slate-700 leading-relaxed">{n.message}</p>
                                {!n.read && (
                                  <button
                                    onClick={() => onMarkNotificationRead(n.id)}
                                    className="p-1 text-violet-600 hover:bg-violet-100 rounded-full shrink-0 transition-colors cursor-pointer"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Sleek vertical divider */}
                <span className="w-[1.5px] h-5 bg-slate-200"></span>

                {/* 4. User identity text and Blue-indigo avatar circle */}
                <div className="flex items-center space-x-3 select-none">
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-900 leading-tight">{userProfile.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium font-sans leading-none mt-0.5">{userProfile.email}</p>
                  </div>

                  {userProfile.photoURL ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={userProfile.photoURL}
                      alt={userProfile.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-xs"
                    />
                  ) : (
                    // Elegant Indigo user initial circle
                    <div className="w-9 h-9 rounded-full bg-[#5b3af2] text-white flex items-center justify-center text-sm font-extrabold shadow-sm shrink-0">
                      {firstLetter}
                    </div>
                  )}
                </div>

                {/* 5. Logout action icon far right */}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab("login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                Login now
              </button>
            )}
          </div>
        </div>

        {/* MOBILE HEADER (MATCHES image.png) */}
        <div className="flex md:hidden justify-between items-center h-16">
          {/* Left Element: Hamburger menu toggle button */}
          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setMobileUserMenuOpen(false);
            }}
            className="p-2 -ml-2 text-indigo-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shrink-0"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 stroke-[2]" /> : <Menu className="w-6 h-6 stroke-[2]" />}
          </button>

          {/* Center Element: High-fidelity "M" logo symbol */}
          <div 
            className="cursor-pointer" 
            onClick={() => setActiveTab(userProfile ? "dashboard" : "about")}
          >
            <MindedgeLogoSymbol className="w-8 h-8" />
          </div>

          {/* Right Elements: Bell notification & Profile Initial Circle */}
          <div className="flex items-center space-x-1.5">
            {userProfile ? (
              <>
                {/* 1. Mobile Bell triggers notifications sheet */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-[#7c6eff]"
                  >
                    <Bell className="w-[19px] h-[19px] stroke-[2.2]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-[4.5px] right-[4.5px] min-w-[15px] h-[15px] rounded-full bg-[#f43f5e] text-[8px] font-extrabold text-white flex items-center justify-center border-1.5 border-white px-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel for mobile notifications list */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        <span className="text-[10px] text-indigo-600 font-extrabold">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-[11px] font-sans">
                            No notifications to display
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3">
                              <div className="flex justify-between items-start gap-1">
                                <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{n.message}</p>
                                {!n.read && (
                                  <button
                                    onClick={() => onMarkNotificationRead(n.id)}
                                    className="p-1 text-violet-600"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Mobile User Orange-coral initial badge */}
                <button
                  onClick={() => {
                    setMobileUserMenuOpen(!mobileUserMenuOpen);
                    setMobileMenuOpen(false);
                    setShowNotifications(false);
                  }}
                  className="w-8 h-8 rounded-full bg-[#FF712D] text-white flex items-center justify-center text-sm font-extrabold shadow-xs shrink-0 select-none cursor-pointer border border-[#fd5c12]/20"
                >
                  {firstLetter}
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab("login")}
                className="bg-indigo-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE COLLAPSIBLE DRAWER & MENU SHEETS */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-5 bg-white border-t border-slate-100 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200 shadow-md">
          {userProfile ? (
            <>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "dashboard" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                My Dashboard
              </button>

              {userProfile.role === "parent" && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab("children");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === "children" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    My Childrens
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("appointments");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === "appointments" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    My Appointments
                  </button>
                </>
              )}
              {(userProfile.role === "parent" || userProfile.role === "therapist") && (
                <button
                  onClick={() => {
                    setActiveTab("telehealth");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === "telehealth" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Chat & Telehealth
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setActiveTab("about");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Info className="w-4 h-4 text-slate-400" /> Track About
              </button>
              <button
                onClick={() => {
                  setActiveTab("therapists");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" /> Find Coaches
              </button>
              <button
                onClick={() => {
                  setActiveTab("blogs");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-slate-400" /> Mental Library
              </button>
              <button
                onClick={() => {
                  setActiveTab("founders");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-slate-400" /> Founders Page
              </button>
              <button
                onClick={() => {
                  setActiveTab("contact");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-slate-400" /> Reach Out Us
              </button>
            </>
          )}

          {userProfile && userProfile.role === "admin" && (
            <button
              onClick={() => {
                setActiveTab("admin");
                setMobileMenuOpen(false);
              }}
              className="w-full text-slate-600 hover:bg-rose-50 hover:text-rose-600 text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Console Admin
            </button>
          )}
        </div>
      )}

      {/* MOBILE DESKTOP USER DRAWER (Toggled by and styling user initial badge) */}
      {userProfile && mobileUserMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-white border-t border-slate-100 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 shadow-xl font-sans">
          {/* USER OVERVIEW PANEL */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-[#FF712D] text-white flex items-center justify-center text-md font-extrabold shadow-sm shrink-0 border border-[#fd5c12]/20">
              {firstLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-slate-900 truncate">{userProfile.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{userProfile.email}</p>
              <div className="mt-2 flex">
                {getRoleBadge(userProfile.role)}
              </div>
            </div>
          </div>

          {/* SIGN OUT */}
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => {
                setMobileUserMenuOpen(false);
                onLogout();
              }}
              className="w-full text-center py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Securely
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

