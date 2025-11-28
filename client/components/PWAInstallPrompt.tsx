import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LangContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const { language } = useLanguage();
  const { shouldShowPrompt, promptInstall, dismissPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after 10 seconds if installable
    if (shouldShowPrompt) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000); // 10 seconds delay

      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-2xl p-5 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10">
            {/* Icon */}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">
                  {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
                </h3>
                <p className="text-sm text-white/90">
                  {language === 'bn' ? 'দ্রুত অ্যাক্সেসের জন্য' : 'For quick access'}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/90 mb-4 leading-relaxed">
              {language === 'bn'
                ? 'আপনার ফোনে HarvestGuard ইনস্টল করুন এবং অফলাইনেও ব্যবহার করুন। বিজ্ঞপ্তি পান এবং দ্রুত অ্যাক্সেস করুন।'
                : 'Install HarvestGuard on your phone and use it offline. Get notifications and quick access.'}
            </p>

            {/* Benefits */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>{language === 'bn' ? 'অফলাইন কাজ করে' : 'Works offline'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>{language === 'bn' ? 'দ্রুত লোড হয়' : 'Loads faster'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>{language === 'bn' ? 'বিজ্ঞপ্তি পান' : 'Get notifications'}</span>
              </div>
            </div>

            {/* Install button */}
            <Button
              onClick={handleInstall}
              className="w-full bg-white text-green-700 hover:bg-white/90 font-bold h-12 rounded-xl shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              {language === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Now'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
