interface ReviewProgressProps {
  currentIndex: number;
  total: number;
}

export default function ReviewProgress({
  currentIndex,
  total,
}: ReviewProgressProps) {
  return (
    <div className="progress-container">
      <div className="progress-text">
        {currentIndex + 1}/{total}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${((currentIndex + 1) / total) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}
