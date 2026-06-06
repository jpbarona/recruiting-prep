import { NavLink, Outlet } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { RED_DATE } from "../lib/constants";
import { daysUntilRed, formatDisplayDate, todayString } from "../lib/dates";

const navItems = [
  { to: "/", label: "Calendar", end: true },
  { to: "/today", label: "Today" },
  { to: "/free-practice", label: "Free Practice" },
  { to: "/errors", label: "Errors" },
  { to: "/resources", label: "Resources" },
];

export function Layout() {
  const { loadWarnings } = useAppData();
  const today = todayString();
  const countdown =
    today <= RED_DATE ? daysUntilRed(today) : 0;
  const visibleWarnings = loadWarnings.slice(0, 5);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">Quant Trading Cockpit</h1>
          {today <= RED_DATE && (
            <p className="countdown">
              {countdown} day{countdown === 1 ? "" : "s"} to{" "}
              {formatDisplayDate(RED_DATE)}
            </p>
          )}
        </div>
        <nav className="main-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {visibleWarnings.length > 0 && (
        <div className="load-warnings" role="status">
          <p>Some CSV rows were skipped while loading:</p>
          <ul>
            {visibleWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {loadWarnings.length > visibleWarnings.length && (
            <p className="muted">
              +{loadWarnings.length - visibleWarnings.length} more
            </p>
          )}
        </div>
      )}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
