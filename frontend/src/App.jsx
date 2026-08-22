import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://shvwloynixadgdcuxtgk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodndsb3luaXhhZGdkY3V4dGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODE0MDYsImV4cCI6MjEwMjk1NzQwNn0.OHYUmNjJuqsKdaxrReWnHiW73VmDHEp8pcjMm4i9Mfo';

const ROLES = [
  'tech',
  'tech_senior',
  'founder',
  'investor',
  'vc',
  'finance',
  'consultant',
  'ca',
  'lawyer',
  'doctor',
  'designer',
  'marketing',
  'sales',
  'government',
  'academia',
  'student',
  'creator',
  'other',
  'unknown'
];
const LOCATIONS = ['India', 'USA', 'UK', 'Canada', 'Australia', 'Singapore', 'Germany', 'France', 'UAE', 'Other'];
const MET_AT = [
  'school',
  'college',
  'university',
  'company',
  'previous_company',
  'internship',
  'conference',
  'meetup',
  'party',
  'sports',
  'online',
  'mutual_friend',
  'family',
  'travel',
  'community',
  'other'
];
const INTERACTION_TYPES = [
  'message',
  'call',
  'meetup',
  'birthday_wish',
  'festival_wish',
  'reel_share',
  'post_share',
  'work',
  'introduction',
  'help',
  'invitation',
  'other'
];
const INTENTS = [
  'friendship',
  'professional',
  'mentorship',
  'mentee',
  'emulation',
  'collaboration',
  'business',
  'networking',
  'family',
  'romantic',
  'connector',
  'community'
];

const SORT_OPTIONS = [
  { value: 'recent_interaction', label: 'Most Recent Interaction' },
  { value: 'oldest_interaction', label: 'Oldest Interaction' },
  { value: 'name_asc', label: 'Alphabetical (A-Z)' }
];

const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  ChevronDown: ({ className = "" }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  Cards: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>,
  Rows: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
};

const SingleSelect = ({ options, value, onChange, placeholder = "Select...", formatLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptionValue = (opt) => (typeof opt === 'object' && opt !== null ? opt.value : opt);
  const getOptionLabel = (opt) => {
    if (typeof opt === 'object' && opt !== null) return opt.label;
    if (formatLabel) return formatLabel(opt);
    return opt;
  };

  const selectedOption = options.find(opt => getOptionValue(opt) === value);
  const displayLabel = selectedOption ? getOptionLabel(selectedOption) : '';

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="w-full bg-transparent border-b border-[#D1CEC7] py-2 cursor-pointer flex justify-between items-center min-h-[38px] transition-colors hover:border-[#2C2A25] group select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span className="text-[#1A1A1A] font-body text-sm capitalize truncate pr-2">{displayLabel}</span>
        ) : (
          <span className="text-[#6B6B6B]/60 font-body text-sm">{placeholder}</span>
        )}
        <span className={`text-[#6B6B6B] transition-transform duration-200 group-hover:text-[#1A1A1A] ${isOpen ? 'rotate-180 text-[#1A1A1A]' : ''}`}>
          <Icons.ChevronDown />
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-[#FAFAF8] border border-[#E8E4DF] shadow-lg z-50 max-h-52 overflow-y-auto rounded-sm">
          {options.map((option) => {
            const optVal = getOptionValue(option);
            const optLabel = getOptionLabel(option);
            const isSelected = optVal === value;

            return (
              <div
                key={optVal || 'empty-option'}
                className={`px-3 py-2 text-sm font-body cursor-pointer hover:bg-[#F5F3F0] flex justify-between items-center text-[#1A1A1A] transition-colors ${isSelected ? 'bg-[#F5F3F0] font-medium' : ''
                  }`}
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
              >
                <span className="capitalize truncate pr-2">{optLabel || placeholder}</span>
                {isSelected && <Icons.Check />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MultiSelect = ({ options, selected = [], onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="w-full bg-transparent border-b border-[#D1CEC7] py-2 cursor-pointer flex flex-wrap gap-1 items-center min-h-[38px] transition-colors hover:border-[#2C2A25] select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-[#6B6B6B]/60 font-body text-sm">{placeholder}</span>
        ) : (
          selected.map(item => (
            <span key={item} className="bg-[#1A1A1A] text-[#FAFAF8] text-xs px-2 py-0.5 rounded-sm font-body tracking-wide capitalize flex items-center gap-1">
              {item.replace('_', ' ')}
              <span className="hover:text-red-300 ml-0.5" onClick={(e) => { e.stopPropagation(); toggleOption(item); }}>×</span>
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-[#FAFAF8] border border-[#E8E4DF] shadow-lg z-50 max-h-52 overflow-y-auto rounded-sm">
          {options.map(option => (
            <div
              key={option}
              className="px-3 py-2 text-sm font-body cursor-pointer hover:bg-[#F5F3F0] flex justify-between items-center text-[#1A1A1A] transition-colors"
              onClick={() => toggleOption(option)}
            >
              <span className="capitalize">{option.replace('_', ' ')}</span>
              {selected.includes(option) && <Icons.Check />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PersonModal = ({ isOpen, onClose, onSave, person = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    location: '',
    met_at: '',
    first_met: '',
    last_interaction_date: '',
    interaction_type: '',
    intent: [],
    notes: ''
  });

  useEffect(() => {
    if (person) {
      setFormData({
        ...person,
        intent: person.intent || [],
        first_met: person.first_met ? person.first_met.slice(0, 10) : '',
        last_interaction_date: person.last_interaction ? person.last_interaction.slice(0, 10) : (person.last_interaction_date || ''),
        interaction_type: person.interaction_type || '',
        role: person.role || '',
        location: person.location || '',
        met_at: person.met_at || '',
        notes: person.notes || ''
      });
    } else {
      setFormData({
        name: '',
        company: '',
        role: '',
        location: '',
        met_at: '',
        first_met: '',
        last_interaction_date: '',
        interaction_type: '',
        intent: [],
        notes: ''
      });
    }
  }, [person, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
  };

  const Label = ({ children }) => <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-1 mt-5 font-mono font-medium">{children}</label>;
  const InputCls = "w-full bg-transparent border-b border-[#E8E4DF] py-2 text-[#1A1A1A] font-body text-sm placeholder:text-[#6B6B6B]/60 focus:outline-none focus:border-[#B8860B] transition-colors rounded-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#FAFAF8] paper-texture border border-[#E8E4DF] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm flex flex-col">
        <div className="sticky top-0 bg-[#FAFAF8]/95 backdrop-blur border-b border-[#E8E4DF] p-6 flex justify-between items-center z-10">
          <h2 className="font-display text-2xl text-[#1A1A1A] italic">{person ? 'Edit Profile' : 'New Entry'}</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"><Icons.X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div className="col-span-1 md:col-span-2">
            <Label>Full Name *</Label>
            <input name="name" value={formData.name} onChange={handleChange} required className={`${InputCls} text-lg font-medium`} placeholder="e.g. Eleanor Vance" />
          </div>

          <div>
            <Label>Company</Label>
            <input name="company" value={formData.company} onChange={handleChange} className={InputCls} placeholder="e.g. Hill House Tech" />
          </div>

          <div>
            <Label>Role</Label>
            <SingleSelect
              options={['', ...ROLES]}
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
              placeholder="Select a role..."
              formatLabel={(r) => r ? r.replace('_', ' ') : 'None'}
            />
          </div>

          <div>
            <Label>Location</Label>
            <SingleSelect
              options={['', ...LOCATIONS]}
              value={formData.location}
              onChange={(val) => setFormData({ ...formData, location: val })}
              placeholder="Select location..."
              formatLabel={(l) => l || 'None'}
            />
          </div>

          <div>
            <Label>Met At</Label>
            <SingleSelect
              options={['', ...MET_AT]}
              value={formData.met_at}
              onChange={(val) => setFormData({ ...formData, met_at: val })}
              placeholder="Select origin..."
              formatLabel={(m) => m ? m.replace('_', ' ') : 'None'}
            />
          </div>

          <div>
            <Label>First Met Date</Label>
            <input type="date" name="first_met" value={formData.first_met} onChange={handleChange} className={InputCls} />
          </div>

          <div className="col-span-1 md:col-span-2 mt-4 border-t border-[#E8E4DF] pt-2">
            <h3 className="font-display text-lg italic text-[#6B6B6B]">Relationship Dynamics</h3>
          </div>

          <div>
            <Label>Last Interaction Date</Label>
            <input type="date" name="last_interaction_date" value={formData.last_interaction_date} onChange={handleChange} className={InputCls} />
          </div>

          <div>
            <Label>Interaction Medium</Label>
            <SingleSelect
              options={['', ...INTERACTION_TYPES]}
              value={formData.interaction_type}
              onChange={(val) => setFormData({ ...formData, interaction_type: val })}
              placeholder="Select medium..."
              formatLabel={(i) => i ? i.replace('_', ' ') : 'None'}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <Label>Intent Tags</Label>
            <MultiSelect
              options={INTENTS}
              selected={formData.intent}
              onChange={(newIntents) => setFormData({ ...formData, intent: newIntents })}
              placeholder="Select strategic intents..."
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <Label>Notes & Context</Label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
              className={`${InputCls} resize-none leading-relaxed`}
              placeholder="Add background notes, shared interests, topics discussed, or follow-ups..."
            />
          </div>

          <div className="col-span-1 md:col-span-2 mt-10 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 font-display text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-[#B8860B] text-white font-display text-lg hover:bg-[#D4A84B] transition-colors shadow-md cursor-pointer">
              {person ? 'Save Changes' : 'Commit to Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- LANDING PAGE COMPONENT ---
const LandingPage = ({ onEnter }) => {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState(false);
  const [activeSandboxIntent, setActiveSandboxIntent] = useState('all');

  const sandboxPeople = [
    {
      id: 's1',
      name: 'Eleanor Vance',
      company: 'Hill House Architecture',
      role: 'founder',
      location: 'UK',
      met_at: 'conference',
      first_met: '2024-03-12',
      last_interaction: '2026-08-10',
      intent: ['collaboration', 'networking'],
      notes: 'Expert in gothic revivals. Discussed partnering on the new design draft. Extremely analytical and precise.'
    },
    {
      id: 's2',
      name: 'Thomas More',
      company: 'Utopia Ventures',
      role: 'investor',
      location: 'Singapore',
      met_at: 'university',
      first_met: '2021-09-01',
      last_interaction: '2026-07-28',
      intent: ['mentorship', 'business'],
      notes: 'Values philosophy and structural integrity in startups. Advises caution on rapid scale. Met for tea last month.'
    },
    {
      id: 's3',
      name: 'Ada Lovelace',
      company: 'Analytical Engines Inc.',
      role: 'tech_senior',
      location: 'UK',
      met_at: 'mutual_friend',
      first_met: '2023-11-20',
      last_interaction: '2026-08-20',
      intent: ['emulation', 'friendship'],
      notes: 'Pioneered computational logic templates. Shares an interest in cello music and classical math proofs.'
    },
    {
      id: 's4',
      name: 'Marcus Aurelius',
      company: 'Rome Capital',
      role: 'vc',
      location: 'Germany',
      met_at: 'other',
      first_met: '2025-01-15',
      last_interaction: '2026-06-12',
      intent: ['mentorship', 'professional'],
      notes: 'Author of Meditations. Focuses on stoic investments. Strong focus on long-term sustainability metrics.'
    }
  ];

  const filteredSandbox = useMemo(() => {
    if (activeSandboxIntent === 'all') return sandboxPeople;
    return sandboxPeople.filter(p => p.intent.includes(activeSandboxIntent));
  }, [activeSandboxIntent]);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistStatus(true);
  };

  const sectionLine = (title) => (
    <div className="mb-10 flex items-center gap-4">
      <span className="h-px flex-1 bg-[#E8E4DF]" />
      <span className="small-caps text-[#B8860B]">{title}</span>
      <span className="h-px flex-1 bg-[#E8E4DF]" />
    </div>
  );

  return (
    <div className="min-h-screen paper-texture font-body text-[#1A1A1A] selection:bg-[#E8E4DF] selection:text-[#1A1A1A] relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[#B8860B]/2 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-[#E8E4DF]/60 bg-[#FAFAF8]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <h1 className="font-display text-3xl font-semibold tracking-wide italic text-[#1A1815]">The Network</h1>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C877D] font-display font-bold">Personal Archive</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#philosophy" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Philosophy</a>
            <a href="#features" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Core Pillars</a>
            <a href="#sandbox" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Sandbox Preview</a>
            <a href="#colophon" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Colophon</a>
          </nav>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 bg-[#1A1A1A] text-[#FAFAF8] px-4 py-2 border border-transparent rounded-sm font-body text-sm tracking-wide shadow-md hover:bg-[#B8860B] hover:text-[#FAFAF8] transition-all cursor-pointer min-h-[44px]"
          >
            <Icons.Lock /> Open Archive
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-32">

        {/* Hero Section */}
        <section className="text-center space-y-10 max-w-3xl mx-auto">
          <span className="small-caps text-[#B8860B] border border-[#B8860B]/20 rounded-full px-3 py-1 bg-[#FAFAF8]">PRIVATE ARCHIVAL SYSTEM</span>
          <h2 className="font-display text-5xl md:text-7xl font-normal tracking-tight text-[#1A1A1A] leading-tight">
            Cultivate your network with <span className="italic">literary care</span> & restraint.
          </h2>
          <p className="text-lg md:text-xl text-[#6B6B6B] leading-[1.75] font-light max-w-2xl mx-auto">
            A distraction-free personal CRM for curating high-fidelity relationships, logging detailed context logs, and nurturing strategic bonds without the noise of algorithms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnter}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8860B] text-white px-8 py-3 rounded-sm font-display text-lg hover:bg-[#D4A84B] transition-all shadow-md cursor-pointer min-h-[44px]"
            >
              Begin Your Personal Archive <Icons.ArrowRight />
            </button>
            <a
              href="#philosophy"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-display text-lg text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors min-h-[44px]"
            >
              Read the Philosophy
            </a>
          </div>

          {/* Interactive Mock Card */}
          <div className="pt-10">
            <div className="mx-auto max-w-lg bg-white border border-[#E8E4DF] p-8 text-left rounded-sm shadow-lg relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#B8860B]"></div>

              <div className="flex justify-between items-start border-b border-[#E8E4DF] pb-4 mb-4">
                <div>
                  <h4 className="font-display text-2xl text-[#1A1A1A] font-semibold italic">Eleanor Vance</h4>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Founder at <span className="font-medium text-[#1A1A1A]">Hill House Architecture</span></p>
                </div>
                <span className="small-caps text-[9px] px-2 py-0.5 bg-[#F5F3F0] text-[#B8860B] border border-[#E8E4DF] rounded-sm">Featured Profile</span>
              </div>

              <div className="space-y-2 mb-4 text-xs text-[#6B6B6B]">
                <div className="flex items-center gap-2">
                  <Icons.MapPin /> London, UK
                </div>
                <div className="flex items-center gap-2">
                  <Icons.Calendar /> First met: March 12, 2024 (Conference)
                </div>
                <div className="flex items-center gap-2">
                  <Icons.Calendar /> Last contact: August 10, 2026
                </div>
              </div>

              <div className="mb-4 text-xs italic text-[#6B6B6B] bg-[#F5F3F0] p-3 rounded-sm border border-[#E8E4DF]/60 leading-relaxed">
                "Expert in gothic revivals. Discussed partnering on the new design draft. Extremely analytical and precise."
              </div>

              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dashed border-[#E8E4DF]">
                {['collaboration', 'networking'].map(int => (
                  <span key={int} className="text-[9px] uppercase tracking-wider bg-[#F5F3F0] text-[#1A1A1A] px-2 py-0.5 rounded-sm border border-[#E8E4DF]">
                    {int}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="scroll-mt-24 space-y-10">
          {sectionLine("The Philosophy")}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-7 space-y-6">
              <h3 className="font-display text-3xl md:text-4xl italic text-[#1A1A1A] leading-tight">
                "Dunbar proved we can only hold 150 meaningful bonds. Why trust those memories to ephemeral algorithms?"
              </h3>
              <p className="text-base text-[#6B6B6B] leading-[1.8] font-light">
                Modern networking platforms treat relationships like high-frequency trades. They demand infinite scaling, superficial updates, and performative updates. We believe in the opposite: curation over volume, context over vanity, and quiet recollection over algorithmic prompts.
              </p>
            </div>
            <div className="md:col-span-5 bg-white border border-[#E8E4DF] p-8 rounded-sm shadow-sm space-y-4">
              <span className="small-caps text-[#B8860B] text-[10px]">The Manifesto</span>
              <p className="text-sm text-[#1A1A1A] leading-relaxed italic">
                “The Network is designed as a digital ledger for the thoughtful curator. It doesn’t send notifications, it doesn’t sync contact lists automatically, and it won’t summarize relationships with AI. You write what matters, tag with intent, and reflect on the ties that bind.”
              </p>
              <p className="text-xs text-[#6B6B6B] text-right font-mono">— The Colophon Office</p>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section id="features" className="scroll-mt-24 space-y-10">
          {sectionLine("The Core Pillars")}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white border border-[#E8E4DF] p-8 rounded-sm shadow-sm relative group hover:border-[#B8860B] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B8860B] opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-mono text-xs text-[#B8860B] tracking-widest block mb-4">PILLAR 01</span>
              <h4 className="font-display text-xl font-semibold italic text-[#1A1A1A] mb-3">Strategic Intent Tagging</h4>
              <p className="text-sm text-[#6B6B6B] leading-[1.7]">
                Categorize your connections by active dynamics: *collaboration*, *mentorship*, *friendship*, or *emulation*. Know exactly what space each person holds in your life.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-[#E8E4DF] p-8 rounded-sm shadow-sm relative group hover:border-[#B8860B] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B8860B] opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-mono text-xs text-[#B8860B] tracking-widest block mb-4">PILLAR 02</span>
              <h4 className="font-display text-xl font-semibold italic text-[#1A1A1A] mb-3">Interaction Mediums</h4>
              <p className="text-sm text-[#6B6B6B] leading-[1.7]">
                Keep track of how you last met: *calls*, *meetups*, or *shared literature*. Monitor the duration since last contact to ensure important bonds do not drift.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-[#E8E4DF] p-8 rounded-sm shadow-sm relative group hover:border-[#B8860B] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B8860B] opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-mono text-xs text-[#B8860B] tracking-widest block mb-4">PILLAR 03</span>
              <h4 className="font-display text-xl font-semibold italic text-[#1A1A1A] mb-3">Deep Context Archives</h4>
              <p className="text-sm text-[#6B6B6B] leading-[1.7]">
                Maintain private logs of past interactions, shared articles, or books discussed. When you reach out, recall conversations exactly as they happened.
              </p>
            </div>
          </div>
        </section>

        {/* Large Display Numbers */}
        <section className="py-8 bg-[#F5F3F0]/60 border-y border-[#E8E4DF] grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="space-y-2">
            <p className="font-display text-6xl text-[#B8860B]">150</p>
            <p className="small-caps text-xs text-[#1A1A1A] tracking-wider">Dunbar Limit Curation</p>
          </div>
          <div className="space-y-2 border-y md:border-y-0 md:border-x border-[#E8E4DF] py-6 md:py-0">
            <p className="font-display text-6xl text-[#B8860B]">0%</p>
            <p className="small-caps text-xs text-[#1A1A1A] tracking-wider">Algorithmic Noise</p>
          </div>
          <div className="space-y-2">
            <p className="font-display text-6xl text-[#B8860B]">100%</p>
            <p className="small-caps text-xs text-[#1A1A1A] tracking-wider">Private & Sovereign</p>
          </div>
        </section>

        {/* Sandbox Rolodex Preview */}
        <section id="sandbox" className="scroll-mt-24 space-y-10">
          {sectionLine("The Rolodex Experience")}

          <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
            <h3 className="font-display text-3xl italic text-[#1A1A1A]">Sandbox Preview</h3>
            <p className="text-sm text-[#6B6B6B] font-light">
              Interact with a live mock interface. Filter the connections in the archive below to see how intentions align.
            </p>
          </div>

          <div className="space-y-6">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setActiveSandboxIntent('all')}
                className={`px-4 py-1.5 rounded-sm font-mono text-xs uppercase tracking-widest border transition-all cursor-pointer ${activeSandboxIntent === 'all'
                    ? 'bg-[#1A1A1A] text-[#FAFAF8] border-transparent'
                    : 'bg-transparent text-[#6B6B6B] border-[#E8E4DF] hover:text-[#1A1A1A] hover:border-[#1A1A1A]'
                  }`}
              >
                All Intents
              </button>
              {['mentorship', 'collaboration', 'business', 'networking', 'friendship', 'emulation'].map((intent) => (
                <button
                  key={intent}
                  onClick={() => setActiveSandboxIntent(intent)}
                  className={`px-4 py-1.5 rounded-sm font-mono text-xs uppercase tracking-widest border transition-all cursor-pointer ${activeSandboxIntent === intent
                      ? 'bg-[#1A1A1A] text-[#FAFAF8] border-transparent'
                      : 'bg-transparent text-[#6B6B6B] border-[#E8E4DF] hover:text-[#1A1A1A] hover:border-[#1A1A1A]'
                    }`}
                >
                  {intent}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {filteredSandbox.map((person) => (
                <div key={person.id} className="bg-white border border-[#E8E4DF] p-6 rounded-sm shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
                  <div>
                    <div className="border-b border-[#E8E4DF] pb-3 mb-3">
                      <h4 className="font-display text-xl text-[#1A1A1A] font-semibold italic">{person.name}</h4>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">{person.role.replace('_', ' ')} at <span className="font-medium text-[#1A1A1A]">{person.company}</span></p>
                    </div>

                    <div className="space-y-1.5 mb-4 text-xs text-[#6B6B6B]">
                      <div className="flex items-center gap-2">
                        <Icons.MapPin /> {person.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icons.Calendar /> First met: {new Date(person.first_met).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                      </div>
                    </div>

                    <div className="mb-4 text-xs italic text-[#6B6B6B] bg-[#F5F3F0] p-3 rounded-sm border border-[#E8E4DF]/60 leading-relaxed">
                      "{person.notes}"
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dashed border-[#E8E4DF]">
                    {person.intent.map((int) => (
                      <span key={int} className="text-[9px] uppercase tracking-wider bg-[#F5F3F0] text-[#1A1A1A] px-2 py-0.5 rounded-sm border border-[#E8E4DF]">
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Waitlist / Access Colophon */}
        <section id="colophon" className="scroll-mt-24 max-w-xl mx-auto">
          <div className="bg-white border border-[#E8E4DF] p-10 rounded-sm shadow-lg text-center relative">
            <div className="absolute inset-0 border border-[#B8860B]/30 m-1 pointer-events-none rounded-sm"></div>

            <h3 className="font-display text-3xl italic text-[#1A1A1A] mb-3">Request Registry Entry</h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6 font-light">
              Registry access is currently hand-curated. Enter your email to request admission to the private archive.
            </p>

            {waitlistStatus ? (
              <div className="p-4 bg-[#F5F3F0] border border-[#B8860B]/30 rounded-sm text-sm text-[#B8860B] font-medium animate-pulse">
                ✓ Whitelist request submitted. Welcome to the archive.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="e.g. curator@network.com"
                  className="w-full bg-transparent border-b border-[#E8E4DF] py-2 text-center text-[#1A1A1A] font-body text-sm placeholder:text-[#6B6B6B]/40 focus:outline-none focus:border-[#B8860B] transition-colors rounded-none"
                />
                <button
                  type="submit"
                  className="w-full bg-[#1A1A1A] text-[#FAFAF8] py-2.5 rounded-sm font-display text-base tracking-wide hover:bg-[#B8860B] transition-colors cursor-pointer min-h-[44px]"
                >
                  Request Archive Admission
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DF] py-12 bg-[#F5F3F0]/40 text-center text-xs text-[#6B6B6B] font-mono tracking-wide">
        <div className="max-w-5xl mx-auto px-6 space-y-4">
          <p className="small-caps text-[10px] text-[#B8860B]">The Network · Personal Archive</p>
          <p className="italic font-display text-sm text-[#1A1A1A]">“To nurture a bond is to preserve a context.”</p>
          <div className="flex justify-center gap-6 text-[10px] uppercase">
            <a href="#philosophy" className="hover:text-[#1A1A1A]">Philosophy</a>
            <span>•</span>
            <a href="#features" className="hover:text-[#1A1A1A]">Colophon</a>
            <span>•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); onEnter(); }} className="hover:text-[#1A1A1A]">Private Console</a>
          </div>
          <p className="text-[10px] text-[#6B6B6B]/60 mt-4">© 2026 The Network. MIT License. Hand-crafted for operators of taste.</p>
        </div>
      </footer>
    </div>
  );
};

// --- APP ROOT COMPONENT ---
export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'rolodex'

  return (
    <>
      {view === 'rolodex' ? (
        <NetworkRolodex onBack={() => setView('landing')} />
      ) : (
        <LandingPage onEnter={() => setView('rolodex')} />
      )}
    </>
  );
}

// --- NETWORK ROLODEX MAIN MODULE ---
function NetworkRolodex({ onBack }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  // Filters and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('recent_interaction'); // recent_interaction, oldest_interaction, name_asc
  const [layoutMode, setLayoutMode] = useState(() => {
    try {
      return localStorage.getItem('sociograph-layout') === 'compact' ? 'compact' : 'cards';
    } catch {
      return 'cards';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sociograph-layout', layoutMode);
    } catch {
      /* ignore quota / private mode */
    }
  }, [layoutMode]);

  useEffect(() => {
    // Initialize Supabase Client directly with imported package or fallback
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setSupabaseClient(client);
    } catch (e) {
      if (window.supabase) {
        setSupabaseClient(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          setSupabaseClient(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
        };
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (supabaseClient) {
      fetchPeople();
    }
  }, [supabaseClient]);

  const fetchPeople = async () => {
    if (!supabaseClient) return;
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('people')
        .select('*')
        .order('last_interaction', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Parse the intent string back to an array for the UI if it exists
      const parsedData = (data || []).map(person => ({
        ...person,
        intent: person.intent ? (Array.isArray(person.intent) ? person.intent : person.intent.split(',')) : []
      }));

      setPeople(parsedData);
    } catch (err) {
      console.error("Error fetching people:", err);
      alert("Failed to connect to Supabase. Check console for details. Ensure URL and ANON key are set correctly.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (personData) => {
    if (!supabaseClient) return;
    try {
      // Map form data to database schema
      // Note: first_met must be a date string (YYYY-MM-DD), last_interaction must be an ISO timestamp

      const payload = {
        name: personData.name,
        company: personData.company || null,
        role: personData.role || null,
        location: personData.location || null,
        met_at: personData.met_at || null,
        first_met: personData.first_met ? personData.first_met : null,
        // Using last_interaction_date from the form as the timestamp
        last_interaction: personData.last_interaction_date ? new Date(personData.last_interaction_date).toISOString() : null,
        // Convert intent array back to comma separated string for DB
        intent: personData.intent && personData.intent.length > 0 ? personData.intent.join(',') : null,
        notes: personData.notes && personData.notes.trim().length > 0 ? personData.notes.trim() : null
      };

      if (personData.id) {
        // Edit existing
        const { error } = await supabaseClient
          .from('people')
          .update(payload)
          .eq('id', personData.id);

        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabaseClient
          .from('people')
          .insert([payload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingPerson(null);
      fetchPeople(); // Refresh the list
    } catch (err) {
      console.error("Error saving person:", err);
      alert("Error saving data: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPeople(); // Refresh the list
    } catch (err) {
      console.error("Error deleting person:", err);
    }
  };

  const openNewModal = () => {
    setEditingPerson(null);
    setIsModalOpen(true);
  };

  const openEditModal = (person) => {
    setEditingPerson(person);
    setIsModalOpen(true);
  };

  const processedPeople = useMemo(() => {
    let result = [...people];

    // Search filter across name, company, and notes
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.company && p.company.toLowerCase().includes(term)) ||
        (p.notes && p.notes.toLowerCase().includes(term))
      );
    }

    // Intent filter
    if (filterIntent) {
      result = result.filter(p => p.intent && p.intent.includes(filterIntent));
    }

    // Role filter
    if (filterRole) {
      result = result.filter(p => p.role === filterRole);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }

      const dateA = a.last_interaction ? new Date(a.last_interaction).getTime() : 0;
      const dateB = b.last_interaction ? new Date(b.last_interaction).getTime() : 0;

      if (sortBy === 'recent_interaction') {
        return dateB - dateA;
      }
      if (sortBy === 'oldest_interaction') {
        return dateA - dateB;
      }
      return 0;
    });

    return result;
  }, [people, searchTerm, filterIntent, filterRole, sortBy]);

  return (
    <div className="min-h-screen paper-texture font-body text-[#1A1A1A] selection:bg-[#E8E4DF] selection:text-[#1A1A1A]">

      {/* Top Header / Navigation */}
      <header className="border-b border-[#E8E4DF] bg-[#FAFAF8]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              ← Back
            </button>
            <div className="h-4 w-px bg-[#E8E4DF]"></div>
            <div className="flex flex-col">
              <h1 className="font-display text-3xl font-semibold tracking-wide italic text-[#1A1815]">The Network</h1>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C877D] font-display font-bold">Personal Archive</span>
            </div>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#1A1A1A] text-[#FAFAF8] px-4 py-2 border border-transparent rounded-sm font-body text-sm tracking-wide shadow-md hover:bg-[#B8860B] transition-all cursor-pointer min-h-[44px]"
          >
            <Icons.Plus /> Add Entry
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex gap-10 flex-col lg:flex-row items-start">

        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-28 space-y-8 lg:border-r lg:border-[#E8E4DF] lg:pr-8 hidden md:block">
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] font-mono font-medium mb-3 flex items-center gap-2">
              <Icons.Search /> Search
            </h3>
            <input
              type="text"
              placeholder="Name, company, or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-b border-[#E8E4DF] py-1.5 text-sm focus:outline-none focus:border-[#B8860B] transition-colors"
            />
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] font-mono font-medium mb-3 flex items-center gap-2">
              <Icons.Filter /> Refine By Intent
            </h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="intent" checked={filterIntent === ''} onChange={() => setFilterIntent('')} className="accent-[#B8860B]" />
                <span className={filterIntent === '' ? 'font-medium' : 'text-[#6B6B6B]'}>All Intents</span>
              </label>
              {INTENTS.map(intent => (
                <label key={intent} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                  <input type="radio" name="intent" checked={filterIntent === intent} onChange={() => setFilterIntent(intent)} className="accent-[#B8860B]" />
                  <span className={filterIntent === intent ? 'font-medium' : 'text-[#6B6B6B]'}>{intent.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] font-mono font-medium mb-3">Role</h3>
            <SingleSelect
              options={[{ value: '', label: 'All Roles' }, ...ROLES.map(r => ({ value: r, label: r.replace('_', ' ') }))]}
              value={filterRole}
              onChange={(val) => setFilterRole(val)}
              placeholder="All Roles"
            />
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] font-mono font-medium mb-3">Order Archive</h3>
            <SingleSelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              placeholder="Select order..."
            />
          </div>
        </aside>

        {/* Mobile Filters (Simplified) */}
        <div className="w-full md:hidden flex gap-4 overflow-x-auto pb-4 border-b border-[#E8E4DF]">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[150px] flex-1 bg-transparent border-b border-[#E8E4DF] py-1.5 text-sm focus:outline-none"
          />
          <div className="min-w-[140px]">
            <SingleSelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              placeholder="Sort..."
            />
          </div>
        </div>

        {/* Right Content - Grid / Compact */}
        <section className="flex-1 w-full min-w-0">
          {!loading && (
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
                {processedPeople.length} {processedPeople.length === 1 ? 'entry' : 'entries'}
              </p>
              <div className="inline-flex border border-[#E8E4DF] rounded-sm overflow-hidden" role="group" aria-label="Layout">
                <button
                  type="button"
                  onClick={() => setLayoutMode('cards')}
                  className={`px-2.5 py-1.5 min-h-[36px] flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono cursor-pointer transition-colors ${layoutMode === 'cards' ? 'bg-[#1A1A1A] text-[#FAFAF8]' : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F3F0]'
                    }`}
                  aria-pressed={layoutMode === 'cards'}
                  title="Card view"
                >
                  <Icons.Cards /> <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('compact')}
                  className={`px-2.5 py-1.5 min-h-[36px] flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono cursor-pointer transition-colors border-l border-[#E8E4DF] ${layoutMode === 'compact' ? 'bg-[#1A1A1A] text-[#FAFAF8]' : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F3F0]'
                    }`}
                  aria-pressed={layoutMode === 'compact'}
                  title="Compact rows"
                >
                  <Icons.Rows /> <span className="hidden sm:inline">Compact</span>
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <div className="w-8 h-8 border-t-2 border-[#B8860B] rounded-full animate-spin mb-4"></div>
              <p className="font-display italic text-lg text-[#6B6B6B]">Opening the archives...</p>
            </div>
          ) : processedPeople.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#E8E4DF] bg-white/50 rounded-sm">
              <h2 className="font-display text-2xl italic text-[#6B6B6B] mb-2">No entries found</h2>
              <p className="text-sm text-[#6B6B6B] mb-4">Adjust your filters or add a new person to your network.</p>
              <button
                onClick={openNewModal}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAFAF8] px-4 py-2 rounded-sm font-display text-base hover:bg-[#B8860B] transition-colors cursor-pointer"
              >
                <Icons.Plus /> Add First Entry
              </button>
            </div>
          ) : layoutMode === 'compact' ? (
            <div className="border border-[#E8E4DF] bg-white rounded-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,0.85fr)_minmax(0,1fr)_auto] gap-3 px-3 py-2 bg-[#F5F3F0] border-b border-[#E8E4DF] text-[9px] uppercase tracking-[0.16em] font-mono text-[#6B6B6B]">
                <span>Name</span>
                <span>Affiliation</span>
                <span>Location</span>
                <span>Last contact</span>
                <span>Intent</span>
                <span className="w-16" />
              </div>
              <div className="divide-y divide-[#E8E4DF]">
                {processedPeople.map(person => {
                  const affiliation = person.company
                    ? `${person.role ? `${person.role.replace('_', ' ')} · ` : ''}${person.company}`
                    : (person.role ? person.role.replace('_', ' ') : '—');
                  const lastContact = person.last_interaction
                    ? new Date(person.last_interaction).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—';

                  return (
                    <div
                      key={person.id}
                      title={person.notes || undefined}
                      className="group grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,0.85fr)_minmax(0,1fr)_auto] gap-1 md:gap-3 items-center px-3 py-2 hover:bg-[#F5F3F0] transition-colors"
                    >
                      <div className="min-w-0 flex items-baseline justify-between gap-2 md:block">
                        <h3 className="font-display text-base md:text-[17px] text-[#1A1A1A] font-semibold italic leading-tight truncate">{person.name}</h3>
                        <span className="md:hidden text-[10px] text-[#6B6B6B] shrink-0">{lastContact}</span>
                      </div>
                      <p className="text-xs text-[#6B6B6B] capitalize truncate">{affiliation}</p>
                      <p className="hidden md:block text-xs text-[#6B6B6B] truncate">{person.location || '—'}</p>
                      <p className="hidden md:block text-xs text-[#6B6B6B] tabular-nums">{lastContact}</p>
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {(person.intent || []).slice(0, 2).map(int => (
                          <span key={int} className="text-[9px] uppercase tracking-wider bg-[#F5F3F0] group-hover:bg-white text-[#1A1A1A] px-1.5 py-0.5 rounded-sm border border-[#E8E4DF] truncate max-w-[7rem]">
                            {int.replace('_', ' ')}
                          </span>
                        ))}
                        {(person.intent || []).length > 2 && (
                          <span className="text-[9px] font-mono text-[#6B6B6B]">+{person.intent.length - 2}</span>
                        )}
                      </div>
                      <div className="flex gap-0.5 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(person)} className="p-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white transition-colors rounded-sm cursor-pointer" title="Edit"><Icons.Edit /></button>
                        <button onClick={() => handleDelete(person.id)} className="p-1.5 text-[#6B6B6B] hover:text-red-800 hover:bg-red-50 transition-colors rounded-sm cursor-pointer" title="Delete"><Icons.Trash /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processedPeople.map(person => (
                <div key={person.id} className="group relative bg-white border border-[#E8E4DF] p-6 transition-all hover:shadow-[0_8px_30px_rgba(26,26,26,0.04)] hover:-translate-y-1 rounded-sm flex flex-col justify-between">

                  <div>
                    {/* Actions overlay */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => openEditModal(person)} className="p-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F3F0] transition-colors rounded-sm cursor-pointer" title="Edit"><Icons.Edit /></button>
                      <button onClick={() => handleDelete(person.id)} className="p-1.5 text-[#6B6B6B] hover:text-red-800 hover:bg-red-50 transition-colors rounded-sm cursor-pointer" title="Delete"><Icons.Trash /></button>
                    </div>

                    <div className="border-b border-[#E8E4DF] pb-4 mb-4">
                      <h3 className="font-display text-2xl text-[#1A1A1A] font-semibold leading-tight">{person.name}</h3>
                      {person.company && <p className="text-sm text-[#6B6B6B] mt-1">{person.role ? `${person.role.replace('_', ' ')} at ` : ''}<span className="font-medium text-[#1A1A1A]">{person.company}</span></p>}
                      {!person.company && person.role && <p className="text-sm text-[#6B6B6B] mt-1 capitalize">{person.role.replace('_', ' ')}</p>}
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {person.location && (
                        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                          <Icons.MapPin /> {person.location}
                        </div>
                      )}
                      {person.first_met && (
                        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                          <Icons.Calendar /> First met: {new Date(person.first_met).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} {person.met_at ? `(${person.met_at.replace('_', ' ')})` : ''}
                        </div>
                      )}
                      {person.last_interaction && (
                        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                          <Icons.Calendar /> Last contact: {new Date(person.last_interaction).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                    </div>

                    {/* Person Notes */}
                    {person.notes && (
                      <div className="mb-4 text-xs italic text-[#6B6B6B] bg-[#F5F3F0] p-3 rounded-sm border border-[#E8E4DF] leading-relaxed">
                        <p className="line-clamp-3">"{person.notes}"</p>
                      </div>
                    )}
                  </div>

                  {person.intent && person.intent.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-[#E8E4DF] mt-2">
                      {person.intent.map(int => (
                        <span key={int} className="text-[10px] uppercase tracking-wider bg-[#F5F3F0] text-[#1A1A1A] px-2 py-1 rounded-sm border border-[#E8E4DF]">
                          {int.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        person={editingPerson}
      />
    </div>
  );
}
