import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/Button/Button";
import { ROUTES } from "../../../shared/lib/routes";

export default function HomeEmptyState() {
  const navigate = useNavigate();

  return (
    <section className="home-empty-state">
      <div>
        <h1 id="home-title">No vocabulary yet</h1>
        <p>
          Add your first words in the Vocabulary table. Review stats and
          progress will appear here after you start learning.
        </p>
      </div>
      <Button
        type="button"
        className="home-empty-action"
        variant="primary"
        onClick={() => navigate(ROUTES.vocabulary)}
      >
        Open vocabulary
      </Button>
    </section>
  );
}
