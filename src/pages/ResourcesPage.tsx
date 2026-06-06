import { useMemo } from "react";
import { useAppData } from "../context/AppDataContext";

const CATEGORY_ORDER = [
  "Official",
  "Question Bank",
  "Mental Math",
  "Market Making",
  "Firm Careers",
  "Notes",
];

export function ResourcesPage() {
  const { loading, error, resources } = useAppData();

  const grouped = useMemo(() => {
    const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
    const byCategory = new Map<string, typeof resources>();
    for (const r of resources) {
      const list = byCategory.get(r.category) ?? [];
      list.push(r);
      byCategory.set(r.category, list);
    }
    return [...byCategory.entries()].sort(
      (a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99)
    );
  }, [resources]);

  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div className="resources-page">
      {grouped.map(([category, items]) => (
        <section key={category} className="category-section">
          <h2>{category}</h2>
          <ul className="item-list">
            {items.map((r) => (
              <li key={r.title} className="resource-item">
                <h3>{r.title}</h3>
                <p>{r.description}</p>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-small">
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
