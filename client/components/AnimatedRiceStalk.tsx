import { motion } from "framer-motion";
import { useLanguage } from "@/context/LangContext";

export default function AnimatedRiceStalk() {
  const { t } = useLanguage();

  // Animation variants for the stalk color transitions
  const stalkVariants = {
    healthy: {
      fill: "#166534",
      transition: { duration: 1 },
    },
    rotting: {
      fill: "#b45309",
      transition: { duration: 1 },
    },
    protected: {
      fill: "#166534",
      transition: { duration: 1 },
    },
  } as any;

  // Shield animation
  const shieldVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6 },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.6 },
    },
  } as any;

  // Label variants
  const labelVariants = {
    visible: {
      opacity: 1,
      transition: { duration: 0.6 },
    },
    hidden: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  // Main sequence animation
  const sequence = [
    { state: "healthy", label: t("animation.healthy"), duration: 3 },
    { state: "rotting", label: t("animation.rotting"), duration: 3 },
    { state: "protected", label: t("animation.protected"), duration: 3 },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      {/* SVG Animation Container */}
      <motion.div
        className="relative w-full max-w-xs h-64 flex items-center justify-center"
        animate="visible"
        initial="hidden"
      >
        <motion.svg
          viewBox="0 0 200 300"
          className="w-full h-full"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Rice Stalk Base */}
          <motion.line
            x1="100"
            y1="200"
            x2="100"
            y2="80"
            stroke="currentColor"
            strokeWidth="4"
            initial={{ stroke: "#166534" }}
            animate={{
              stroke: ["#166534", "#b45309", "#166534"],
            }}
            transition={{
              times: [0, 0.33, 0.66],
              duration: 9,
              repeat: Infinity,
            }}
          />

          {/* Rice Grain Head */}
          <motion.circle
            cx="100"
            cy="60"
            r="20"
            initial={{ fill: "#166534" }}
            animate={{
              fill: ["#166534", "#b45309", "#166534"],
            }}
            transition={{
              times: [0, 0.33, 0.66],
              duration: 9,
              repeat: Infinity,
            }}
          />

          {/* Decorative leaves */}
          <motion.path
            d="M 90 140 Q 70 130 65 100"
            initial={{ stroke: "#166534" }}
            animate={{
              stroke: ["#166534", "#b45309", "#166534"],
            }}
            transition={{
              times: [0, 0.33, 0.66],
              duration: 9,
              repeat: Infinity,
            }}
            strokeWidth="3"
            fill="none"
          />
          <motion.path
            d="M 110 140 Q 130 130 135 100"
            initial={{ stroke: "#166534" }}
            animate={{
              stroke: ["#166534", "#b45309", "#166534"],
            }}
            transition={{
              times: [0, 0.33, 0.66],
              duration: 9,
              repeat: Infinity,
            }}
            strokeWidth="3"
            fill="none"
          />
        </motion.svg>

        {/* Shield Animation - appears during "protected" phase */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={shieldVariants}
          initial="hidden"
          animate="visible"
          transition={{
            delay: 5.5,
            duration: 9,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <div className="text-6xl">🛡️</div>
        </motion.div>
      </motion.div>

      {/* Status Label */}
      <motion.div
        className="text-center space-y-2"
        initial="hidden"
        animate="visible"
      >
        <motion.p className="text-2xl font-bold text-primary">
          <AnimatingLabel sequence={sequence} />
        </motion.p>
        <p className="text-sm text-muted-foreground">
          HarvestGuard {t("appName")} - উদ্ভিদ সুরক্ষা প্রযুক্তি
        </p>
      </motion.div>
    </div>
  );
}

function AnimatingLabel({
  sequence,
}: {
  sequence: Array<{ state: string; label: string; duration: number }>;
}) {
  return (
    <motion.div
      animate="visible"
      initial="hidden"
      transition={{
        times: [0, 0.33, 0.66, 1],
        duration: 9,
        repeat: Infinity,
      }}
      variants={{
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
      }}
    >
      {sequence[0].label}
    </motion.div>
  );
}
