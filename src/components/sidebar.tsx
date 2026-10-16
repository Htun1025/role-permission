"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useThemeStore } from "@/store/theme";

import type {
  MenuItem,
  SidebarContextType,
  SidebarProps,
  ActiveMenu,
} from "@/types";

import "../app/globals.css";

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used inside Sidebar");
  }

  return context;
}

export default function Sidebar({
  menuItems = [],
  name = "User",
  role = "USER",
  children,
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const darkMode = theme === "dark";
  const sidebarActionsRef = useRef<HTMLDivElement>(null);

  const headerActionsRef = useRef<HTMLDivElement>(null);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    setThemeLoaded(true);
  }, [setTheme]);

  useEffect(() => {
    if (!themeLoaded) return;

    const isDark = theme === "dark";

    document.documentElement.classList.toggle("dark", isDark);

    localStorage.setItem("theme", theme);
  }, [theme, themeLoaded]);

  const toggleSidebar = () => {
    setOpen((prev) => !prev);
  };

  const closeOnMobile = () => {
    if (window.innerWidth <= 780) {
      setOpen(false);
      setActiveMenu(null);
    }
  };

  const toggleMenu = (menu: Exclude<ActiveMenu, null>) => {
    setActiveMenu((current) => (current === menu ? null : menu));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const insideSidebar =
        sidebarActionsRef.current?.contains(target) ?? false;

      const insideHeader = headerActionsRef.current?.contains(target) ?? false;

      if (!insideSidebar && !insideHeader) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setLoadingPath(null);
    setActiveMenu(null);
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Logout failed:", error);

      setLoggingOut(false);
    }
  };

  const userInitial = (name || "U").trim().charAt(0).toUpperCase();

  const userMenuItems = (
    <>
      <Link
        href="/profile"
        className="sidebar-dropdown-item"
        role="menuitem"
        onClick={() => {
          setLoadingPath("/profile");
          setActiveMenu(null);
        }}
      >
        <i className="pi pi-user" />

        <span>View Profile</span>
      </Link>

      <button
        type="button"
        className="sidebar-dropdown-item sidebar-dropdown-logout"
        role="menuitem"
        disabled={loggingOut}
        onClick={handleLogout}
      >
        <i
          className={loggingOut ? "pi pi-spin pi-spinner" : "pi pi-sign-out"}
        />

        <span>{loggingOut ? "Logging out..." : "Logout"}</span>
      </button>
    </>
  );
  const exactPage = menuItems.find((item: MenuItem) => item.path === pathname);

  const nestedPage = menuItems.find(
    (item: MenuItem) =>
      item.path !== "/" &&
      item.path !== "/report" &&
      pathname.startsWith(`${item.path}/`),
  );

  const currentPage = exactPage?.label ?? nestedPage?.label ?? "Dashboard";

  return (
    <SidebarContext.Provider
      value={{
        open,
        toggleSidebar,
        setOpen,
      }}
    >
      <div className={`app-layout ${open ? "sidebar-open" : "sidebar-closed"}`}>
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">A</div>
            {open && (
              <div className="brand-name">
                <strong>Approval System</strong>

                <small>Management Portal</small>
              </div>
            )}
          </div>
          <nav className="sidebar-nav">
            {open && <div className="sidebar-section-title">Navigation</div>}

            {menuItems.map((item: MenuItem) => {
              const pathnameActive =
                pathname === item.path ||
                (item.path !== "/" &&
                  item.path !== "/report" &&
                  pathname.startsWith(`${item.path}/`));

              const loadingActive = loadingPath === item.path;

              const active = pathnameActive || loadingActive;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={!open ? item.label : undefined}
                  className={`sidebar-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setLoadingPath(item.path);

                    setActiveMenu(null);

                    closeOnMobile();
                  }}
                >
                  <i className={item.icon} />

                  {open && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user-menu" ref={sidebarActionsRef}>
              <button
                type="button"
                className="sidebar-user-trigger"
                onClick={() => toggleMenu("sidebar")}
                aria-label="Sidebar user menu"
                aria-haspopup="menu"
                aria-expanded={activeMenu === "sidebar"}
                title="User menu"
              >
                <div className="user-avatar">{userInitial}</div>

                {open && (
                  <div className="user-info">
                    <strong>{name}</strong>

                    <small>{role ?? "USER"}</small>
                  </div>
                )}

                {open && (
                  <i
                    className={`pi ${
                      activeMenu === "sidebar"
                        ? "pi-chevron-up"
                        : "pi-chevron-down"
                    } sidebar-user-arrow`}
                  />
                )}
              </button>

              {activeMenu === "sidebar" && (
                <div className="sidebar-user-dropdown" role="menu">
                  {userMenuItems}
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="app-main">
          <header className="app-header">
            <div className="app-header-left">
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
              >
                <i className="pi pi-bars" />
              </button>

              <span className="header-divider" />

              <div className="app-header-title">
                <i className="pi pi-file-edit" />

                <strong>{currentPage}</strong>
              </div>
            </div>

            <div className="app-header-right">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                title={darkMode ? "Light Mode" : "Dark Mode"}
              >
                <i className={darkMode ? "pi pi-sun" : "pi pi-moon"} />
              </button>

              <div className="header-actions-wrapper" ref={headerActionsRef}>
                <button
                  type="button"
                  className="header-user-trigger"
                  onClick={() => toggleMenu("header")}
                  aria-label="Header user menu"
                  aria-haspopup="menu"
                  aria-expanded={activeMenu === "header"}
                  title="User menu"
                >
                  <div className="header-user-avatar">{userInitial}</div>

                  <div className="header-user-info">
                    <strong>{name}</strong>

                    <small>{role ?? "USER"}</small>
                  </div>

                  <i
                    className={`pi ${
                      activeMenu === "header"
                        ? "pi-chevron-up"
                        : "pi-chevron-down"
                    } user-menu-arrow`}
                  />
                </button>

                {activeMenu === "header" && (
                  <div className="header-actions-menu" role="menu">
                    <Link
                      href="/profile"
                      className="header-action-item"
                      role="menuitem"
                      onClick={() => {
                        setLoadingPath("/profile");

                        setActiveMenu(null);
                      }}
                    >
                      <i className="pi pi-user" />

                      <span>View Profile</span>
                    </Link>

                    <button
                      type="button"
                      className="header-action-item logout-item"
                      role="menuitem"
                      disabled={loggingOut}
                      onClick={handleLogout}
                    >
                      <i
                        className={
                          loggingOut
                            ? "pi pi-spin pi-spinner"
                            : "pi pi-sign-out"
                        }
                      />

                      <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="app-content">{children}</main>
          <footer className="page-footer">
            <div className="page-divider">
              <span style={{ fontFamily: "emoji" }}>CHID Bank @2026</span>
            </div>
          </footer>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
