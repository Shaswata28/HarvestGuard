import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatsCard from "@/components/StatsCard";
import AnimatedRiceStalk from "@/components/AnimatedRiceStalk";
import { Leaf, TrendingDown, Users } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12 md:py-20">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Animated Rice Stalk */}
        <AnimatedRiceStalk />

        {/* Call-to-Action Button - Massive Pulsing Button */}
        <div className="flex justify-center pt-8">
          <Link to="/dashboard">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold animate-pulse-slow bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg min-h-14 shadow-lg"
            >
              {t("hero.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Stats Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            সমস্যা আমাদের সামনে
          </h2>
          <p className="text-muted-foreground">
            বাংলাদেশে খাদ্য শস্য সংরক্ষণে অসাধারণ চ্যালেঞ্জ রয়েছে
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title={t("stats.loss_per_year")}
            value="৪৫ লক্ষ টন"
            icon={<TrendingDown className="w-8 h-8 text-critical" />}
            variant="critical"
          />
          <StatsCard
            title={t("stats.financial_loss")}
            value="১৫০০ কোটি টাকা"
            icon={<TrendingDown className="w-8 h-8 text-warning" />}
            variant="warning"
          />
          <StatsCard
            title={t("stats.farmers_affected")}
            value="লক্ষ লক্ষ কৃষক"
            icon={<Users className="w-8 h-8 text-primary" />}
          />
        </div>
      </section>

      {/* Impact Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            আমাদের সমাধান
          </h2>
          <p className="text-muted-foreground">
            প্রযুক্তি এবং স্থানীয় জ্ঞানের সমন্বয়ে ক্ষতি রোধ করুন
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon="📱"
            title="মোবাইল প্রথম"
            description="সব ডিভাইসে কাজ করে, এমনকি স্লো ইন্টারনেটেও"
          />
          <FeatureCard
            icon="🛡️"
            title="অফলাইন সুরক্ষা"
            description="ইন্টারনেট ছাড়াই আপনার ডেটা নিরাপদ থাকে"
          />
          <FeatureCard
            icon="🌤️"
            title="আবহাওয়া পরামর্শ"
            description="স্থানীয় আবহাওয়া অনুযায়ী সঠিক পরামর্শ পান"
          />
        </div>
      </section>

      {/* Bangla Keywords Section */}
      <section className="bg-primary/5 rounded-lg p-8 space-y-4">
        <h3 className="text-2xl font-bold text-primary">ধান বাঁচান, দেশ বাঁচান</h3>
        <div className="space-y-3 text-foreground">
          <p>✓ আপনার ফসলের সম্পূর্ণ তথ্য সংরক্ষণ করুন</p>
          <p>✓ বিপর্যয়ের আগে থেকেই সতর্ক হোন</p>
          <p>✓ সঠিক সময়ে সঠিক পদক্ষেপ নিন</p>
          <p>✓ অন্যান্য কৃষকদের সাথে অভিজ্ঞতা শেয়ার করুন</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-primary">আজই শুরু করুন</h2>
        <p className="text-muted-foreground">
          আপনার খামার রক্ষা করতে এবং আরও ভাল ফসল পেতে HarvestGuard ব্যবহার করুন
        </p>
        <Link to="/dashboard">
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg min-h-14"
          >
            {t("hero.cta")}
          </Button>
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-border rounded-lg p-6 text-center space-y-3 hover:border-primary transition-colors">
      <div className="text-4xl">{icon}</div>
      <h3 className="font-bold text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
