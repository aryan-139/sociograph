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
const injectStyles = () => {
  if (document.getElementById('editorial-styles')) return;
  const style = document.createElement('style');
  style.id = 'editorial-styles';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
    
    .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
    .font-body { font-family: 'Lora', Georgia, serif; }
    
    .paper-texture {
      background-color: #FDFBF7;
      background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    }
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D1CEC7; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #A39E93; }
  `;
  document.head.appendChild(style);
};

const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
        className="w-full bg-transparent border-b border-[#D1CEC7] py-2 cursor-pointer flex flex-wrap gap-1 items-center min-h-[38px] transition-colors hover:border-[#2C2A25]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-[#A39E93] font-body text-sm">{placeholder}</span>
        ) : (
          selected.map(item => (
            <span key={item} className="bg-[#2C2A25] text-[#FDFBF7] text-xs px-2 py-0.5 rounded-sm font-body tracking-wide capitalize flex items-center gap-1">
              {item}
              <span className="hover:text-red-300" onClick={(e) => { e.stopPropagation(); toggleOption(item); }}>×</span>
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-[#FDFBF7] border border-[#E6E2D8] shadow-lg z-50 max-h-48 overflow-y-auto rounded-sm">
          {options.map(option => (
            <div
              key={option}
              className="px-3 py-2 text-sm font-body cursor-pointer hover:bg-[#F4F1EA] flex justify-between items-center text-[#2C2A25]"
              onClick={() => toggleOption(option)}
            >
              <span className="capitalize">{option}</span>
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
    intent: []
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
        met_at: person.met_at || ''
      });
    } else {
      setFormData({ name: '', company: '', role: '', location: '', met_at: '', first_met: '', last_interaction_date: '', interaction_type: '', intent: [] });
    }
  }, [person, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
  };

  const Label = ({ children }) => <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8C877D] mb-1 mt-5 font-display font-bold">{children}</label>;
  const InputCls = "w-full bg-transparent border-b border-[#D1CEC7] py-2 text-[#2C2A25] font-body text-sm placeholder:text-[#A39E93] focus:outline-none focus:border-[#2C2A25] transition-colors rounded-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1815]/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#FDFBF7] paper-texture border border-[#E6E2D8] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm flex flex-col">
        <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur border-b border-[#E6E2D8] p-6 flex justify-between items-center z-10">
          <h2 className="font-display text-2xl text-[#2C2A25] italic">{person ? 'Edit Profile' : 'New Entry'}</h2>
          <button onClick={onClose} className="text-[#8C877D] hover:text-[#2C2A25] transition-colors"><Icons.X /></button>
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
            <select name="role" value={formData.role} onChange={handleChange} className={InputCls}>
              <option value="">Select a role...</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <Label>Location</Label>
            <select name="location" value={formData.location} onChange={handleChange} className={InputCls}>
              <option value="">Select location...</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <Label>Met At</Label>
            <select name="met_at" value={formData.met_at} onChange={handleChange} className={InputCls}>
              <option value="">Select origin...</option>
              {MET_AT.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>

          <div>
            <Label>First Met Date</Label>
            <input type="date" name="first_met" value={formData.first_met} onChange={handleChange} className={InputCls} />
          </div>

          <div className="col-span-1 md:col-span-2 mt-4 border-t border-[#E6E2D8] pt-2">
            <h3 className="font-display text-lg italic text-[#4A4843]">Relationship Dynamics</h3>
          </div>

          <div>
            <Label>Last Interaction Date</Label>
            <input type="date" name="last_interaction_date" value={formData.last_interaction_date} onChange={handleChange} className={InputCls} />
          </div>

          <div>
            <Label>Interaction Medium</Label>
            <select name="interaction_type" value={formData.interaction_type} onChange={handleChange} className={InputCls}>
              <option value="">Select medium...</option>
              {INTERACTION_TYPES.map(i => <option key={i} value={i} className="capitalize">{i.replace('_', ' ')}</option>)}
            </select>
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

          <div className="col-span-1 md:col-span-2 mt-10 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 font-display text-[#4A4843] hover:text-[#2C2A25] transition-colors">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-[#2C2A25] text-[#FDFBF7] font-display text-lg hover:bg-[#1A1815] transition-colors shadow-md">
              {person ? 'Save Changes' : 'Commit to Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function NetworkRolodex() {
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

  useEffect(() => {
    injectStyles();

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
        intent: personData.intent && personData.intent.length > 0 ? personData.intent.join(',') : null
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

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || (p.company && p.company.toLowerCase().includes(term)));
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
    <div className="min-h-screen paper-texture font-body text-[#2C2A25] selection:bg-[#E6E2D8] selection:text-[#1A1815]">

      {/* Top Header / Navigation */}
      <header className="border-b-2 border-[#E6E2D8] bg-[#FDFBF7]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-display text-3xl font-semibold tracking-wide italic text-[#1A1815]">The Network</h1>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C877D] font-display font-bold">Personal Archive</span>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#1A1815] text-[#FDFBF7] px-5 py-2.5 rounded-sm font-display text-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5)] hover:bg-[#2C2A25] transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Icons.Plus /> Add Entry
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex gap-10 flex-col lg:flex-row items-start">

        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 sticky top-28 space-y-8 border-r border-[#E6E2D8] pr-8 hidden md:block">
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8C877D] font-display font-bold mb-4 flex items-center gap-2">
              <Icons.Search /> Search
            </h3>
            <input
              type="text"
              placeholder="Name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-b border-[#D1CEC7] py-1.5 text-sm focus:outline-none focus:border-[#1A1815] transition-colors"
            />
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8C877D] font-display font-bold mb-4 flex items-center gap-2">
              <Icons.Filter /> Refine By Intent
            </h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="intent" checked={filterIntent === ''} onChange={() => setFilterIntent('')} className="accent-[#1A1815]" />
                <span className={filterIntent === '' ? 'font-medium' : 'text-[#706B62]'}>All Intents</span>
              </label>
              {INTENTS.map(intent => (
                <label key={intent} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                  <input type="radio" name="intent" checked={filterIntent === intent} onChange={() => setFilterIntent(intent)} className="accent-[#1A1815]" />
                  <span className={filterIntent === intent ? 'font-medium' : 'text-[#706B62]'}>{intent}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8C877D] font-display font-bold mb-4">Role</h3>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-transparent border-b border-[#D1CEC7] py-1.5 text-sm focus:outline-none focus:border-[#1A1815] transition-colors capitalize cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8C877D] font-display font-bold mb-4">Order Archive</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent border-b border-[#D1CEC7] py-1.5 text-sm focus:outline-none focus:border-[#1A1815] transition-colors cursor-pointer"
            >
              <option value="recent_interaction">Most Recent Interaction</option>
              <option value="oldest_interaction">Oldest Interaction</option>
              <option value="name_asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </aside>

        {/* Mobile Filters (Simplified) */}
        <div className="w-full md:hidden flex gap-4 overflow-x-auto pb-4 border-b border-[#E6E2D8]">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[150px] flex-1 bg-transparent border-b border-[#D1CEC7] py-1.5 text-sm focus:outline-none"
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-b border-[#D1CEC7] text-sm py-1.5">
            <option value="recent_interaction">Sort: Recent</option>
            <option value="oldest_interaction">Sort: Oldest</option>
            <option value="name_asc">Sort: A-Z</option>
          </select>
        </div>

        {/* Right Content - Grid */}
        <section className="flex-1 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <div className="w-8 h-8 border-t-2 border-[#1A1815] rounded-full animate-spin mb-4"></div>
              <p className="font-display italic text-lg text-[#706B62]">Opening the archives...</p>
            </div>
          ) : processedPeople.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#D1CEC7] bg-[#FDFBF7]/50 rounded-sm">
              <h2 className="font-display text-2xl italic text-[#706B62] mb-2">No entries found</h2>
              <p className="text-sm text-[#A39E93] mb-4">Adjust your filters or add a new person to your network.</p>
              <button
                onClick={openNewModal}
                className="inline-flex items-center gap-2 bg-[#1A1815] text-[#FDFBF7] px-4 py-2 rounded-sm font-display text-base hover:bg-[#2C2A25] transition-colors cursor-pointer"
              >
                <Icons.Plus /> Add First Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processedPeople.map(person => (
                <div key={person.id} className="group relative bg-[#FDFBF7] border border-[#E6E2D8] p-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 rounded-sm">

                  {/* Actions overlay */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => openEditModal(person)} className="p-1.5 text-[#8C877D] hover:text-[#1A1815] hover:bg-[#F4F1EA] transition-colors rounded-sm cursor-pointer" title="Edit"><Icons.Edit /></button>
                    <button onClick={() => handleDelete(person.id)} className="p-1.5 text-[#8C877D] hover:text-red-800 hover:bg-red-50 transition-colors rounded-sm cursor-pointer" title="Delete"><Icons.Trash /></button>
                  </div>

                  <div className="border-b border-[#E6E2D8] pb-4 mb-4">
                    <h3 className="font-display text-2xl text-[#1A1815] font-semibold leading-tight">{person.name}</h3>
                    {person.company && <p className="text-sm text-[#706B62] mt-1">{person.role ? `${person.role} at ` : ''}<span className="font-medium text-[#4A4843]">{person.company}</span></p>}
                    {!person.company && person.role && <p className="text-sm text-[#706B62] mt-1 capitalize">{person.role}</p>}
                  </div>

                  <div className="space-y-3 mb-5">
                    {person.location && (
                      <div className="flex items-center gap-2 text-xs text-[#706B62]">
                        <Icons.MapPin /> {person.location}
                      </div>
                    )}
                    {person.first_met && (
                      <div className="flex items-center gap-2 text-xs text-[#8C877D]">
                        <Icons.Calendar /> First met: {new Date(person.first_met).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} {person.met_at ? `(${person.met_at})` : ''}
                      </div>
                    )}
                    {person.last_interaction && (
                      <div className="flex items-center gap-2 text-xs text-[#706B62]">
                        <Icons.Calendar /> Last contact: {new Date(person.last_interaction).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {person.intent && person.intent.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed border-[#E6E2D8]">
                      {person.intent.map(int => (
                        <span key={int} className="text-[10px] uppercase tracking-wider bg-[#F4F1EA] text-[#4A4843] px-2 py-1 rounded-sm border border-[#E6E2D8]">
                          {int}
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
