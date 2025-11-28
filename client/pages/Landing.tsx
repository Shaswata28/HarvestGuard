import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AnimatedLogo from "@/components/AnimatedLogo";
import { motion } from "framer-motion";
import { ArrowRight, CloudRain, ShieldCheck, Sprout, UserPlus, Bell, TrendingDown, PieChart, Target,Banknote } from "lucide-react";

export default function Landing() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-foreground pb-20 font-sans overflow-x-hidden">
      {/* 1. HERO SECTION (Soulful & Emotional) */}
      <section className="relative pt-10 pb-20 px-4 md:pt-20 md:pb-32 overflow-hidden">
        {/* Warm Background Blob */}
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 animate-float" />
        
        <div className="flex flex-col items-center text-center space-y-6 max-w-lg mx-auto">
          {/* Animated Leaf Logo */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <AnimatedLogo size="large" />
          </motion.div>

          <div className="space-y-4">
            <motion.h1 
              className="text-3xl md:text-5xl font-bold leading-tight text-primary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t("hero.title")}
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-foreground/80 font-medium"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {t("hero.subtitle")}
            </motion.p>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-xs"
          >
            <Link to="/register" className="w-full block">
              <Button 
                size="lg" 
                className="w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl shadow-primary/20 animate-pulse-glow flex items-center justify-center gap-2"
              >
                {t("hero.cta")} <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              {language === "bn" ? "✨ সম্পূর্ণ বিনামূল্যে ব্যবহার করুন" : "✨ Completely free to use"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. THE PROBLEM (Visual Stats for Farmers) */}
      <section className="px-4 py-12 bg-white rounded-t-[2.5rem] shadow-sm -mt-10 relative z-10">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-destructive">
              {t("problem.title")}
            </h2>
            <p className="text-muted-foreground">{t("problem.subtitle")}</p>
            <div className="h-1 w-24 bg-destructive/20 mx-auto rounded-full mt-2" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* 4.5 Million Tonnes (Mountain of Waste) */}
            <DataCard 
              icon={<TrendingDown className="w-10 h-10 text-destructive" />}
              title={t("problem.stat1_title")}
              desc={t("problem.stat1_desc")}
              color="bg-destructive/5 border-destructive/20"
              delay={0.1}
            />
            
            {/* $1.5 Billion (Lost Money) */}
            <DataCard 
              icon={<Banknote className="w-10 h-10 text-green-600" />}
              title={t("problem.stat2_title")}
              desc={t("problem.stat2_desc")}
              color="bg-amber-50 border-amber-200"
              delay={0.2}
            />

            {/* 12-32% Food Loss (Pie Chart) */}
            <DataCard 
              icon={<PieChart className="w-10 h-10 text-blue-600" />}
              title={t("problem.stat3_title")}
              desc={t("problem.stat3_desc")}
              color="bg-blue-50 border-blue-200"
              delay={0.3}
            />

            {/* SDG 12.3 (Goal) */}
            <DataCard 
              icon={<Target className="w-10 h-10 text-green-600" />}
              title={t("problem.stat4_title")}
              desc={t("problem.stat4_desc")}
              color="bg-green-50 border-green-200"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Simple Steps) */}
      <section className="px-4 py-12 bg-[#FDFBF7]">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {t("steps.title")}
            </h2>
            <p className="text-muted-foreground">{t("steps.subtitle")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StepCard 
              icon={<UserPlus className="w-8 h-8 text-primary" />}
              title={t("steps.step1_title")}
              desc={t("steps.step1_desc")}
              delay={0.1}
            />
            <StepCard 
              icon={<Sprout className="w-8 h-8 text-green-600" />}
              title={t("steps.step2_title")}
              desc={t("steps.step2_desc")}
              delay={0.2}
            />
            <StepCard 
              icon={<Bell className="w-8 h-8 text-yellow-500" />}
              title={t("steps.step3_title")}
              desc={t("steps.step3_desc")}
              delay={0.3}
            />
            <StepCard 
              icon={<ShieldCheck className="w-8 h-8 text-blue-600" />}
              title={t("steps.step4_title")}
              desc={t("steps.step4_desc")}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* 4. THE PROMISE (Final Impact) */}
      <section className="px-6 py-12 pb-24">
        <div className="max-w-md mx-auto bg-primary text-primary-foreground rounded-3xl p-8 text-center relative overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
          {/* Texture Overlay */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/woven.png')]"></div>
          
          <div className="relative z-10">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-white/90" />
            <h2 className="text-3xl font-bold mb-4">
              {t("solution.title")}
            </h2>
            <p className="text-lg opacity-90 mb-8 leading-relaxed">
              {t("solution.subtitle")}
            </p>
            
            <Link to="/register">
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 font-bold h-14 rounded-xl text-lg">
                {language === "bn" ? "একাউন্ট খুলুন" : "Create Account"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DataCard({ icon, title, desc, color, delay }: { icon: any, title: string, desc: string, color: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className={`p-5 rounded-2xl border-2 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow ${color}`}
    >
      <div className="p-3 bg-white rounded-full shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function StepCard({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="p-4 bg-white rounded-2xl border border-border shadow-sm flex flex-col items-center text-center space-y-2 hover:border-primary/50 transition-colors h-full"
    >
      <div className="p-3 bg-muted/50 rounded-full mb-1">{icon}</div>
      <h3 className="font-bold text-sm text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
    </motion.div>
  );
}