import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Resources() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          {t("resources")}
        </h1>
        <p className="text-muted-foreground">{t("coming_soon")}</p>
      </div>

      <div className="bg-accent/10 border border-accent rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">{t("feature_in_development")}</h2>
        <p className="text-muted-foreground">
          {t("request_feature")}
        </p>
        <Link to="/">
          <Button variant="outline">{t("back")}</Button>
        </Link>
      </div>
    </div>
  );
}
