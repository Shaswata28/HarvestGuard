import { motion } from "framer-motion";
import { Leaf, Shield } from "lucide-react";

export default function AnimatedLogo({ size = "large" }: { size?: "small" | "large" }) {
  const isLarge = size === "large";
  // Sizes for the icons
  const containerSize = isLarge ? "w-40 h-40" : "w-12 h-12";
  const shieldSize = isLarge ? 120 : 36;
  const leafSize = isLarge ? 80 : 24;

  return (
    <div className={`relative flex items-center justify-center ${containerSize}`}>
      {/* 1. The Shield (Appears first) */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative z-10 text-primary"
      >
        <Shield 
          size={shieldSize} 
          strokeWidth={1.5}
          fill="rgba(217, 119, 6, 0.1)" // Light orange fill
        />
      </motion.div>

      {/* 2. The Leaf (Grows inside the shield) */}
      <motion.div
        className="absolute z-20 text-green-600"
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring", bounce: 0.5 }}
      >
        <Leaf 
          size={leafSize} 
          strokeWidth={2} 
          fill="currentColor"
        />
      </motion.div>

      {/* 3. Pulse Glow Effect (Soul) */}
      <motion.div
        className="absolute inset-0 bg-primary/20 rounded-full -z-10 blur-3xl"
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  );
}