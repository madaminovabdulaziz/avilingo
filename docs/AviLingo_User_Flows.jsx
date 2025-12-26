import React, { useState } from 'react';

const FlowDiagram = () => {
  const [activeFlow, setActiveFlow] = useState('session');
  
  const flows = {
    main: {
      title: "Main User Journey",
      steps: [
        { id: 1, label: "App Launch", color: "bg-blue-500", icon: "🚀" },
        { id: 2, label: "Onboarding", color: "bg-purple-500", icon: "👤", sub: "9 screens" },
        { id: 3, label: "Home Screen", color: "bg-green-500", icon: "🏠" },
        { id: 4, label: "Daily Session", color: "bg-orange-500", icon: "⏱️", sub: "15 min" },
        { id: 5, label: "Progress Update", color: "bg-pink-500", icon: "📈" },
        { id: 6, label: "Return Tomorrow", color: "bg-blue-500", icon: "🔔" },
      ]
    },
    session: {
      title: "15-Minute Session Flow",
      steps: [
        { id: 1, label: "Session Start", color: "bg-gray-500", icon: "▶️", time: "0:00" },
        { id: 2, label: "Vocabulary", color: "bg-blue-500", icon: "📚", time: "2-3 min", detail: "5-8 flashcards" },
        { id: 3, label: "Listening", color: "bg-green-500", icon: "🎧", time: "4-5 min", detail: "1-2 ATC clips" },
        { id: 4, label: "Speaking", color: "bg-orange-500", icon: "🎤", time: "5-6 min", detail: "2-3 scenarios" },
        { id: 5, label: "Summary", color: "bg-purple-500", icon: "📊", time: "1 min", detail: "ICAO update" },
      ]
    },
    vocab: {
      title: "Vocabulary Flow",
      steps: [
        { id: 1, label: "Load Due Cards", color: "bg-blue-400", icon: "📋" },
        { id: 2, label: "Show Front", color: "bg-blue-500", icon: "❓", detail: "Term only" },
        { id: 3, label: "User Thinks", color: "bg-yellow-500", icon: "🤔" },
        { id: 4, label: "Reveal Back", color: "bg-blue-600", icon: "💡", detail: "Definition + Audio" },
        { id: 5, label: "Rate Recall", color: "bg-green-500", icon: "⭐", detail: "Easy/Hard/Forgot" },
        { id: 6, label: "SM-2 Update", color: "bg-purple-500", icon: "🔄", detail: "Schedule next" },
      ]
    },
    listen: {
      title: "Listening Flow",
      steps: [
        { id: 1, label: "Context Card", color: "bg-green-400", icon: "📍", detail: "Set the scene" },
        { id: 2, label: "Play Audio", color: "bg-green-500", icon: "🔊", detail: "ATC clip" },
        { id: 3, label: "Replay?", color: "bg-yellow-500", icon: "🔁", detail: "0.75x option" },
        { id: 4, label: "Questions", color: "bg-green-600", icon: "❓", detail: "2-3 MCQ" },
        { id: 5, label: "Results", color: "bg-blue-500", icon: "✅", detail: "Score + correct" },
        { id: 6, label: "Transcript", color: "bg-purple-500", icon: "📝", detail: "Learning point" },
      ]
    },
    speak: {
      title: "Speaking Flow",
      steps: [
        { id: 1, label: "Scenario", color: "bg-orange-400", icon: "📋", detail: "Read context" },
        { id: 2, label: "ATC Audio", color: "bg-orange-500", icon: "🎧", detail: "Hear instruction" },
        { id: 3, label: "Record", color: "bg-red-500", icon: "🔴", detail: "Your response" },
        { id: 4, label: "Transcribe", color: "bg-yellow-500", icon: "⏳", detail: "Whisper AI" },
        { id: 5, label: "Compare", color: "bg-blue-500", icon: "⚖️", detail: "vs correct" },
        { id: 6, label: "AI Feedback", color: "bg-purple-500", icon: "🤖", detail: "6 ICAO scores" },
      ]
    },
  };

  const currentFlow = flows[activeFlow];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-2">AviLingo User Flows</h1>
      <p className="text-gray-400 text-center mb-8">Screen-by-screen journey visualization</p>
      
      {/* Flow Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {Object.entries(flows).map(([key, flow]) => (
          <button
            key={key}
            onClick={() => setActiveFlow(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeFlow === key 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {flow.title}
          </button>
        ))}
      </div>

      {/* Flow Diagram */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-6 text-blue-400">
          {currentFlow.title}
        </h2>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2 z-0" />
          
          {/* Steps */}
          <div className="relative z-10 flex justify-between items-center">
            {currentFlow.steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                {/* Arrow */}
                {index > 0 && (
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-gray-500 text-2xl">
                    →
                  </div>
                )}
                
                {/* Circle */}
                <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center text-2xl shadow-lg mb-2 relative`}>
                  {step.icon}
                  {step.time && (
                    <span className="absolute -top-2 -right-2 bg-gray-800 text-xs px-2 py-0.5 rounded-full border border-gray-600">
                      {step.time}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className="text-sm font-medium text-center max-w-20">
                  {step.label}
                </span>
                
                {/* Sub/Detail */}
                {(step.sub || step.detail) && (
                  <span className="text-xs text-gray-500 text-center mt-1">
                    {step.sub || step.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Detail Cards */}
      {activeFlow === 'session' && (
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-900/50 rounded-xl p-4 border border-blue-700">
            <h3 className="font-bold text-blue-400 mb-2">📚 Vocabulary</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 5-8 due cards from SM-2 queue</li>
              <li>• Show term → think → reveal</li>
              <li>• Audio pronunciation plays</li>
              <li>• Rate: Easy / Hard / Forgot</li>
              <li>• Algorithm schedules next review</li>
            </ul>
          </div>
          
          <div className="bg-green-900/50 rounded-xl p-4 border border-green-700">
            <h3 className="font-bold text-green-400 mb-2">🎧 Listening</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Real ATC audio clip</li>
              <li>• Speed control (0.75x/1x)</li>
              <li>• 2-3 comprehension questions</li>
              <li>• Score + correct answers</li>
              <li>• Transcript reveal + teaching point</li>
            </ul>
          </div>
          
          <div className="bg-orange-900/50 rounded-xl p-4 border border-orange-700">
            <h3 className="font-bold text-orange-400 mb-2">🎤 Speaking</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Hear ATC instruction</li>
              <li>• Record your readback</li>
              <li>• Whisper transcription</li>
              <li>• Compare to correct response</li>
              <li>• AI feedback on 6 ICAO criteria</li>
            </ul>
          </div>
        </div>
      )}

      {/* Screen Count Summary */}
      <div className="max-w-2xl mx-auto mt-12 bg-gray-800 rounded-xl p-6">
        <h3 className="font-bold text-xl mb-4 text-center">📱 Total App Screens</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">9</div>
            <div className="text-xs text-gray-400">Onboarding</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">22</div>
            <div className="text-xs text-gray-400">Session</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">5</div>
            <div className="text-xs text-gray-400">Practice</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">5</div>
            <div className="text-xs text-gray-400">Progress</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">~46</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      </div>

      {/* Next Step CTA */}
      <div className="text-center mt-12">
        <p className="text-gray-400 mb-2">Next Step</p>
        <p className="text-xl font-bold text-blue-400">Step 3: Wireframes →</p>
        <p className="text-gray-500 text-sm mt-2">Visual mockups for key screens</p>
      </div>
    </div>
  );
};

export default FlowDiagram;
