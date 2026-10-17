'use client';

import React, { useState } from 'react';
import { useCoach } from '../store/coachStore';
import { TaskCategory } from '../types/coach';

interface ChatMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  options?: Array<{ label: string; action: () => void }>;
}

export const OnboardingView: React.FC = () => {
  const {
    goal,
    statedWeeklyMinutes,
    commitmentMinutes,
    capacity,
    setGoalAndBreakdown,
    updateCapacityInputs,
  } = useCoach();

  const [mode, setMode] = useState<'chat' | 'manual'>('chat');

  // Manual Form States
  const [title, setTitle] = useState(goal?.title || 'Data Structures & Algorithms Mastery');
  const [problemStatement, setProblemStatement] = useState(
    goal?.initialProblemStatement || 'Main daily DSA plan karta hu but 3 din ke baad chhod deta hu.'
  );
  const [category, setCategory] = useState<TaskCategory>('coding');
  const [statedHours, setStatedHours] = useState(Math.round(statedWeeklyMinutes / 60));
  const [commitHours, setCommitHours] = useState(Math.round(commitmentMinutes / 60));

  // Chat States
  const [chatStep, setChatStep] = useState<number>(1);
  const [chatGoalTitle, setChatGoalTitle] = useState<string>('');
  const [chatProblem, setChatProblem] = useState<string>('');
  const [chatCategory, setChatCategory] = useState<TaskCategory>('coding');
  const [chatStatedHours, setChatStatedHours] = useState<number>(30);
  const [chatCommitHours, setChatCommitHours] = useState<number>(6);
  const [customInputText, setCustomInputText] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'coach',
      text: 'Welcome to Bearing. I am your adaptive planning coach. Traditional planners accept whatever fantasy plan you create, and then fail on Day 3. My job is to plan based on what actually happens in reality. What is your primary objective or recurring struggle right now?',
    },
  ]);

  const handleSelectGoal = (gTitle: string, gProblem: string, gCat: TaskCategory) => {
    setChatGoalTitle(gTitle);
    setChatProblem(gProblem);
    setChatCategory(gCat);

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: `${gTitle} ("${gProblem}")` },
      {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: `Got it. "${gTitle}" is a great wedge. Now let's conduct an honest Reality Check. How many hours per week do you optimistically hope you can dedicate?`,
      },
    ]);
    setChatStep(2);
  };

  const handleSelectHours = (hrs: number) => {
    setChatStatedHours(hrs);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: `I hope to do ${hrs} hours/week` },
      {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: `Understood. Now, what are your non-negotiable fixed commitments (classes, full-time job, family obligations) that eat into your mental focus?`,
      },
    ]);
    setChatStep(3);
  };

  const handleSelectCommitments = (commits: number) => {
    setChatCommitHours(commits);
    const available = Math.max(0, chatStatedHours - commits);
    const haircut = Math.round(available * 0.6);
    const plannable = Math.round(haircut * 0.8);

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: `${commits} hours of fixed commitments` },
      {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: `Here is the reality check:
• Stated Uncommitted: ${available} hours
• Week 1 Empirical Haircut (60%): ${haircut} hours
• Buffer (20%): -${haircut - plannable} hours
• Sustainable Plannable Capacity: ~${plannable} hours (${plannable * 60} mins)

Instead of setting you up for burnout with ${chatStatedHours} hours, I will structure a realistic plan of ${plannable} hours and decompose your goal into ≤45m Next Actions. Ready to generate your plan?`,
      },
    ]);
    setChatStep(4);
  };

  const handleFinalizeChatPlan = () => {
    updateCapacityInputs(chatStatedHours * 60, chatCommitHours * 60);
    setGoalAndBreakdown(
      chatGoalTitle || 'Mastering Daily Focus',
      chatProblem || 'Balancing execution with real-life friction',
      chatCategory
    );
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputText.trim()) return;

    if (chatStep === 1) {
      handleSelectGoal(customInputText, 'Starting fresh with realistic planning', 'general');
    } else if (chatStep === 2) {
      const num = parseInt(customInputText.replace(/\D/g, ''), 10) || 25;
      handleSelectHours(num);
    } else if (chatStep === 3) {
      const num = parseInt(customInputText.replace(/\D/g, ''), 10) || 5;
      handleSelectCommitments(num);
    }
    setCustomInputText('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    updateCapacityInputs(statedHours * 60, commitHours * 60);
    setGoalAndBreakdown(title, problemStatement, category);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="font-bold text-lg text-ink">Conversational Onboarding & Reality Check</h2>
          <p className="text-xs text-muted">
            Step 1: Tell the coach what matters • Step 2: Understand reality
          </p>
        </div>

        <div className="flex rounded-lg border border-border bg-surface-sunken p-1 text-xs font-mono">
          <button
            onClick={() => setMode('chat')}
            className={`rounded-md px-3 py-1 font-semibold transition-colors ${
              mode === 'chat' ? 'bg-surface text-ink shadow-1' : 'text-muted hover:text-ink'
            }`}
          >
            💬 Coach Chat
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`rounded-md px-3 py-1 font-semibold transition-colors ${
              mode === 'manual' ? 'bg-surface text-ink shadow-1' : 'text-muted hover:text-ink'
            }`}
          >
            ⚙️ Manual Form
          </button>
        </div>
      </div>

      {mode === 'chat' ? (
        /* Chat Mode */
        <div className="rounded-xl border border-border bg-surface shadow-1 flex flex-col h-[560px]">
          {/* Chat Transcript */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                    m.sender === 'coach'
                      ? 'bg-insight text-white'
                      : 'bg-ink text-paper'
                  }`}
                >
                  {m.sender === 'coach' ? 'AI' : 'You'}
                </div>

                <div
                  className={`rounded-xl p-4 text-xs leading-relaxed whitespace-pre-line ${
                    m.sender === 'coach'
                      ? 'bg-surface-sunken text-ink border border-border'
                      : 'bg-ink text-paper'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Quick response chips based on current step */}
            {chatStep === 1 && (
              <div className="pt-2 pl-11 space-y-2">
                <span className="font-mono text-[10px] text-muted uppercase">Select or type your situation:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleSelectGoal(
                        'Master Daily DSA',
                        'Main daily DSA plan karta hu but 3 din ke baad chhod deta hu',
                        'coding'
                      )
                    }
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-insight hover:bg-insight-soft/30 transition-colors"
                  >
                    🎯 DSA Inconsistency (Spec §9)
                  </button>
                  <button
                    onClick={() =>
                      handleSelectGoal(
                        'Land Software Internship',
                        'Procrastinating on resumes and application forms',
                        'career'
                      )
                    }
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-insight hover:bg-insight-soft/30 transition-colors"
                  >
                    💼 Software Internship Search
                  </button>
                  <button
                    onClick={() =>
                      handleSelectGoal(
                        'Finish Fullstack Project',
                        'I keep planning but never finish before deadline',
                        'coding'
                      )
                    }
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-insight hover:bg-insight-soft/30 transition-colors"
                  >
                    🚀 Finish Fullstack Project
                  </button>
                </div>
              </div>
            )}

            {chatStep === 2 && (
              <div className="pt-2 pl-11 space-y-2">
                <span className="font-mono text-[10px] text-muted uppercase">Select stated weekly hours:</span>
                <div className="flex flex-wrap gap-2 font-mono">
                  <button
                    onClick={() => handleSelectHours(15)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors"
                  >
                    15 hrs/week (Part-time)
                  </button>
                  <button
                    onClick={() => handleSelectHours(30)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors"
                  >
                    30 hrs/week (Moderate)
                  </button>
                  <button
                    onClick={() => handleSelectHours(45)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors"
                  >
                    45 hrs/week (Ambitious)
                  </button>
                </div>
              </div>
            )}

            {chatStep === 3 && (
              <div className="pt-2 pl-11 space-y-2">
                <span className="font-mono text-[10px] text-muted uppercase">Select fixed commitments:</span>
                <div className="flex flex-wrap gap-2 font-mono">
                  <button
                    onClick={() => handleSelectCommitments(5)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors"
                  >
                    5 hrs (Light commitments)
                  </button>
                  <button
                    onClick={() => handleSelectCommitments(10)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors"
                  >
                    10 hrs (Standard college/job)
                  </button>
                  <button
                    onClick={() => handleSelectCommitments(20)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:border-ink transition-colors"
                  >
                    20 hrs (Heavy load)
                  </button>
                </div>
              </div>
            )}

            {chatStep === 4 && (
              <div className="pt-4 pl-11">
                <button
                  onClick={handleFinalizeChatPlan}
                  className="flex items-center gap-2 rounded-lg bg-ink px-6 py-3 font-semibold text-paper text-xs shadow-2 hover:bg-[#232b44] transition-colors"
                >
                  <span>✨</span>
                  <span>Build My Realistic Plan & Open Weekly Board</span>
                </button>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleCustomSend}
            className="border-t border-border bg-surface p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              placeholder={
                chatStep === 1
                  ? 'Type your goal or problem here...'
                  : chatStep === 2
                  ? 'Type your stated weekly hours (e.g. 25)...'
                  : 'Type your fixed commitments in hours...'
              }
              className="flex-1 rounded-lg border border-border-strong bg-surface-sunken px-4 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-[#232b44] transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        /* Manual Form Mode */
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4">
            <h3 className="font-semibold text-base text-ink">1. Goal & Context</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="font-mono text-xs text-muted">Core Goal</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-border bg-surface-sunken px-3 py-2 text-xs text-ink"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-mono text-xs text-muted">Recurring Obstacle / Problem</label>
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-border bg-surface-sunken px-3 py-2 text-xs text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs text-muted">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full rounded border border-border bg-surface-sunken px-3 py-2 text-xs text-ink"
                >
                  <option value="coding">Coding & Algorithms</option>
                  <option value="career">Career & Jobs</option>
                  <option value="academic">Academic & Exams</option>
                  <option value="writing">Writing & Research</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-1 space-y-4">
            <h3 className="font-semibold text-base text-ink">2. Reality Check Capacity</h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span>Stated Free Time:</span>
                    <span>{statedHours} hrs/week</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={statedHours}
                    onChange={(e) => setStatedHours(Number(e.target.value))}
                    className="w-full accent-ink"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span>Fixed Commitments:</span>
                    <span>{commitHours} hrs/week</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, statedHours - 2)}
                    value={commitHours}
                    onChange={(e) => setCommitHours(Number(e.target.value))}
                    className="w-full accent-ink"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-sunken p-4 font-mono text-xs space-y-2">
                <div className="text-[10px] uppercase text-muted font-bold">Reality Deduction</div>
                <div className="flex justify-between text-muted">
                  <span>Available Stated:</span>
                  <span>{Math.max(0, statedHours - commitHours)}h</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Week 1 Haircut (60%):</span>
                  <span>{Math.round(capacity.effectiveCapacity / 60)}h</span>
                </div>
                <div className="flex justify-between text-ink font-bold border-t border-border pt-1">
                  <span>Plannable Capacity:</span>
                  <span className="text-ember-text">{Math.round(capacity.plannable / 60)}h</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-ink px-6 py-3 text-xs font-semibold text-paper hover:bg-[#232b44] transition-colors"
            >
              Generate Weekly Plan
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
