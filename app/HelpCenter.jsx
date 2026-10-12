// ==========================================================================
// FILE: app/HelpCenter.jsx
// ==========================================================================
'use client';

import React, { useState, useEffect } from 'react';

export default function HelpCenter({ isOpen, onClose }) {
  /* =========================================================
     EDIT POINT 1: SUPPORT EMAIL CONFIGURATION
     Change this email address if your support inbox changes.
     ========================================================= */
  const SUPPORT_EMAIL = 'publishstudio.ops@gmail.com';

  /* User identity states stored locally */
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  /* Feedback form states */
  const [category, setCategory] = useState('Report Bug / Issue');
  const [details, setDetails] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load remembered user on open
  useEffect(() => {
    const saved = localStorage.getItem('publishstudio_user');
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch (e) {
        console.error('Could not load profile', e);
      }
    }
  }, [isOpen]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('publishstudio_user', JSON.stringify(userProfile));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    const subject = `[${category}] Support Request from ${userProfile.firstName || 'Author'}`;
    const body = `Author Name: ${userProfile.firstName} ${userProfile.lastName}\nAuthor Email: ${userProfile.email}\n\nIssue Details:\n${details}`;
    
    // Direct mailto trigger
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* High-contrast container for light & dark mode */}
      <div className="bg-[#FAF7F2] dark:bg-[#18181B] border border-[#D6CEBE] dark:border-neutral-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-300 dark:border-neutral-800">
          <h2 className="text-lg font-bold">Help Center & User Account</h2>
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Section 1: User Profile */}
        <div className="mt-4 pb-4 border-b border-stone-300 dark:border-neutral-800">
          <h3 className="text-sm font-semibold mb-2">Remember Me (Author Profile)</h3>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="First Name"
              value={userProfile.firstName}
              onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
              className="px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={userProfile.lastName}
              onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
              className="px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
            />
            <input
              type="email"
              placeholder="Email ID"
              value={userProfile.email}
              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
              className="px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={handleSaveProfile}
              className="text-xs bg-stone-900 dark:bg-emerald-600 text-white px-3 py-1 rounded font-medium hover:opacity-90 transition"
            >
              Remember Details
            </button>
            {savedSuccess && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Saved on this device!</span>}
          </div>
        </div>

        {/* Section 2: Report an Issue */}
        <form onSubmit={handleSendFeedback} className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold">Report Issue or Provide Feedback</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Messages are delivered directly to <span className="font-mono text-emerald-600 dark:text-emerald-400">{SUPPORT_EMAIL}</span>.
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1">Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2 rounded border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
            >
              <option value="Report Bug / Issue">Report Bug / Page Glitch</option>
              <option value="Formatting Calculation Error">Formatting Calculation Error</option>
              <option value="Feature Request">Request a New Feature</option>
              <option value="General Query">General Question</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1">Describe Issue</label>
            <textarea
              required
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide page number, error detail, or feedback..."
              className="w-full text-xs p-2 rounded border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow transition"
            >
              Open Email Composer
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
