import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Headphones, Trophy } from 'lucide-react';

function OnboardingOverlay() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('echoes-onboarding-seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const steps = [
    {
      icon: MapPin,
      title: "Walk to Discover Stories",
      description: "As you explore the city, cultural nodes will appear on your map. Walk closer to unlock their secrets."
    },
    {
      icon: Headphones,
      title: "Unlock Content When Nearby",
      description: "Within 100 meters of a node, you'll unlock audio stories, historic photos, and fascinating details."
    },
    {
      icon: Trophy,
      title: "Save Your Journey",
      description: "Track your discoveries and build a personal collection of the city's cultural heritage."
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('echoes-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <AnimatePresence>
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 dark:bg-black/90 z-[3000] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full border border-neutral-200 dark:border-neutral-700"
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {React.createElement(steps[currentStep].icon, {
                  className: "w-16 h-16 text-heritage-700 dark:text-heritage-400"
                })}
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-heritage-700 dark:bg-heritage-500'
                      : 'w-1.5 bg-heritage-300 dark:bg-heritage-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 text-heritage-700 dark:text-heritage-400 hover:text-heritage-900 dark:hover:text-heritage-200 font-medium transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-heritage-700 dark:bg-heritage-600 hover:bg-heritage-800 dark:hover:bg-heritage-700 text-white rounded-lg font-semibold transition-colors"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OnboardingOverlay;