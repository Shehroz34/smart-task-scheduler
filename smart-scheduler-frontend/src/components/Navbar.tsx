import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsUpdatedEvent,
  type AppNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/tasks", label: "Tasks" },
  { to: "/schedule", label: "Schedule" },
  { to: "/wellbeing", label: "Wellbeing" },
];

function Navbar() {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  function loadNotifications() {
    setNotifications(getNotifications());
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  useEffect(() => {
    loadNotifications();

    function handleNotificationsUpdated() {
      loadNotifications();
    }

    function handleWindowClick(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    window.addEventListener(notificationsUpdatedEvent, handleNotificationsUpdated);
    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener(notificationsUpdatedEvent, handleNotificationsUpdated);
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  function handleOpenNotifications() {
    setIsNotificationsOpen((current) => !current);
  }

  function handleMarkAllRead() {
    markAllNotificationsRead();
    loadNotifications();
  }

  function handleNotificationClick(notificationId: string) {
    markNotificationRead(notificationId);
    loadNotifications();
  }

  return (
    <header className="relative z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
              SS
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Smart Scheduler
              </p>
              <p className="text-xs text-muted-foreground">
                Plan realistic workdays
              </p>
            </div>
          </Link>

          <Badge variant="outline" className="hidden rounded-full px-3 py-1 sm:inline-flex">
            Productivity OS
          </Badge>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
              <Button
                type="button"
                variant="outline"
                className="relative h-10 rounded-full px-3"
                onClick={handleOpenNotifications}
                aria-label="Open notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="size-4"
                >
                  <path
                    d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Zm-4 4a2 2 0 0 1-4 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {isNotificationsOpen && (
                <Card className="absolute right-0 top-full z-[60] mt-3 w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden border-border/70 bg-background/95 py-0 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/92">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-4">
                    <CardTitle className="text-base font-semibold">
                      Notifications
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={handleMarkAllRead}
                      disabled={notifications.length === 0}
                    >
                      Mark all read
                    </Button>
                  </CardHeader>

                  <CardContent className="max-h-[min(18rem,calc(100vh-8rem))] space-y-3 overflow-y-auto px-4 pb-4">
                    {notifications.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                        <p className="text-sm font-medium text-foreground">
                          No notifications yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Task, schedule, and warning updates will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                            notification.read
                              ? "border-border/60 bg-background"
                              : "border-primary/25 bg-primary/5"
                          )}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">
                                {notification.title}
                              </p>
                              <p className="text-xs leading-5 text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4 text-sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
