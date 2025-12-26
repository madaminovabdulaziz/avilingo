import React, { useState } from 'react';

const colors = {
  bg: { primary: '#0F172A', secondary: '#1E293B', elevated: '#334155' },
  text: { primary: '#F8FAFC', secondary: '#94A3B8', muted: '#64748B' },
  accent: { primary: '#38BDF8', secondary: '#818CF8', success: '#4ADE80', warning: '#FBBF24', error: '#F87171' }
};

const PhoneFrame = ({ children, title }) => (
  <div className="flex flex-col items-center">
    <div className="text-sm font-medium text-gray-400 mb-2">{title}</div>
    <div className="w-72 h-[600px] rounded-[40px] bg-black p-2 shadow-2xl">
      <div className="w-full h-full rounded-[32px] overflow-hidden relative" style={{ background: colors.bg.primary }}>
        <div className="h-11 flex items-center justify-between px-6 pt-2">
          <span className="text-xs font-medium" style={{ color: colors.text.primary }}>9:41</span>
          <div className="w-20 h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex gap-1">
            <span className="text-xs" style={{ color: colors.text.primary }}>📶🔋</span>
          </div>
        </div>
        <div className="h-[calc(100%-44px)] overflow-y-auto">
          {children}
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  </div>
);

// ONBOARDING SCREENS

const OnboardingWelcome = () => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-6">✈️</div>
      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>AviLingo</h1>
      <p className="text-lg mb-2" style={{ color: colors.accent.primary }}>Pass ICAO Level 4+</p>
      <p className="text-sm" style={{ color: colors.text.muted }}>
        The fastest path from broken aviation English to ICAO certification
      </p>
    </div>
    <div className="mb-8">
      <button className="w-full py-4 rounded-xl font-semibold text-white mb-3" style={{ background: colors.accent.primary }}>
        Get Started
      </button>
      <button className="w-full py-3 rounded-xl font-medium" style={{ color: colors.text.secondary }}>
        I already have an account
      </button>
    </div>
  </div>
);

const OnboardingName = () => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex items-center mb-8">
      <button style={{ color: colors.text.muted }}>←</button>
      <div className="flex-1 flex justify-center gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ background: i === 1 ? colors.accent.primary : colors.bg.secondary }} />
        ))}
      </div>
      <div className="w-4" />
    </div>
    
    <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>What's your name?</h1>
    <p className="text-sm mb-8" style={{ color: colors.text.muted }}>So we can personalize your experience</p>
    
    <div className="mb-4">
      <input 
        type="text" 
        placeholder="Enter your name"
        className="w-full p-4 rounded-xl text-white placeholder-gray-500 outline-none"
        style={{ background: colors.bg.secondary }}
      />
    </div>
    
    <div className="mt-auto mb-8">
      <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ background: colors.accent.primary }}>
        Continue
      </button>
    </div>
  </div>
);

const OnboardingLanguage = () => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex items-center mb-8">
      <button style={{ color: colors.text.muted }}>←</button>
      <div className="flex-1 flex justify-center gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ background: i <= 2 ? colors.accent.primary : colors.bg.secondary }} />
        ))}
      </div>
      <div className="w-4" />
    </div>
    
    <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>What's your native language?</h1>
    <p className="text-sm mb-6" style={{ color: colors.text.muted }}>This helps us provide better feedback</p>
    
    <div className="space-y-2 flex-1">
      {[
        { flag: '🇷🇺', name: 'Russian', selected: true },
        { flag: '🇺🇿', name: 'Uzbek', selected: false },
        { flag: '🇰🇿', name: 'Kazakh', selected: false },
        { flag: '🇨🇳', name: 'Chinese', selected: false },
        { flag: '🇹🇷', name: 'Turkish', selected: false },
        { flag: '🌍', name: 'Other', selected: false },
      ].map(lang => (
        <button key={lang.name} className="w-full p-4 rounded-xl flex items-center gap-3 text-left"
          style={{ 
            background: lang.selected ? colors.accent.primary + '20' : colors.bg.secondary,
            border: lang.selected ? `2px solid ${colors.accent.primary}` : '2px solid transparent'
          }}>
          <span className="text-2xl">{lang.flag}</span>
          <span className="font-medium" style={{ color: colors.text.primary }}>{lang.name}</span>
          {lang.selected && <span className="ml-auto" style={{ color: colors.accent.primary }}>✓</span>}
        </button>
      ))}
    </div>
    
    <div className="mt-4 mb-8">
      <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ background: colors.accent.primary }}>
        Continue
      </button>
    </div>
  </div>
);

const OnboardingLevel = () => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex items-center mb-8">
      <button style={{ color: colors.text.muted }}>←</button>
      <div className="flex-1 flex justify-center gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ background: i <= 3 ? colors.accent.primary : colors.bg.secondary }} />
        ))}
      </div>
      <div className="w-4" />
    </div>
    
    <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>Current ICAO Level?</h1>
    <p className="text-sm mb-6" style={{ color: colors.text.muted }}>Select your most recent test result</p>
    
    <div className="space-y-2 flex-1">
      {[
        { level: 'Not tested yet', desc: "I haven't taken the test" },
        { level: 'Level 3', desc: 'Pre-operational' },
        { level: 'Level 4', desc: 'Operational', selected: true },
        { level: 'Level 5', desc: 'Extended' },
        { level: 'Level 6', desc: 'Expert' },
      ].map(item => (
        <button key={item.level} className="w-full p-4 rounded-xl flex items-center justify-between text-left"
          style={{ 
            background: item.selected ? colors.accent.primary + '20' : colors.bg.secondary,
            border: item.selected ? `2px solid ${colors.accent.primary}` : '2px solid transparent'
          }}>
          <div>
            <p className="font-medium" style={{ color: colors.text.primary }}>{item.level}</p>
            <p className="text-xs" style={{ color: colors.text.muted }}>{item.desc}</p>
          </div>
          {item.selected && <span style={{ color: colors.accent.primary }}>✓</span>}
        </button>
      ))}
    </div>
    
    <div className="mt-4 mb-8">
      <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ background: colors.accent.primary }}>
        Continue
      </button>
    </div>
  </div>
);

const OnboardingTarget = () => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex items-center mb-8">
      <button style={{ color: colors.text.muted }}>←</button>
      <div className="flex-1 flex justify-center gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ background: i <= 4 ? colors.accent.primary : colors.bg.secondary }} />
        ))}
      </div>
      <div className="w-4" />
    </div>
    
    <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>What's your goal?</h1>
    <p className="text-sm mb-6" style={{ color: colors.text.muted }}>What level do you need to achieve?</p>
    
    <div className="space-y-3 flex-1">
      {[
        { level: 'Level 4', desc: 'Operational — Required for international flights', icon: '✈️', selected: true },
        { level: 'Level 5', desc: 'Extended — Retest every 6 years', icon: '🌟' },
        { level: 'Level 6', desc: 'Expert — No retest required', icon: '👑' },
      ].map(item => (
        <button key={item.level} className="w-full p-4 rounded-xl flex items-center gap-3 text-left"
          style={{ 
            background: item.selected ? colors.accent.primary + '20' : colors.bg.secondary,
            border: item.selected ? `2px solid ${colors.accent.primary}` : '2px solid transparent'
          }}>
          <span className="text-2xl">{item.icon}</span>
          <div className="flex-1">
            <p className="font-medium" style={{ color: colors.text.primary }}>{item.level}</p>
            <p className="text-xs" style={{ color: colors.text.muted }}>{item.desc}</p>
          </div>
          {item.selected && <span style={{ color: colors.accent.primary }}>✓</span>}
        </button>
      ))}
    </div>
    
    <div className="mt-4 mb-8">
      <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ background: colors.accent.primary }}>
        Continue
      </button>
    </div>
  </div>
);

const OnboardingTestDate = () => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex items-center mb-8">
      <button style={{ color: colors.text.muted }}>←</button>
      <div className="flex-1 flex justify-center gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ background: colors.accent.primary }} />
        ))}
      </div>
      <div className="w-4" />
    </div>
    
    <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>When is your test?</h1>
    <p className="text-sm mb-6" style={{ color: colors.text.muted }}>We'll help you prepare on time</p>
    
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <div className="flex items-center justify-between mb-4">
        <span style={{ color: colors.text.muted }}>←</span>
        <span className="font-medium" style={{ color: colors.text.primary }}>February 2025</span>
        <span style={{ color: colors.text.muted }}>→</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {['S','M','T','W','T','F','S'].map(d => (
          <span key={d} style={{ color: colors.text.muted }}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {[...Array(31)].map((_, i) => (
          <button key={i} className={`w-8 h-8 rounded-full text-xs flex items-center justify-center mx-auto
            ${i === 9 ? 'font-bold' : ''}`}
            style={{ 
              background: i === 9 ? colors.accent.primary : 'transparent',
              color: i === 9 ? 'white' : colors.text.secondary
            }}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
    
    <button className="text-sm mb-4" style={{ color: colors.accent.primary }}>
      I don't know my test date yet
    </button>
    
    <div className="mt-auto mb-8">
      <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ background: colors.accent.primary }}>
        Start Learning
      </button>
    </div>
  </div>
);

// PRACTICE SCREENS

const PracticeHub = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>Practice</h1>
    
    {/* Quick Actions */}
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { icon: '📚', label: 'Review\nCards', count: '12 due', color: colors.accent.primary },
        { icon: '🎧', label: 'Quick\nListen', count: '5 new', color: colors.accent.success },
        { icon: '🎤', label: 'Speak\nPractice', count: '3 new', color: colors.accent.secondary },
      ].map(item => (
        <button key={item.label} className="rounded-xl p-3 text-center" style={{ background: colors.bg.secondary }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mx-auto mb-2"
            style={{ background: item.color + '20' }}>
            {item.icon}
          </div>
          <p className="text-xs font-medium whitespace-pre-line" style={{ color: colors.text.primary }}>{item.label}</p>
          <p className="text-[10px]" style={{ color: item.color }}>{item.count}</p>
        </button>
      ))}
    </div>

    {/* Categories */}
    <p className="text-xs font-medium mb-3" style={{ color: colors.text.muted }}>VOCABULARY CATEGORIES</p>
    {[
      { name: 'Emergencies', count: 48, mastery: 72, icon: '🚨' },
      { name: 'Weather', count: 35, mastery: 85, icon: '⛈️' },
      { name: 'Navigation', count: 42, mastery: 64, icon: '🧭' },
      { name: 'ATC Phraseology', count: 56, mastery: 78, icon: '📡' },
      { name: 'Aircraft Systems', count: 38, mastery: 45, icon: '✈️' },
    ].map(cat => (
      <button key={cat.name} className="w-full rounded-xl p-3 mb-2 flex items-center gap-3" 
        style={{ background: colors.bg.secondary }}>
        <span className="text-2xl">{cat.icon}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{cat.name}</p>
          <p className="text-xs" style={{ color: colors.text.muted }}>{cat.count} terms</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium" style={{ color: colors.accent.success }}>{cat.mastery}%</p>
          <p className="text-[10px]" style={{ color: colors.text.muted }}>mastered</p>
        </div>
      </button>
    ))}
    
    {/* Tab Bar placeholder */}
    <div className="h-20" />
  </div>
);

const ListeningBrowse = () => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-bold" style={{ color: colors.text.primary }}>Listening</h1>
      <button className="px-3 py-1 rounded-full text-xs" style={{ background: colors.bg.secondary, color: colors.text.secondary }}>
        Filter
      </button>
    </div>
    
    {/* Difficulty Tabs */}
    <div className="flex gap-2 mb-4">
      {['All', 'Beginner', 'Intermediate', 'Advanced'].map((tab, i) => (
        <button key={tab} className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ 
            background: i === 0 ? colors.accent.primary : colors.bg.secondary,
            color: i === 0 ? 'white' : colors.text.secondary
          }}>
          {tab}
        </button>
      ))}
    </div>

    {/* Exercise List */}
    {[
      { title: 'JFK Departure Clearance', accent: '🇺🇸', difficulty: 'Intermediate', duration: '0:32', done: true },
      { title: 'Heathrow Approach', accent: '🇬🇧', difficulty: 'Advanced', duration: '0:45', done: true },
      { title: 'Mumbai Ground Control', accent: '🇮🇳', difficulty: 'Advanced', duration: '0:38', done: false },
      { title: 'Basic Position Report', accent: '🇺🇸', difficulty: 'Beginner', duration: '0:22', done: false },
      { title: 'Weather Deviation Request', accent: '🇺🇸', difficulty: 'Intermediate', duration: '0:41', done: false },
    ].map((ex, i) => (
      <button key={i} className="w-full rounded-xl p-3 mb-2 flex items-center gap-3" 
        style={{ background: colors.bg.secondary }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ background: colors.accent.secondary + '20' }}>
          {ex.done ? '✓' : '🎧'}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{ex.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs">{ex.accent}</span>
            <span className="text-xs" style={{ color: colors.text.muted }}>{ex.difficulty}</span>
            <span className="text-xs" style={{ color: colors.text.muted }}>•</span>
            <span className="text-xs" style={{ color: colors.text.muted }}>{ex.duration}</span>
          </div>
        </div>
        {ex.done && <span style={{ color: colors.accent.success }}>✓</span>}
      </button>
    ))}
    
    <div className="h-20" />
  </div>
);

// MAIN APP
const OnboardingWireframes = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  
  const screens = [
    { name: 'Welcome', component: <OnboardingWelcome /> },
    { name: 'Name', component: <OnboardingName /> },
    { name: 'Language', component: <OnboardingLanguage /> },
    { name: 'Current Level', component: <OnboardingLevel /> },
    { name: 'Target', component: <OnboardingTarget /> },
    { name: 'Test Date', component: <OnboardingTestDate /> },
    { name: 'Practice Hub', component: <PracticeHub /> },
    { name: 'Listening Browse', component: <ListeningBrowse /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">AviLingo Wireframes</h1>
        <p className="text-gray-400 text-center mb-6">Onboarding & Practice Screens</p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {screens.map((screen, i) => (
            <button
              key={i}
              onClick={() => setCurrentScreen(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentScreen === i ? 'bg-sky-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <PhoneFrame title={screens[currentScreen].name}>
            {screens[currentScreen].component}
          </PhoneFrame>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={() => setCurrentScreen(Math.max(0, currentScreen - 1))}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-30"
            disabled={currentScreen === 0}
          >
            ← Previous
          </button>
          <button 
            onClick={() => setCurrentScreen(Math.min(screens.length - 1, currentScreen + 1))}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-30"
            disabled={currentScreen === screens.length - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWireframes;
