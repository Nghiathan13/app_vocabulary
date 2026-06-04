export default function VocabularyPageSkeleton() {
  return (
    <section
      className="route-skeleton route-skeleton-vocabulary"
      aria-label="Loading page"
    >
      <div className="skeleton-toolbar">
        <div className="skeleton-search" />
      </div>

      <div className="skeleton-table" />
    </section>
  );
}
