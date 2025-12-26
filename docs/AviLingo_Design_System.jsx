import React, { useState } from 'react';

const DesignSystem = () => {
  const [mode, setMode] = useState('dark');
  const [activeSection, setActiveSection] = useState('philosophy');

  // Color palettes
  const colors = {
    dark: {
      bg: { primary: '#0F172A', secondary: '#1E293B', elevated: '#334155' },
      text: { primary: '#F8FAFC', secondary: '#94A3B8', muted: '#64748B' },
      accent: { primary: '#38BDF8', secondary: '#818CF8', success: '#4ADE80', warning: '#FBBF24', error: '#F87171' },
      aviation: { runway: '#22D3EE', altitude: '#A78BFA', heading: '#FB923C' }
    },
    light: {
      bg: { primary: '#F8FAFC', secondary: '#E2E8F0', elevated: '#FFFFFF' },
      text: { primary: '#0F172A', secondary: '#475569', muted: '#94A3B8' },
      accent: { primary: '#0284C7', secondary: '#6366F1', success: '#16A34A', warning: '#D97706', error: '#DC2626' },
      aviation: { runway: '#0891B2', altitude: '#7C3AED', heading: '#EA580C' }
    }
  };

  const c = colors[mode];

  const sections = {
    philosophy: {
      title: '🎯 Design Philosophy',
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h3 className="text-xl font-bold mb-3" style={{ color: c.accent.primary }}>The AviLingo Design Principle</h3>
            <p className="text-lg italic" style={{ color: c.text.secondary }}>
              "Professional enough for a captain, approachable enough for a cadet"
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: c.accent.primary + '40', background: c.bg.secondary }}>
              <h4 className="font-bold mb-2" style={{ color: c.accent.primary }}>✓ We ARE</h4>
              <ul className="space-y-1 text-sm" style={{ color: c.text.secondary }}>
                <li>• Professional & credible</li>
                <li>• Clean & focused</li>
                <li>• Aviation-aware</li>
                <li>• Dark mode native</li>
                <li>• Information-dense when needed</li>
                <li>• Confidence-building</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: c.accent.error + '40', background: c.bg.secondary }}>
              <h4 className="font-bold mb-2" style={{ color: c.accent.error }}>✗ We are NOT</h4>
              <ul className="space-y-1 text-sm" style={{ color: c.text.secondary }}>
                <li>• Childish or cartoonish</li>
                <li>• Gamified with hollow badges</li>
                <li>• Streak-anxiety inducing</li>
                <li>• Generic language app</li>
                <li>• Overwhelming with animations</li>
                <li>• Duolingo clone</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-3" style={{ color: c.text.primary }}>Design Pillars</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl mb-2">🎖️</div>
                <div className="font-semibold" style={{ color: c.text.primary }}>Authority</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Pilots trust this app</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-semibold" style={{ color: c.text.primary }}>Clarity</div>
                <div className="text-xs" style={{ color: c.text.muted }}>No cognitive overload</div>
              </div>
              <div>
                <div className="text-3xl mb-2">✈️</div>
                <div className="font-semibold" style={{ color: c.text.primary }}>Aviation DNA</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Feels like the cockpit</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    colors: {
      title: '🎨 Color System',
      content: (
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setMode('dark')} 
              className={`px-4 py-2 rounded-lg font-medium ${mode === 'dark' ? 'ring-2' : ''}`}
              style={{ background: colors.dark.bg.secondary, color: colors.dark.text.primary, ringColor: colors.dark.accent.primary }}
            >
              🌙 Dark Mode
            </button>
            <button 
              onClick={() => setMode('light')} 
              className={`px-4 py-2 rounded-lg font-medium ${mode === 'light' ? 'ring-2' : ''}`}
              style={{ background: colors.light.bg.secondary, color: colors.light.text.primary, ringColor: colors.light.accent.primary }}
            >
              ☀️ Light Mode
            </button>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-3" style={{ color: c.text.primary }}>Primary Palette: Sky Blue + Deep Slate</h4>
            <p className="text-sm mb-4" style={{ color: c.text.secondary }}>
              Blue = trust, focus, professionalism (aviation standard). Dark slate = cockpit environment, reduced eye strain.
            </p>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2" style={{ color: c.text.muted }}>Backgrounds</div>
                <div className="flex gap-2">
                  {Object.entries(c.bg).map(([name, color]) => (
                    <div key={name} className="flex-1">
                      <div className="h-12 rounded-lg border border-white/10" style={{ background: color }}></div>
                      <div className="text-xs mt-1" style={{ color: c.text.muted }}>{name}</div>
                      <div className="text-xs font-mono" style={{ color: c.text.muted }}>{color}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2" style={{ color: c.text.muted }}>Accent Colors</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(c.accent).map(([name, color]) => (
                    <div key={name} className="w-20">
                      <div className="h-12 rounded-lg" style={{ background: color }}></div>
                      <div className="text-xs mt-1 capitalize" style={{ color: c.text.muted }}>{name}</div>
                      <div className="text-xs font-mono" style={{ color: c.text.muted }}>{color}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2" style={{ color: c.text.muted }}>Aviation Semantic Colors</div>
                <div className="flex gap-2">
                  {Object.entries(c.aviation).map(([name, color]) => (
                    <div key={name} className="flex-1">
                      <div className="h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
                        {name === 'runway' && 'RWY 27L'}
                        {name === 'altitude' && 'FL350'}
                        {name === 'heading' && 'HDG 270°'}
                      </div>
                      <div className="text-xs mt-1 capitalize" style={{ color: c.text.muted }}>{name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-3" style={{ color: c.text.primary }}>ICAO Criteria Colors</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { name: 'Pronunciation', color: '#F472B6', icon: '🗣️' },
                { name: 'Structure', color: '#A78BFA', icon: '📝' },
                { name: 'Vocabulary', color: '#38BDF8', icon: '📚' },
                { name: 'Fluency', color: '#4ADE80', icon: '🌊' },
                { name: 'Comprehension', color: '#FBBF24', icon: '👂' },
                { name: 'Interaction', color: '#FB923C', icon: '🔄' },
              ].map(item => (
                <div key={item.name} className="text-center p-2 rounded-lg" style={{ background: item.color + '20' }}>
                  <div className="text-2xl">{item.icon}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: item.color }}>{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    typography: {
      title: '✏️ Typography',
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-3" style={{ color: c.text.primary }}>Font Stack</h4>
            <div className="space-y-4">
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="text-2xl font-bold" style={{ color: c.text.primary, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Inter (Primary)
                </div>
                <div className="text-sm" style={{ color: c.text.muted }}>Clean, modern, highly legible. Used for UI elements, body text.</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="text-2xl font-bold" style={{ color: c.text.primary, fontFamily: 'JetBrains Mono, monospace' }}>
                  JetBrains Mono (Aviation)
                </div>
                <div className="text-sm" style={{ color: c.text.muted }}>For callsigns, frequencies, altitudes. Aviation feel.</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-3" style={{ color: c.text.primary }}>Type Scale</h4>
            <div className="space-y-3">
              <div className="flex items-baseline gap-4">
                <span className="text-xs w-16" style={{ color: c.text.muted }}>32px</span>
                <span className="text-3xl font-bold" style={{ color: c.text.primary }}>ICAO Level 4</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs w-16" style={{ color: c.text.muted }}>24px</span>
                <span className="text-2xl font-semibold" style={{ color: c.text.primary }}>Session Complete</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs w-16" style={{ color: c.text.muted }}>18px</span>
                <span className="text-lg font-medium" style={{ color: c.text.primary }}>Vocabulary Review</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs w-16" style={{ color: c.text.muted }}>16px</span>
                <span className="text-base" style={{ color: c.text.primary }}>Body text for definitions and explanations</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs w-16" style={{ color: c.text.muted }}>14px</span>
                <span className="text-sm" style={{ color: c.text.secondary }}>Secondary text and labels</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs w-16" style={{ color: c.text.muted }}>12px</span>
                <span className="text-xs" style={{ color: c.text.muted }}>Captions and metadata</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-3" style={{ color: c.text.primary }}>Aviation Typography</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-2xl font-mono font-bold" style={{ color: c.aviation.runway }}>UAL 472</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Callsign</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-2xl font-mono font-bold" style={{ color: c.aviation.altitude }}>FL 350</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Altitude</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-2xl font-mono font-bold" style={{ color: c.aviation.heading }}>HDG 270</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Heading</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-2xl font-mono font-bold" style={{ color: c.accent.success }}>118.7</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Frequency</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    components: {
      title: '🧩 Components',
      content: (
        <div className="space-y-6">
          {/* Buttons */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Buttons</h4>
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: c.accent.primary }}>
                Start Session
              </button>
              <button className="px-6 py-3 rounded-xl font-semibold border-2" style={{ borderColor: c.accent.primary, color: c.accent.primary }}>
                Browse
              </button>
              <button className="px-6 py-3 rounded-xl font-semibold" style={{ background: c.accent.success, color: '#000' }}>
                ✓ Correct
              </button>
              <button className="px-6 py-3 rounded-xl font-semibold" style={{ background: c.accent.error }}>
                ✗ Try Again
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Flashcard</h4>
            <div className="max-w-sm mx-auto">
              <div className="rounded-2xl p-6 text-center" style={{ background: c.bg.elevated, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div className="text-xs font-medium mb-2 px-2 py-1 rounded-full inline-block" style={{ background: c.accent.primary + '20', color: c.accent.primary }}>
                  EMERGENCIES
                </div>
                <div className="text-3xl font-bold my-6" style={{ color: c.text.primary }}>
                  go-around
                </div>
                <div className="text-sm" style={{ color: c.text.muted }}>
                  Tap to reveal definition
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>ICAO Level Gauge</h4>
            <div className="max-w-xs mx-auto text-center">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke={c.bg.elevated} strokeWidth="12" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke={c.accent.primary} strokeWidth="12" fill="none" 
                    strokeDasharray="352" strokeDashoffset="88" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: c.text.primary }}>4</span>
                  <span className="text-xs" style={{ color: c.text.muted }}>Predicted</span>
                </div>
              </div>
              <div className="mt-4 text-sm" style={{ color: c.accent.success }}>
                ↑ 0.3 from last week
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Audio Player</h4>
            <div className="max-w-md mx-auto p-4 rounded-xl" style={{ background: c.bg.elevated }}>
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: c.accent.primary }}>
                  ▶
                </button>
                <div className="flex-1">
                  <div className="h-2 rounded-full" style={{ background: c.bg.secondary }}>
                    <div className="h-2 rounded-full w-1/3" style={{ background: c.accent.primary }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs" style={{ color: c.text.muted }}>
                    <span>0:12</span>
                    <span>0:45</span>
                  </div>
                </div>
                <button className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: c.accent.primary + '20', color: c.accent.primary }}>
                  0.75x
                </button>
              </div>
              <div className="mt-3 text-center text-xs" style={{ color: c.text.muted }}>
                🇺🇸 American • JFK Approach
              </div>
            </div>
          </div>

          {/* Recording UI */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Recording Interface</h4>
            <div className="max-w-md mx-auto p-6 rounded-xl text-center" style={{ background: c.bg.elevated }}>
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center animate-pulse" style={{ background: c.accent.error + '30', border: `3px solid ${c.accent.error}` }}>
                <div className="w-12 h-12 rounded-full" style={{ background: c.accent.error }}></div>
              </div>
              <div className="mt-4 font-mono text-2xl" style={{ color: c.accent.error }}>00:12</div>
              <div className="mt-2 text-sm" style={{ color: c.text.muted }}>Recording your response...</div>
              <button className="mt-4 px-6 py-2 rounded-xl font-medium" style={{ background: c.bg.secondary, color: c.text.primary }}>
                ⬛ Stop
              </button>
            </div>
          </div>
        </div>
      )
    },
    layout: {
      title: '📐 Layout & Navigation',
      content: (
        <div className="space-y-6">
          {/* Navigation Bar */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Bottom Navigation</h4>
            <div className="max-w-md mx-auto">
              <div className="flex justify-around items-center p-4 rounded-2xl" style={{ background: c.bg.elevated }}>
                {[
                  { icon: '🏠', label: 'Home', active: true },
                  { icon: '📚', label: 'Practice', active: false },
                  { icon: '📈', label: 'Progress', active: false },
                  { icon: '👤', label: 'Profile', active: false },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`text-2xl ${item.active ? '' : 'opacity-50'}`}>{item.icon}</div>
                    <div className="text-xs mt-1" style={{ color: item.active ? c.accent.primary : c.text.muted }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Safe Areas */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Layout Principles</h4>
            <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: c.text.secondary }}>
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="font-medium mb-1" style={{ color: c.text.primary }}>Spacing Scale</div>
                <div>4px base unit</div>
                <div>8, 12, 16, 24, 32, 48</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="font-medium mb-1" style={{ color: c.text.primary }}>Border Radius</div>
                <div>Cards: 16-24px</div>
                <div>Buttons: 12px</div>
                <div>Chips: full (999px)</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="font-medium mb-1" style={{ color: c.text.primary }}>Touch Targets</div>
                <div>Min 44x44px (Apple HIG)</div>
                <div>Prefer 48x48px</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="font-medium mb-1" style={{ color: c.text.primary }}>Safe Areas</div>
                <div>Top: 59px (notch)</div>
                <div>Bottom: 34px (home)</div>
              </div>
            </div>
          </div>

          {/* Screen Structure */}
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Screen Structure</h4>
            <div className="max-w-xs mx-auto border-2 rounded-3xl overflow-hidden" style={{ borderColor: c.text.muted }}>
              <div className="h-6 flex items-center justify-center text-xs" style={{ background: c.bg.elevated, color: c.text.muted }}>
                Status Bar
              </div>
              <div className="p-3 text-center border-b" style={{ background: c.bg.secondary, borderColor: c.bg.elevated }}>
                <span className="font-semibold" style={{ color: c.text.primary }}>Header</span>
              </div>
              <div className="h-48 flex items-center justify-center" style={{ background: c.bg.primary }}>
                <span style={{ color: c.text.muted }}>Content Area</span>
              </div>
              <div className="p-3 text-center border-t" style={{ background: c.bg.elevated, borderColor: c.bg.secondary }}>
                <span className="text-sm" style={{ color: c.text.muted }}>Tab Bar</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    motion: {
      title: '🎬 Motion & Animation',
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Animation Philosophy</h4>
            <p className="mb-4" style={{ color: c.text.secondary }}>
              Animations should be <strong style={{ color: c.text.primary }}>functional, not decorative</strong>. They guide attention, 
              provide feedback, and create spatial relationships—never distract from learning.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="font-medium mb-2" style={{ color: c.accent.success }}>✓ Use For</div>
                <ul className="text-sm space-y-1" style={{ color: c.text.secondary }}>
                  <li>• Card flip reveals</li>
                  <li>• Progress updates</li>
                  <li>• Button feedback</li>
                  <li>• Screen transitions</li>
                  <li>• Recording pulse</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.bg.elevated }}>
                <div className="font-medium mb-2" style={{ color: c.accent.error }}>✗ Avoid</div>
                <ul className="text-sm space-y-1" style={{ color: c.text.secondary }}>
                  <li>• Celebratory confetti</li>
                  <li>• Bouncing mascots</li>
                  <li>• Unnecessary loading</li>
                  <li>• Auto-playing GIFs</li>
                  <li>• Streak fire effects</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Timing Curves</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium" style={{ color: c.text.primary }}>Micro</div>
                <div className="flex-1 h-8 rounded" style={{ background: c.bg.elevated }}>
                  <div className="h-full w-8 rounded flex items-center justify-center text-xs transition-all duration-100" style={{ background: c.accent.primary }}>
                    100ms
                  </div>
                </div>
                <div className="text-xs" style={{ color: c.text.muted }}>Button press</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium" style={{ color: c.text.primary }}>Standard</div>
                <div className="flex-1 h-8 rounded" style={{ background: c.bg.elevated }}>
                  <div className="h-full w-16 rounded flex items-center justify-center text-xs" style={{ background: c.accent.secondary }}>
                    200ms
                  </div>
                </div>
                <div className="text-xs" style={{ color: c.text.muted }}>Card flip</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium" style={{ color: c.text.primary }}>Complex</div>
                <div className="flex-1 h-8 rounded" style={{ background: c.bg.elevated }}>
                  <div className="h-full w-24 rounded flex items-center justify-center text-xs" style={{ background: c.accent.success }}>
                    300-400ms
                  </div>
                </div>
                <div className="text-xs" style={{ color: c.text.muted }}>Screen transition</div>
              </div>
            </div>
            <div className="mt-4 text-sm" style={{ color: c.text.muted }}>
              Easing: <code className="px-1 rounded" style={{ background: c.bg.elevated }}>ease-out</code> for entrances, 
              <code className="px-1 rounded" style={{ background: c.bg.elevated }}>ease-in</code> for exits
            </div>
          </div>
        </div>
      )
    },
    aviation: {
      title: '✈️ Aviation Elements',
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Subtle Aviation Cues</h4>
            <p className="mb-4" style={{ color: c.text.secondary }}>
              We reference aviation design language without being kitschy. Think glass cockpit instruments, not cartoon planes.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-3xl mb-2">🛫</div>
                <div className="font-medium" style={{ color: c.text.primary }}>Progress = Altitude</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Rising toward your ICAO level</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-3xl mb-2">📋</div>
                <div className="font-medium" style={{ color: c.text.primary }}>Sessions = Logbook</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Track study like flight hours</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-3xl mb-2">✓</div>
                <div className="font-medium" style={{ color: c.text.primary }}>Skills = Type Ratings</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Earn certifications per area</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ background: c.bg.elevated }}>
                <div className="text-3xl mb-2">🎚️</div>
                <div className="font-medium" style={{ color: c.text.primary }}>Gauges Not Bars</div>
                <div className="text-xs" style={{ color: c.text.muted }}>Instrument-style indicators</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Instrument-Style Progress</h4>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: c.accent.primary, background: c.bg.elevated }}>
                  <div>
                    <div className="text-2xl font-bold font-mono" style={{ color: c.accent.primary }}>75%</div>
                    <div className="text-xs" style={{ color: c.text.muted }}>VOCAB</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: c.accent.success, background: c.bg.elevated }}>
                  <div>
                    <div className="text-2xl font-bold font-mono" style={{ color: c.accent.success }}>82%</div>
                    <div className="text-xs" style={{ color: c.text.muted }}>LISTEN</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: c.accent.warning, background: c.bg.elevated }}>
                  <div>
                    <div className="text-2xl font-bold font-mono" style={{ color: c.accent.warning }}>68%</div>
                    <div className="text-xs" style={{ color: c.text.muted }}>SPEAK</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: c.bg.secondary }}>
            <h4 className="font-bold mb-4" style={{ color: c.text.primary }}>Test Countdown Widget</h4>
            <div className="max-w-sm mx-auto p-4 rounded-xl" style={{ background: c.bg.elevated }}>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono" style={{ color: c.accent.warning }}>47</div>
                  <div className="text-xs" style={{ color: c.text.muted }}>DAYS</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: c.text.primary }}>Until ICAO Test</div>
                  <div className="text-xs" style={{ color: c.text.muted }}>Feb 10, 2025 • Tashkent</div>
                  <div className="mt-2 h-2 rounded-full" style={{ background: c.bg.secondary }}>
                    <div className="h-2 rounded-full" style={{ background: c.accent.primary, width: '68%' }}></div>
                  </div>
                  <div className="text-xs mt-1" style={{ color: c.accent.success }}>On track for Level 4 ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: c.bg.primary, color: c.text.primary }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">AviLingo Design System</h1>
          <p style={{ color: c.text.secondary }}>UI/UX Concepts & Guidelines</p>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === key ? 'ring-2' : ''}`}
              style={{ 
                background: activeSection === key ? c.accent.primary : c.bg.secondary,
                color: activeSection === key ? '#fff' : c.text.secondary,
                ringColor: c.accent.primary
              }}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: c.accent.primary }}>
            {sections[activeSection].title}
          </h2>
          {sections[activeSection].content}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t" style={{ borderColor: c.bg.secondary }}>
          <p className="text-sm" style={{ color: c.text.muted }}>
            Ready to proceed → Wireframes using these guidelines
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesignSystem;
