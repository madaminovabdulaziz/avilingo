import React, { useState } from 'react';

// Design System Colors
const colors = {
  bg: { primary: '#0F172A', secondary: '#1E293B', elevated: '#334155' },
  text: { primary: '#F8FAFC', secondary: '#94A3B8', muted: '#64748B' },
  accent: { primary: '#38BDF8', secondary: '#818CF8', success: '#4ADE80', warning: '#FBBF24', error: '#F87171' },
  icao: { pronunciation: '#F472B6', structure: '#A78BFA', vocabulary: '#38BDF8', fluency: '#4ADE80', comprehension: '#FBBF24', interaction: '#FB923C' }
};

// Phone Frame Component
const PhoneFrame = ({ children, title }) => (
  <div className="flex flex-col items-center">
    <div className="text-sm font-medium text-gray-400 mb-2">{title}</div>
    <div className="w-72 h-[600px] rounded-[40px] bg-black p-2 shadow-2xl">
      <div className="w-full h-full rounded-[32px] overflow-hidden relative" style={{ background: colors.bg.primary }}>
        {/* Status Bar */}
        <div className="h-11 flex items-center justify-between px-6 pt-2">
          <span className="text-xs font-medium" style={{ color: colors.text.primary }}>9:41</span>
          <div className="w-20 h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex gap-1">
            <span className="text-xs" style={{ color: colors.text.primary }}>📶</span>
            <span className="text-xs" style={{ color: colors.text.primary }}>🔋</span>
          </div>
        </div>
        {/* Content */}
        <div className="h-[calc(100%-44px-70px)] overflow-y-auto">
          {children}
        </div>
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  </div>
);

// Tab Bar Component
const TabBar = ({ active = 'home' }) => (
  <div className="absolute bottom-8 left-0 right-0 h-16 flex justify-around items-center px-4" style={{ background: colors.bg.secondary }}>
    {[
      { id: 'home', icon: '🏠', label: 'Home' },
      { id: 'practice', icon: '📚', label: 'Practice' },
      { id: 'progress', icon: '📈', label: 'Progress' },
      { id: 'profile', icon: '👤', label: 'Profile' },
    ].map(tab => (
      <div key={tab.id} className="flex flex-col items-center">
        <span className={`text-xl ${active === tab.id ? '' : 'opacity-40'}`}>{tab.icon}</span>
        <span className="text-[10px] mt-0.5" style={{ color: active === tab.id ? colors.accent.primary : colors.text.muted }}>
          {tab.label}
        </span>
      </div>
    ))}
  </div>
);

// SCREEN 1: Home Screen
const HomeScreen = () => (
  <div className="p-4">
    {/* Greeting */}
    <div className="mb-6">
      <p className="text-sm" style={{ color: colors.text.muted }}>Good evening</p>
      <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Rustam 👋</h1>
    </div>

    {/* ICAO Level Card */}
    <div className="rounded-2xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" stroke={colors.bg.elevated} strokeWidth="8" fill="none" />
            <circle cx="40" cy="40" r="34" stroke={colors.accent.primary} strokeWidth="8" fill="none" 
              strokeDasharray="214" strokeDashoffset="53" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: colors.text.primary }}>4</span>
            <span className="text-[8px]" style={{ color: colors.text.muted }}>ICAO</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold" style={{ color: colors.text.primary }}>Predicted Level 4</p>
          <p className="text-xs" style={{ color: colors.accent.success }}>↑ 0.3 from last week</p>
          <div className="flex gap-1 mt-2">
            {Object.values(colors.icao).map((c, i) => (
              <div key={i} className="w-6 h-1.5 rounded-full" style={{ background: c, opacity: 0.6 + i * 0.08 }} />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Test Countdown */}
    <div className="rounded-2xl p-3 mb-4 flex items-center gap-3" style={{ background: colors.bg.secondary }}>
      <div className="text-center px-3 py-1 rounded-lg" style={{ background: colors.accent.warning + '20' }}>
        <span className="text-xl font-bold font-mono" style={{ color: colors.accent.warning }}>47</span>
        <p className="text-[8px]" style={{ color: colors.text.muted }}>DAYS</p>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Until ICAO Test</p>
        <p className="text-[10px]" style={{ color: colors.text.muted }}>Feb 10, 2025 • Tashkent</p>
      </div>
      <span style={{ color: colors.accent.success }}>✓</span>
    </div>

    {/* Start Session CTA */}
    <button className="w-full py-4 rounded-xl font-semibold text-white mb-4" style={{ background: colors.accent.primary }}>
      Start Today's Session
    </button>

    {/* Quick Stats */}
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { label: 'Cards Due', value: '12', icon: '📚' },
        { label: 'Streak', value: '7d', icon: '🔥' },
        { label: 'Study Time', value: '4.2h', icon: '⏱️' },
      ].map(stat => (
        <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: colors.bg.secondary }}>
          <span className="text-lg">{stat.icon}</span>
          <p className="text-lg font-bold" style={{ color: colors.text.primary }}>{stat.value}</p>
          <p className="text-[9px]" style={{ color: colors.text.muted }}>{stat.label}</p>
        </div>
      ))}
    </div>

    {/* Recent Activity */}
    <p className="text-xs font-medium mb-2" style={{ color: colors.text.muted }}>CONTINUE LEARNING</p>
    <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: colors.bg.secondary }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.accent.secondary + '30' }}>
        🎧
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: colors.text.primary }}>JFK Departure Clearance</p>
        <p className="text-[10px]" style={{ color: colors.text.muted }}>Listening • 60% complete</p>
      </div>
      <span style={{ color: colors.accent.primary }}>→</span>
    </div>
    <TabBar active="home" />
  </div>
);

// SCREEN 2: Flashcard Front
const FlashcardFront = () => (
  <div className="p-4 flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <button className="text-lg" style={{ color: colors.text.muted }}>←</button>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: colors.accent.primary + '20', color: colors.accent.primary }}>
          EMERGENCIES
        </span>
        <span className="text-xs" style={{ color: colors.text.muted }}>4/12</span>
      </div>
      <button className="text-lg" style={{ color: colors.text.muted }}>⋯</button>
    </div>

    {/* Progress */}
    <div className="h-1 rounded-full mb-6" style={{ background: colors.bg.secondary }}>
      <div className="h-1 rounded-full" style={{ background: colors.accent.primary, width: '33%' }} />
    </div>

    {/* Card */}
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full rounded-3xl p-8 text-center" style={{ background: colors.bg.secondary, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <p className="text-3xl font-bold mb-4" style={{ color: colors.text.primary }}>
          go-around
        </p>
        <p className="text-sm" style={{ color: colors.text.muted }}>
          /ˈɡoʊ.əˌraʊnd/
        </p>
        <div className="mt-8 pt-6 border-t" style={{ borderColor: colors.bg.elevated }}>
          <p className="text-xs" style={{ color: colors.text.muted }}>Tap to reveal definition</p>
        </div>
      </div>
    </div>

    {/* Hint */}
    <div className="text-center mt-4 mb-16">
      <p className="text-xs" style={{ color: colors.text.muted }}>Think about it first, then tap the card</p>
    </div>
  </div>
);

// SCREEN 3: Flashcard Back
const FlashcardBack = () => (
  <div className="p-4 flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <button className="text-lg" style={{ color: colors.text.muted }}>←</button>
      <span className="text-xs" style={{ color: colors.text.muted }}>4/12</span>
      <button className="text-lg" style={{ color: colors.text.muted }}>🔊</button>
    </div>

    {/* Card */}
    <div className="flex-1 overflow-y-auto">
      <div className="rounded-3xl p-6" style={{ background: colors.bg.secondary }}>
        <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>go-around</p>
        <p className="text-xs mb-4" style={{ color: colors.text.muted }}>/ˈɡoʊ.əˌraʊnd/ • noun/verb</p>
        
        <div className="mb-4">
          <p className="text-xs font-medium mb-1" style={{ color: colors.accent.primary }}>DEFINITION</p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            A maneuver where the pilot aborts landing and climbs away from the runway.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium mb-1" style={{ color: colors.accent.primary }}>ATC EXAMPLE</p>
          <p className="text-sm font-mono" style={{ color: colors.text.primary }}>
            "United 472, go around, traffic on runway"
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium mb-1" style={{ color: colors.accent.primary }}>YOUR RESPONSE</p>
          <p className="text-sm font-mono" style={{ color: colors.text.primary }}>
            "Going around, United 472"
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ background: colors.accent.warning + '15' }}>
          <p className="text-xs font-medium mb-1" style={{ color: colors.accent.warning }}>⚠️ COMMON ERROR</p>
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            Don't confuse with "missed approach" — different procedure
          </p>
        </div>
      </div>
    </div>

    {/* Rating Buttons */}
    <div className="grid grid-cols-3 gap-3 mt-4 mb-16">
      <button className="py-3 rounded-xl font-medium" style={{ background: colors.accent.error + '20', color: colors.accent.error }}>
        Forgot
      </button>
      <button className="py-3 rounded-xl font-medium" style={{ background: colors.accent.warning + '20', color: colors.accent.warning }}>
        Hard
      </button>
      <button className="py-3 rounded-xl font-medium" style={{ background: colors.accent.success + '20', color: colors.accent.success }}>
        Easy
      </button>
    </div>
  </div>
);

// SCREEN 4: Listening Exercise
const ListeningExercise = () => (
  <div className="p-4 flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <button className="text-lg" style={{ color: colors.text.muted }}>←</button>
      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Listening Practice</p>
      <span className="text-xs" style={{ color: colors.text.muted }}>1/2</span>
    </div>

    {/* Context Card */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: colors.accent.primary + '20', color: colors.accent.primary }}>
          🇺🇸 American
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: colors.accent.warning + '20', color: colors.accent.warning }}>
          Intermediate
        </span>
      </div>
      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>JFK Departure Clearance</p>
      <p className="text-xs" style={{ color: colors.text.muted }}>Listen to the clearance and answer questions</p>
    </div>

    {/* Audio Player */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <div className="flex items-center gap-4">
        <button className="w-14 h-14 rounded-full flex items-center justify-center text-xl" style={{ background: colors.accent.primary }}>
          ▶
        </button>
        <div className="flex-1">
          <div className="h-2 rounded-full" style={{ background: colors.bg.elevated }}>
            <div className="h-2 rounded-full" style={{ background: colors.accent.primary, width: '0%' }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px]" style={{ color: colors.text.muted }}>
            <span>0:00</span>
            <span>0:32</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: colors.bg.elevated, color: colors.text.secondary }}>
          ⟲ Replay
        </button>
        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: colors.bg.elevated, color: colors.text.secondary }}>
          0.75x
        </button>
      </div>
    </div>

    {/* Question */}
    <div className="flex-1">
      <p className="text-xs font-medium mb-3" style={{ color: colors.accent.primary }}>QUESTION 1 OF 3</p>
      <p className="text-base font-medium mb-4" style={{ color: colors.text.primary }}>
        What is the initial altitude assigned?
      </p>
      <div className="space-y-2">
        {['5,000 feet', '15,000 feet', 'FL350', 'FL250'].map((opt, i) => (
          <button key={i} className="w-full p-3 rounded-xl text-left text-sm flex items-center gap-3" 
            style={{ background: colors.bg.secondary, color: colors.text.primary }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" 
              style={{ background: colors.bg.elevated, color: colors.text.muted }}>
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>

    <button className="w-full py-3 rounded-xl font-medium mt-4 mb-16" style={{ background: colors.bg.secondary, color: colors.text.muted }}>
      Submit Answer
    </button>
  </div>
);

// SCREEN 5: Speaking Recording
const SpeakingRecording = () => (
  <div className="p-4 flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <button className="text-lg" style={{ color: colors.text.muted }}>←</button>
      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Speaking Practice</p>
      <span className="text-xs" style={{ color: colors.text.muted }}>2/3</span>
    </div>

    {/* Scenario */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <p className="text-xs font-medium mb-2" style={{ color: colors.accent.primary }}>SCENARIO</p>
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        You are the pilot of flight UAL472. ATC has given you a clearance. Read back the clearance correctly.
      </p>
    </div>

    {/* ATC Message */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.accent.primary + '15', borderLeft: `3px solid ${colors.accent.primary}` }}>
      <p className="text-xs font-medium mb-2" style={{ color: colors.accent.primary }}>🎧 ATC SAYS:</p>
      <p className="text-sm font-mono" style={{ color: colors.text.primary }}>
        "United 472, cleared to Los Angeles via the Kennedy One departure, radar vectors to MERIT, then as filed. Maintain 5,000, expect FL350 ten minutes after departure. Squawk 4521."
      </p>
      <button className="mt-3 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2" style={{ background: colors.bg.secondary, color: colors.text.secondary }}>
        🔊 Play Again
      </button>
    </div>

    {/* Recording Interface */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-pulse" 
        style={{ background: colors.accent.error + '20', border: `3px solid ${colors.accent.error}` }}>
        <div className="w-16 h-16 rounded-full" style={{ background: colors.accent.error }} />
      </div>
      <p className="text-3xl font-mono font-bold mb-2" style={{ color: colors.accent.error }}>00:08</p>
      <p className="text-sm" style={{ color: colors.text.muted }}>Recording your response...</p>
      
      {/* Waveform placeholder */}
      <div className="flex items-center gap-0.5 mt-4">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="w-1 rounded-full" 
            style={{ 
              background: colors.accent.error, 
              height: `${Math.random() * 24 + 8}px`,
              opacity: 0.4 + Math.random() * 0.6
            }} />
        ))}
      </div>
    </div>

    <button className="w-full py-3 rounded-xl font-medium mt-4 mb-16 flex items-center justify-center gap-2" 
      style={{ background: colors.bg.secondary, color: colors.text.primary }}>
      ⬛ Stop Recording
    </button>
  </div>
);

// SCREEN 6: Speaking Feedback
const SpeakingFeedback = () => (
  <div className="p-4 flex flex-col h-full overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <button className="text-lg" style={{ color: colors.text.muted }}>←</button>
      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Feedback</p>
      <button className="text-lg" style={{ color: colors.text.muted }}>⋯</button>
    </div>

    {/* Score */}
    <div className="rounded-xl p-4 mb-4 text-center" style={{ background: colors.bg.secondary }}>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: colors.accent.success + '20' }}>
        <span style={{ color: colors.accent.success }}>✓</span>
        <span className="text-sm font-medium" style={{ color: colors.accent.success }}>Good Response</span>
      </div>
      <div className="flex justify-center gap-4">
        {[
          { label: 'Pronunciation', score: 4, color: colors.icao.pronunciation },
          { label: 'Structure', score: 5, color: colors.icao.structure },
          { label: 'Vocabulary', score: 4, color: colors.icao.vocabulary },
        ].map(item => (
          <div key={item.label} className="text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto" 
              style={{ background: item.color + '20', color: item.color }}>
              {item.score}
            </div>
            <p className="text-[8px] mt-1" style={{ color: colors.text.muted }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Your Response */}
    <div className="rounded-xl p-3 mb-3" style={{ background: colors.bg.secondary }}>
      <p className="text-xs font-medium mb-2" style={{ color: colors.text.muted }}>YOUR RESPONSE</p>
      <p className="text-sm" style={{ color: colors.text.primary }}>
        "United 472, cleared to Los Angeles, Kennedy One departure, radar vectors MERIT then as filed, maintain 5,000, expect flight level 350 ten minutes after departure, squawk 4521."
      </p>
    </div>

    {/* Correct Response */}
    <div className="rounded-xl p-3 mb-3" style={{ background: colors.accent.success + '10', borderLeft: `3px solid ${colors.accent.success}` }}>
      <p className="text-xs font-medium mb-2" style={{ color: colors.accent.success }}>✓ MODEL RESPONSE</p>
      <p className="text-sm" style={{ color: colors.text.primary }}>
        "Cleared to Los Angeles, Kennedy One departure, radar vectors MERIT, then as filed, maintain 5,000, expect FL350 ten minutes after departure, squawk 4521, United 472."
      </p>
    </div>

    {/* AI Feedback */}
    <div className="rounded-xl p-3 mb-3" style={{ background: colors.bg.secondary }}>
      <p className="text-xs font-medium mb-2" style={{ color: colors.accent.primary }}>💡 FEEDBACK</p>
      <div className="space-y-2">
        <div className="flex gap-2">
          <span style={{ color: colors.accent.success }}>✓</span>
          <p className="text-xs" style={{ color: colors.text.secondary }}>Good use of standard phraseology</p>
        </div>
        <div className="flex gap-2">
          <span style={{ color: colors.accent.success }}>✓</span>
          <p className="text-xs" style={{ color: colors.text.secondary }}>All clearance elements included</p>
        </div>
        <div className="flex gap-2">
          <span style={{ color: colors.accent.warning }}>!</span>
          <p className="text-xs" style={{ color: colors.text.secondary }}>Callsign should be at the end of readback</p>
        </div>
        <div className="flex gap-2">
          <span style={{ color: colors.accent.warning }}>!</span>
          <p className="text-xs" style={{ color: colors.text.secondary }}>Use "FL350" not "flight level 350"</p>
        </div>
      </div>
    </div>

    <button className="w-full py-3 rounded-xl font-medium mt-2 mb-16" style={{ background: colors.accent.primary, color: 'white' }}>
      Continue
    </button>
  </div>
);

// SCREEN 7: Session Summary
const SessionSummary = () => (
  <div className="p-4 flex flex-col h-full">
    {/* Celebration */}
    <div className="text-center pt-8 pb-6">
      <span className="text-5xl">🎉</span>
      <h1 className="text-2xl font-bold mt-4" style={{ color: colors.text.primary }}>Session Complete!</h1>
      <p className="text-sm" style={{ color: colors.text.muted }}>Great work today, Rustam</p>
    </div>

    {/* Stats */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold" style={{ color: colors.accent.primary }}>12</p>
          <p className="text-[10px]" style={{ color: colors.text.muted }}>Cards Reviewed</p>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: colors.accent.success }}>85%</p>
          <p className="text-[10px]" style={{ color: colors.text.muted }}>Listening Score</p>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: colors.accent.secondary }}>4.2</p>
          <p className="text-[10px]" style={{ color: colors.text.muted }}>Speaking Level</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: colors.bg.elevated }}>
        <span className="text-lg">⏱️</span>
        <span className="text-sm" style={{ color: colors.text.secondary }}>14 minutes logged</span>
      </div>
    </div>

    {/* ICAO Progress */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: colors.text.primary }}>ICAO Progress</p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: colors.accent.success + '20', color: colors.accent.success }}>
          ↑ 0.1
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" stroke={colors.bg.elevated} strokeWidth="6" fill="none" />
            <circle cx="32" cy="32" r="26" stroke={colors.accent.primary} strokeWidth="6" fill="none" 
              strokeDasharray="163" strokeDashoffset="40" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: colors.text.primary }}>4.1</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs" style={{ color: colors.text.muted }}>You're making good progress toward</p>
          <p className="text-sm font-medium" style={{ color: colors.accent.primary }}>ICAO Level 4 (Operational)</p>
        </div>
      </div>
    </div>

    {/* Weak Area */}
    <div className="rounded-xl p-3 mb-4" style={{ background: colors.accent.warning + '10', borderLeft: `3px solid ${colors.accent.warning}` }}>
      <p className="text-xs font-medium mb-1" style={{ color: colors.accent.warning }}>Focus Area</p>
      <p className="text-sm" style={{ color: colors.text.primary }}>Fluency needs work — try to reduce pauses</p>
    </div>

    {/* Actions */}
    <div className="mt-auto mb-16">
      <button className="w-full py-3 rounded-xl font-medium mb-3" style={{ background: colors.accent.primary, color: 'white' }}>
        Done
      </button>
      <button className="w-full py-3 rounded-xl font-medium" style={{ background: colors.bg.secondary, color: colors.text.secondary }}>
        Practice More
      </button>
    </div>
  </div>
);

// SCREEN 8: Progress Dashboard
const ProgressDashboard = () => (
  <div className="p-4">
    {/* Header */}
    <h1 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>Progress</h1>

    {/* Main Gauge */}
    <div className="rounded-xl p-6 mb-4 text-center" style={{ background: colors.bg.secondary }}>
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r="54" stroke={colors.bg.elevated} strokeWidth="10" fill="none" />
          <circle cx="64" cy="64" r="54" stroke={colors.accent.primary} strokeWidth="10" fill="none" 
            strokeDasharray="339" strokeDashoffset="85" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: colors.text.primary }}>4.1</span>
          <span className="text-[10px]" style={{ color: colors.text.muted }}>PREDICTED</span>
        </div>
      </div>
      <p className="text-sm mt-4" style={{ color: colors.text.secondary }}>75% ready for Level 4</p>
    </div>

    {/* ICAO Criteria Breakdown */}
    <div className="rounded-xl p-4 mb-4" style={{ background: colors.bg.secondary }}>
      <p className="text-xs font-medium mb-3" style={{ color: colors.text.muted }}>ICAO CRITERIA</p>
      {[
        { name: 'Pronunciation', score: 4.2, color: colors.icao.pronunciation },
        { name: 'Structure', score: 4.5, color: colors.icao.structure },
        { name: 'Vocabulary', score: 4.3, color: colors.icao.vocabulary },
        { name: 'Fluency', score: 3.8, color: colors.icao.fluency },
        { name: 'Comprehension', score: 4.4, color: colors.icao.comprehension },
        { name: 'Interaction', score: 4.0, color: colors.icao.interaction },
      ].map(item => (
        <div key={item.name} className="flex items-center gap-3 mb-2">
          <span className="text-xs w-24" style={{ color: colors.text.secondary }}>{item.name}</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: colors.bg.elevated }}>
            <div className="h-2 rounded-full" style={{ background: item.color, width: `${(item.score / 6) * 100}%` }} />
          </div>
          <span className="text-xs font-mono w-8" style={{ color: item.color }}>{item.score}</span>
        </div>
      ))}
    </div>

    {/* Weekly Activity */}
    <div className="rounded-xl p-4 mb-16" style={{ background: colors.bg.secondary }}>
      <p className="text-xs font-medium mb-3" style={{ color: colors.text.muted }}>THIS WEEK</p>
      <div className="flex justify-between">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${i < 5 ? '' : 'opacity-30'}`}
              style={{ background: i < 5 ? colors.accent.success : colors.bg.elevated }}>
              {i < 5 && <span className="text-xs">✓</span>}
            </div>
            <span className="text-[10px]" style={{ color: colors.text.muted }}>{day}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: colors.bg.elevated }}>
        <span className="text-lg">🔥</span>
        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>5 day streak</span>
      </div>
    </div>
    <TabBar active="progress" />
  </div>
);

// Main App
const AviLingoWireframes = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  
  const screens = [
    { name: 'Home', component: <HomeScreen /> },
    { name: 'Flashcard Front', component: <FlashcardFront /> },
    { name: 'Flashcard Back', component: <FlashcardBack /> },
    { name: 'Listening', component: <ListeningExercise /> },
    { name: 'Recording', component: <SpeakingRecording /> },
    { name: 'Feedback', component: <SpeakingFeedback /> },
    { name: 'Summary', component: <SessionSummary /> },
    { name: 'Progress', component: <ProgressDashboard /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">AviLingo Wireframes</h1>
        <p className="text-gray-400 text-center mb-6">Interactive screen mockups • Click tabs to navigate</p>
        
        {/* Screen Selector */}
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

        {/* Phone Display */}
        <div className="flex justify-center">
          <PhoneFrame title={screens[currentScreen].name}>
            {screens[currentScreen].component}
          </PhoneFrame>
        </div>

        {/* Navigation Arrows */}
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

        {/* Screen Info */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          Screen {currentScreen + 1} of {screens.length}
        </div>
      </div>
    </div>
  );
};

export default AviLingoWireframes;
