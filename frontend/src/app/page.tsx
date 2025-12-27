'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

// =============================================================================
// Content (EN/RU)
// =============================================================================

const content = {
  en: {
    nav: { login: 'Log In', signup: 'Sign Up', dashboard: 'Dashboard' },
    hero: {
      badge: 'AI-Powered',
      label: 'Aviation English Training',
      title: 'Pass Your ICAO English Test',
      subtitle: 'AI speech coach. Real-time feedback. 15 min/day.',
      cta: 'Get Started Free',
      note: 'No credit card required',
    },
    trust: {
      label: 'Recognized by international aviation standards',
    },
    airlines: {
      label: 'Join pilots flying for leading airlines worldwide',
    },
    problems: {
      title: 'The Problem',
      items: [
        { num: '01', title: 'Mandatory Retesting', desc: 'ICAO Level 4 expires every 3-4 years. Miss your score and you\'re grounded.' },
        { num: '02', title: 'Outdated Materials', desc: 'Existing courses are expensive ($300-500), desktop-only, and lack modern AI practice.' },
        { num: '03', title: 'Accent Anxiety', desc: 'Non-native speakers struggle with pronunciation. No app gives real-time correction.' },
      ],
    },
    features: {
      title: 'The Solution',
      subtitle: 'Modern app designed for busy pilots',
      items: [
        { label: 'Vocabulary', title: '500+ Aviation Terms', desc: 'Spaced repetition flashcards. Audio pronunciation. Real context sentences.' },
        { label: 'Listening', title: 'Real ATC Audio', desc: 'Various accents: American, British, Indian. Adjustable speed. Transcription practice.' },
        { label: 'Speaking', title: 'AI Pronunciation Feedback', desc: 'Record yourself. Get instant feedback on pronunciation, fluency, and vocabulary.' },
      ],
    },
    ai: {
      badge: 'Powered by AI',
      title: 'Train with Real ATC Scenarios',
      desc: 'Practice with AI-simulated Air Traffic Control conversations. Get instant feedback on your phraseology, pronunciation, and response timing.',
      features: [
        { icon: '🎙️', title: 'Real-Time Speech Analysis', desc: 'AI listens to your responses and scores pronunciation instantly' },
        { icon: '✈️', title: 'Dynamic ATC Scenarios', desc: 'Taxi, takeoff, approach, emergency — all situations covered' },
        { icon: '📊', title: 'Detailed Feedback Reports', desc: 'Track your progress over time with ICAO-aligned scoring' },
      ],
    },
    howItWorks: {
      title: '15 Minutes a Day',
      steps: [
        { time: '5 min', title: 'Vocabulary Review', desc: 'Smart flashcards that adapt to what you don\'t know' },
        { time: '5 min', title: 'Listening Exercise', desc: 'Real ATC communications with comprehension questions' },
        { time: '5 min', title: 'Speaking Practice', desc: 'Record phraseology or describe a scenario' },
      ],
    },
    levels: {
      title: 'ICAO Proficiency Levels',
      rows: [
        { level: 4, name: 'Operational', validity: '3-4 years', req: 'Minimum for international' },
        { level: 5, name: 'Extended', validity: '6 years', req: 'Preferred by airlines', highlight: true },
        { level: 6, name: 'Expert', validity: 'Lifetime', req: 'Native-level proficiency' },
      ],
    },
    proof: {
      quote: 'Built by pilots who understand the challenge of aviation English testing. We\'ve been through the stress of retesting — now we\'re building the tool we wished existed.',
      stats: [
        { value: '6', label: 'ICAO criteria covered' },
        { value: '500+', label: 'aviation terms' },
        { value: '50+', label: 'listening exercises' },
      ],
    },
    cta: {
      title: 'Ready to Prepare for Your ICAO Test?',
      subtitle: 'Start practicing today. First 7 days free.',
      button: 'Get Started Free',
    },
    footer: {
      tagline: 'Aviation English. Simplified.',
      copyright: '© 2025 AviLingo. All rights reserved.',
    },
  },
  ru: {
    nav: { login: 'Войти', signup: 'Регистрация', dashboard: 'Кабинет' },
    hero: {
      badge: 'На базе ИИ',
      label: 'Авиационный английский',
      title: 'Сдайте тест ICAO по английскому',
      subtitle: 'ИИ-коуч по речи. Обратная связь в реальном времени. 15 мин/день.',
      cta: 'Начать бесплатно',
      note: 'Без банковской карты',
    },
    trust: {
      label: 'Признано международными авиационными стандартами',
    },
    airlines: {
      label: 'Присоединяйтесь к пилотам ведущих авиакомпаний мира',
    },
    problems: {
      title: 'Проблема',
      items: [
        { num: '01', title: 'Обязательная пересдача', desc: 'ICAO Level 4 истекает каждые 3-4 года. Не сдал — не летаешь.' },
        { num: '02', title: 'Устаревшие материалы', desc: 'Курсы дорогие ($300-500), только для ПК, без современных ИИ-технологий.' },
        { num: '03', title: 'Страх акцента', desc: 'Неносителям сложно с произношением. Ни одно приложение не даёт обратную связь.' },
      ],
    },
    features: {
      title: 'Решение',
      subtitle: 'Мобильное приложение для занятых пилотов',
      items: [
        { label: 'Словарь', title: '500+ терминов', desc: 'Интервальные карточки. Аудио произношение. Реальные примеры.' },
        { label: 'Аудирование', title: 'Реальные записи ATC', desc: 'Разные акценты: американский, британский, индийский. Регулировка скорости.' },
        { label: 'Разговорный', title: 'ИИ-оценка произношения', desc: 'Запишите себя. Получите мгновенную оценку произношения, беглости и лексики.' },
      ],
    },
    ai: {
      badge: 'На базе ИИ',
      title: 'Тренируйтесь с реальными ATC сценариями',
      desc: 'Практикуйтесь с ИИ-симуляцией переговоров с диспетчерами. Получайте мгновенную обратную связь по фразеологии, произношению и времени реакции.',
      features: [
        { icon: '🎙️', title: 'Анализ речи в реальном времени', desc: 'ИИ слушает ваши ответы и мгновенно оценивает произношение' },
        { icon: '✈️', title: 'Динамические ATC сценарии', desc: 'Руление, взлёт, заход, аварийная ситуация — все сценарии' },
        { icon: '📊', title: 'Детальные отчёты', desc: 'Отслеживайте прогресс с оценкой по стандартам ICAO' },
      ],
    },
    howItWorks: {
      title: '15 минут в день',
      steps: [
        { time: '5 мин', title: 'Повторение слов', desc: 'Умные карточки, которые адаптируются под вас' },
        { time: '5 мин', title: 'Аудирование', desc: 'Реальные переговоры ATC с вопросами на понимание' },
        { time: '5 мин', title: 'Разговорная практика', desc: 'Запишите фразеологию или опишите ситуацию' },
      ],
    },
    levels: {
      title: 'Уровни ICAO',
      rows: [
        { level: 4, name: 'Рабочий', validity: '3-4 года', req: 'Минимум для международных рейсов' },
        { level: 5, name: 'Продвинутый', validity: '6 лет', req: 'Предпочитают авиакомпании', highlight: true },
        { level: 6, name: 'Эксперт', validity: 'Бессрочно', req: 'Уровень носителя' },
      ],
    },
    proof: {
      quote: 'Создано пилотами, которые понимают сложности тестирования авиационного английского. Мы сами проходили стресс пересдачи — теперь создаём инструмент, которого нам не хватало.',
      stats: [
        { value: '6', label: 'критериев ICAO' },
        { value: '500+', label: 'авиационных терминов' },
        { value: '50+', label: 'упражнений' },
      ],
    },
    cta: {
      title: 'Готовы подготовиться к тесту ICAO?',
      subtitle: 'Начните практиковаться сегодня. Первые 7 дней бесплатно.',
      button: 'Начать бесплатно',
    },
    footer: {
      tagline: 'Авиационный английский. Просто.',
      copyright: '© 2025 AviLingo. Все права защищены.',
    },
  },
};

// =============================================================================
// Trust Logos
// =============================================================================

const trustLogos = [
  { src: '/images/logos/icao.svg', alt: 'ICAO', name: 'ICAO' },
  { src: '/images/logos/iata.svg', alt: 'IATA', name: 'IATA' },
  { src: '/images/logos/easa.svg', alt: 'EASA', name: 'EASA' },
  { src: '/images/logos/faa.svg', alt: 'FAA', name: 'FAA' },
  { src: '/images/logos/caa.svg', alt: 'CAA', name: 'CAA' },
];

const airlineLogos = [
  { src: '/images/logos/uzbekistan.svg', alt: 'Uzbekistan Airways', featured: true },
  { src: '/images/logos/emirates.svg', alt: 'Emirates' },
  { src: '/images/logos/lufthansa.svg', alt: 'Lufthansa' },
  { src: '/images/logos/qatar.svg', alt: 'Qatar Airways' },
  { src: '/images/logos/singapore.svg', alt: 'Singapore Airlines' },
  { src: '/images/logos/turkish.svg', alt: 'Turkish Airlines' },
  { src: '/images/logos/cathay.svg', alt: 'Cathay Pacific' },
  { src: '/images/logos/etihad.svg', alt: 'Etihad' },
  { src: '/images/logos/british.svg', alt: 'British Airways' },
];

// =============================================================================
// Animation Variants
// =============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// =============================================================================
// Landing Page - Swiss Style with Mobile Responsiveness
// =============================================================================

export default function LandingPage() {
  const [lang, setLang] = useState<'en' | 'ru'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const reducedMotion = useReducedMotion();
  const t = content[lang];

  const motionProps = reducedMotion
    ? {}
    : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-50px' } };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* ================================================================= */}
      {/* Navigation - Swiss Style with Mobile Menu */}
      {/* ================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-lg sm:text-xl font-bold tracking-tight">
            AviLingo
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Language Toggle */}
            <div className="flex border border-black">
              <button
                onClick={() => setLang('en')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors border-r border-black',
                  lang === 'en' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ru')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors',
                  lang === 'ru' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                )}
              >
                RU
              </button>
            </div>

            {/* Auth buttons */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <Link
                    href="/app/dashboard"
                    className="px-6 py-2.5 bg-black text-white font-semibold hover:bg-red-600 transition-colors"
                  >
                    {t.nav.dashboard}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-6 py-2.5 bg-black text-white font-semibold hover:bg-red-600 transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-4">
            {/* Language Toggle */}
            <div className="flex border border-black w-fit">
              <button
                onClick={() => setLang('en')}
                className={cn(
                  'px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-r border-black',
                  lang === 'en' ? 'bg-black text-white' : 'bg-white text-black'
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ru')}
                className={cn(
                  'px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors',
                  lang === 'ru' ? 'bg-black text-white' : 'bg-white text-black'
                )}
              >
                RU
              </button>
            </div>

            {/* Auth */}
            {!isLoading && (
              <div className="pt-2">
                {isAuthenticated ? (
                  <Link
                    href="/app/dashboard"
                    className="block w-full text-center px-6 py-3 bg-black text-white font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.nav.dashboard}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full text-center px-6 py-3 bg-black text-white font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.nav.login}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ================================================================= */}
      {/* Hero Section - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="pt-20 sm:pt-32 pb-12 sm:pb-20 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              className="max-w-[560px]"
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* AI Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-black text-xs font-semibold uppercase tracking-widest mb-4 sm:mb-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                {t.hero.badge}
              </div>

              {/* Label */}
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2 sm:mb-4">
                {t.hero.label}
              </p>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-4 sm:mb-6">
                {t.hero.title}
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                {t.hero.subtitle}
              </p>

              {/* CTA Button */}
              <Link
                href="/register"
                className="inline-block w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 bg-black text-white font-semibold text-base sm:text-lg border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors"
              >
                {t.hero.cta}
              </Link>

              {/* Note */}
              <p className="mt-3 sm:mt-4 text-sm text-red-600 font-medium">
                {t.hero.note}
              </p>
            </motion.div>

            {/* Hero Image - Hidden on very small screens */}
            <motion.div
              className="relative hidden sm:flex justify-center lg:justify-end"
              initial={reducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-full max-w-[400px] lg:max-w-[520px]">
        <Image
                  src="/images/hero-image.png"
                  alt="Professional pilot"
                  width={520}
                  height={600}
                  className="w-full h-auto border border-gray-200 shadow-xl"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
          priority
        />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Trust Badges - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-8 sm:py-12 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <p className="text-center text-[10px] sm:text-xs font-medium uppercase tracking-widest text-gray-400 mb-6 sm:mb-8">
            {t.trust.label}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-16">
            {trustLogos.map((logo) => (
              <div key={logo.name} className="flex flex-col items-center gap-1 sm:gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <Image src={logo.src} alt={logo.alt} width={40} height={40} className="h-8 sm:h-10 w-auto" />
                <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Airlines Marquee - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-8 sm:py-12 bg-gray-100 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 mb-4 sm:mb-6">
          <p className="text-center text-[10px] sm:text-xs font-medium uppercase tracking-widest text-gray-400">
            {t.airlines.label}
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-gray-100 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-gray-100 to-transparent z-10" />
          
          <motion.div
            className="flex gap-8 sm:gap-16"
            animate={reducedMotion ? {} : { x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[...airlineLogos, ...airlineLogos].map((logo, i) => (
              <div
                key={i}
                className={cn(
                  'flex-shrink-0 h-8 sm:h-12 flex items-center justify-center px-2 sm:px-4',
                  logo.featured ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                )}
          >
            <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={logo.featured ? 48 : 36}
                  className={cn('h-auto object-contain', logo.featured ? 'max-h-8 sm:max-h-12' : 'max-h-6 sm:max-h-9')}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Problems Section - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <motion.h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-8 sm:mb-12" {...motionProps} variants={fadeInUp}>
            {t.problems.title}
          </motion.h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {t.problems.items.map((problem, i) => (
              <motion.div
                key={i}
                className="p-5 sm:p-8 bg-white border border-gray-200"
                {...motionProps}
                variants={fadeInUp}
              >
                <span className="text-xs font-semibold text-red-600 mb-3 sm:mb-4 block">{problem.num}</span>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{problem.title}</h3>
                <p className="text-gray-600 text-sm sm:text-[15px] leading-relaxed">{problem.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Features Section - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <motion.div className="mb-8 sm:mb-12" {...motionProps} variants={fadeInUp}>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-2">{t.features.title}</h2>
            <p className="text-base sm:text-lg text-gray-600">{t.features.subtitle}</p>
          </motion.div>

          <div className="space-y-12 sm:space-y-24">
            {t.features.items.map((feature, i) => {
              const isReverse = i % 2 === 1;
              const imageSrc = i === 0 
                ? '/images/vocabulary-screen.png' 
                : i === 1 
                  ? '/images/listening-screen.png' 
                  : '/images/speaking-screen.png';

              return (
                <motion.div
                  key={i}
                  className="grid md:grid-cols-2 gap-6 sm:gap-12 items-center"
                  {...motionProps}
                  variants={fadeInUp}
                >
                  <div className={cn(isReverse && 'md:order-2')}>
                    <span className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-2 sm:mb-3 block">
                      {feature.label}
                    </span>
                    <h3 className="text-xl sm:text-3xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">{feature.desc}</p>
                  </div>
                  <div className={cn('bg-gray-100 border border-gray-200 p-4 sm:p-8 flex items-center justify-center min-h-[250px] sm:min-h-[400px]', isReverse && 'md:order-1')}>
          <Image
                      src={imageSrc}
                      alt={feature.title}
                      width={400}
                      height={360}
                      className="max-w-full max-h-[200px] sm:max-h-[360px] object-contain"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* AI Training Section - Dark, Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-black text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <motion.div {...motionProps} variants={fadeInUp}>
              <span className="inline-block bg-red-600 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider mb-4 sm:mb-6">
                {t.ai.badge}
              </span>
              <h2 className="text-2xl sm:text-4xl font-semibold mb-4 sm:mb-6">{t.ai.title}</h2>
              <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-6 sm:mb-10">{t.ai.desc}</p>

              <div className="space-y-4 sm:space-y-6">
                {t.ai.features.map((f, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl flex-shrink-0 w-8 sm:w-10">{f.icon}</span>
                    <div>
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">{f.title}</h4>
                      <p className="text-gray-400 text-xs sm:text-[15px]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="flex justify-center"
              {...motionProps}
              variants={fadeInUp}
        >
          <Image
                src="/images/ai-training.png"
                alt="AI Training Interface"
                width={480}
                height={500}
                className="rounded-lg shadow-2xl max-h-[300px] sm:max-h-[500px] object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* How It Works - Dark, Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-black text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <motion.h2
            className="text-2xl sm:text-4xl font-semibold tracking-tight text-center mb-8 sm:mb-16"
            {...motionProps}
            variants={fadeInUp}
          >
            {t.howItWorks.title}
          </motion.h2>

          <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-4 sm:gap-6">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                <motion.div
                  className="flex-1 max-w-[280px] text-center"
                  {...motionProps}
                  variants={fadeInUp}
                >
                  <span className="inline-block px-3 py-1 border border-red-600 text-red-600 text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4">
                    {step.time}
                  </span>
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{step.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-[15px]">{step.desc}</p>
                </motion.div>
                {i < 2 && (
                  <span className="hidden md:block text-xl sm:text-2xl text-gray-600">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ICAO Levels - Mobile Cards Instead of Table */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <motion.h2
            className="text-2xl sm:text-4xl font-semibold tracking-tight text-center mb-8 sm:mb-12"
            {...motionProps}
            variants={fadeInUp}
          >
            {t.levels.title}
          </motion.h2>

          {/* Mobile: Cards */}
          <motion.div className="sm:hidden space-y-4" {...motionProps} variants={fadeInUp}>
            {t.levels.rows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  'border border-black p-4',
                  row.highlight && 'bg-gray-100'
                )}
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-2xl">
                    {row.level}
                  </span>
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-sm text-gray-600">{row.validity}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{row.req}</p>
              </div>
            ))}
          </motion.div>

          {/* Desktop: Table */}
          <motion.div className="hidden sm:block border border-black" {...motionProps} variants={fadeInUp}>
            {/* Header */}
            <div className="grid grid-cols-4 bg-black text-white text-xs font-semibold uppercase tracking-wider">
              <span className="px-6 py-4">Level</span>
              <span className="px-6 py-4">Name</span>
              <span className="px-6 py-4">Validity</span>
              <span className="px-6 py-4">Requirement</span>
            </div>
            {/* Rows */}
            {t.levels.rows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-4 border-t border-gray-200',
                  row.highlight && 'bg-gray-100'
                )}
              >
                <span className="px-6 py-4 flex items-center justify-center font-bold text-xl">{row.level}</span>
                <span className="px-6 py-4 flex items-center">{row.name}</span>
                <span className="px-6 py-4 flex items-center text-gray-600">{row.validity}</span>
                <span className="px-6 py-4 flex items-center text-gray-600">{row.req}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Social Proof - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-gray-100">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8 text-center">
          <motion.blockquote
            className="text-base sm:text-xl leading-relaxed text-gray-800 italic mb-8 sm:mb-12"
            {...motionProps}
            variants={fadeInUp}
          >
            &ldquo;{t.proof.quote}&rdquo;
          </motion.blockquote>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16"
            {...motionProps}
            variants={fadeInUp}
          >
            {t.proof.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <span className="block text-3xl sm:text-5xl font-bold mb-1 sm:mb-2">{stat.value}</span>
                <span className="text-xs sm:text-sm uppercase tracking-wider text-gray-600">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Final CTA - Mobile Responsive */}
      {/* ================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-t border-gray-200 text-center">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <motion.div {...motionProps} variants={fadeInUp}>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3 sm:mb-4">{t.cta.title}</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-10">{t.cta.subtitle}</p>
            <Link
              href="/register"
              className="inline-block w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-black text-white font-semibold text-base sm:text-lg border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors"
            >
              {t.cta.button}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Footer - Mobile Responsive */}
      {/* ================================================================= */}
      <footer className="py-8 sm:py-12 bg-black text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 sm:pb-8 border-b border-gray-800 mb-6 sm:mb-8">
            <span className="text-lg sm:text-xl font-bold">AviLingo</span>
            <span className="text-gray-400 text-sm sm:text-base">{t.footer.tagline}</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6">
            <Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-600">{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
