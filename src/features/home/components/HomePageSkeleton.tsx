export default function HomePageSkeleton() {
  return (
    <section className="route-skeleton route-skeleton-home" aria-label="Loading page">
      <div className="route-skeleton-metrics">
        <div className="skeleton-block skeleton-metric" />
        <div className="skeleton-block skeleton-metric" />
        <div className="skeleton-block skeleton-metric" />
      </div>

      <div className="route-skeleton-dashboard">
        <div className="skeleton-block skeleton-panel skeleton-panel-wide" />
        <div className="skeleton-block skeleton-panel" />
      </div>
    </section>
  );
}
