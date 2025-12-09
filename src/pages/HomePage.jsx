import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Headphones, Award, MapPin, Navigation, ArrowRight } from 'lucide-react';
import useMapStore from '../stores/mapStore';
import { t } from '../utils/uiTranslations';

function HomePage() {
  const navigate = useNavigate();
  const currentLanguage = useMapStore((state) => state.currentLanguage);

  const features = [
    {
      icon: MapPin,
      title: t('home.discoverTimisoara', currentLanguage),
      description: t('home.discoverTimisoaraDesc', currentLanguage)
    },
    {
      icon: Headphones,
      title: t('home.audioStories', currentLanguage),
      description: t('home.audioStoriesDesc', currentLanguage)
    },
    {
      icon: Award,
      title: t('home.trackJourney', currentLanguage),
      description: t('home.trackJourneyDesc', currentLanguage)
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1600')] bg-cover bg-center opacity-10"></div>
        <div className="relative px-6 pt-20 pb-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-heritage-700 rounded-full">
                <Map className="w-6 h-6 text-amber-400" />
                <span className="text-lg font-bold text-heritage-50">Echoes</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-heritage-900 dark:text-heritage-100 sm:text-6xl lg:text-7xl mb-6">
              {t('home.heroTitle', currentLanguage)}{' '}
              <span className="text-heritage-700 dark:text-heritage-400">Timișoara</span>
            </h1>
            <p className="text-xl leading-8 text-heritage-700 dark:text-heritage-300 max-w-2xl mx-auto mb-10">
              {t('home.heroSubtitle', currentLanguage)}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/map')}
                className="group inline-flex items-center gap-3 rounded-xl bg-heritage-700 px-8 py-4 text-base font-semibold text-heritage-50 shadow-lg hover:bg-heritage-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-700 transition-all duration-300 hover:scale-105"
              >
                <Navigation className="w-5 h-5" />
                {t('home.startExploring', currentLanguage)}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('features');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-base font-semibold text-heritage-800 dark:text-heritage-300 hover:text-heritage-900 dark:hover:text-heritage-100 transition-colors"
              >
                {t('home.learnMore', currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-heritage-900 dark:text-heritage-100 mb-4">
              {t('home.personalGuide', currentLanguage)}
            </h2>
            <p className="text-lg text-heritage-700 dark:text-heritage-300 max-w-2xl mx-auto">
              {t('home.personalGuideDesc', currentLanguage)}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 border border-heritage-200 dark:border-neutral-700 hover:border-heritage-400 dark:hover:border-heritage-500"
              >
                <div className="flex justify-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-heritage-100 dark:bg-heritage-900 text-heritage-700 dark:text-heritage-300 group-hover:bg-heritage-700 dark:group-hover:bg-heritage-600 group-hover:text-heritage-50 transition-all duration-300">
                    <feature.icon className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-heritage-900 dark:text-heritage-100 mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-heritage-700 dark:text-heritage-300 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Locations Preview */}
      <div className="py-24 px-6 lg:px-8 bg-heritage-800">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-heritage-50 mb-4">
              {t('home.iconicLocations', currentLanguage)}
            </h2>
            <p className="text-lg text-heritage-200 max-w-2xl mx-auto">
              {t('home.iconicLocationsDesc', currentLanguage)}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Victory Square</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Union Square</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Huniade Castle</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Orthodox Cathedral</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Liberty Square</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">1989 Memorial</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Bega Canal</span>
            </div>
            <div className="aspect-square rounded-xl bg-heritage-700 flex items-center justify-center p-4 hover:bg-heritage-600 transition-colors">
              <span className="text-heritage-100 font-semibold text-center text-sm">Roses Park</span>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate('/map')}
              className="inline-flex items-center gap-3 rounded-xl bg-amber-500 px-8 py-4 text-base font-semibold text-heritage-900 shadow-lg hover:bg-amber-400 transition-all duration-300 hover:scale-105"
            >
              <Map className="w-5 h-5" />
              {t('home.viewOnMap', currentLanguage)}
            </button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-heritage-900 dark:text-heritage-100 mb-6">
            {t('home.readyToExplore', currentLanguage)}
          </h2>
          <p className="text-xl text-heritage-700 dark:text-heritage-300 mb-10 max-w-2xl mx-auto">
            {t('home.readyToExploreDesc', currentLanguage)}
          </p>
          <button
            onClick={() => navigate('/map')}
            className="group inline-flex items-center gap-3 rounded-xl bg-heritage-700 px-10 py-5 text-lg font-semibold text-heritage-50 shadow-xl hover:bg-heritage-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-700 transition-all duration-300 hover:scale-105"
          >
            <Navigation className="w-6 h-6" />
            {t('home.beginJourney', currentLanguage)}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
