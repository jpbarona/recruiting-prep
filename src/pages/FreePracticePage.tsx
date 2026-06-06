import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

const CATEGORY_ORDER = [
  "Mental Math",
  "Probability",
  "Market Making",
  "Review",
];

export function FreePracticePage() {
  const { loading, error, freePractice } = useAppData();

  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status error">{error}</p>;

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: freePractice.filter((i) => i.category === category),
  }));

  return (
    <div className="free-practice-page">
      <p className="page-lead">
        Optional. Use only if you have genuine spare energy.
      </p>
      {grouped.map(({ category, items }) => (
        <section key={category} className="category-section">
          <h2>{category}</h2>
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.title} className="practice-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.suggested_minutes && (
                  <p className="muted">~{item.suggested_minutes} min suggested</p>
                )}
                {item.url &&
                  (item.url.startsWith("/") ? (
                    <Link to={item.url} className="btn btn-small">
                      Open
                    </Link>
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-small"
                    >
                      Open
                    </a>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
