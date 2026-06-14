// TeamPage.jsx — "My Team": company name, shareable company code, member list
// with roles. Owner can change roles, remove members, and transfer ownership.
// Wired to Supabase (hr_seats + companies + RLS).
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Crown, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getInitials, getAvatarColor } from '../lib/avatarUtils';
import { toast } from '../components/ui/use-toast';

const ROLE_STYLES = {
  owner: 'bg-amber-50 text-amber-700 border-amber-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  member: 'bg-gray-100 text-gray-600 border-gray-200',
};

function fmtDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export default function TeamPage() {
  const { user, profile } = useAuth();
  const meId = profile?.id || user?.id;

  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('Your company');
  const [companyCode, setCompanyCode] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadMembers = useCallback(async (cid) => {
    const { data } = await supabase
      .from('hr_seats')
      .select('id, profile_id, role, granted_at, profile:profiles!profile_id(full_name)')
      .eq('company_id', cid);
    const order = { owner: 0, admin: 1, member: 2 };
    const list = (data || []).map((s) => ({
      id: s.id, profile_id: s.profile_id, role: s.role,
      name: s.profile?.full_name || 'Unknown', joined: fmtDate(s.granted_at),
    })).sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9));
    setMembers(list);
  }, []);

  const load = useCallback(async () => {
    if (!meId) return;
    setLoading(true);
    try {
      const { data: seat } = await supabase
        .from('hr_seats')
        .select('company_id, role, company:companies(id, name, company_code)')
        .eq('profile_id', meId).limit(1);
      const s = seat && seat[0];
      if (s?.company_id) {
        setCompanyId(s.company_id);
        setCompanyName(s.company?.name || 'Your company');
        setCompanyCode(s.company?.company_code || '');
        await loadMembers(s.company_id);
      } else {
        setCompanyId(null);
      }
    } catch (e) { console.error('Team load failed', e); }
    finally { setLoading(false); }
  }, [meId, loadMembers]);

  useEffect(() => { load(); }, [load]);

  const myRole = members.find((m) => m.profile_id === meId)?.role || 'member';
  const canSeeCode = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(companyCode); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { toast({ title: 'Copy failed', description: companyCode, variant: 'destructive' }); }
  };

  const changeRole = async (seat, newRole) => {
    const { error } = await supabase.from('hr_seats').update({ role: newRole }).eq('id', seat.id);
    if (error) { toast({ title: 'Could not change role', variant: 'destructive' }); return; }
    setMembers((prev) => prev.map((m) => (m.id === seat.id ? { ...m, role: newRole } : m)));
  };

  const removeMember = async (seat) => {
    if (!window.confirm(`Remove ${seat.name} from the team?`)) return;
    const { error } = await supabase.from('hr_seats').delete().eq('id', seat.id);
    if (error) { toast({ title: 'Could not remove member', variant: 'destructive' }); return; }
    setMembers((prev) => prev.filter((m) => m.id !== seat.id));
    toast({ title: 'Member removed', variant: 'success' });
  };

  const transferOwnership = async (seat) => {
    if (!window.confirm(`Transfer ownership to ${seat.name}? You will become an admin.`)) return;
    const mySeat = members.find((m) => m.profile_id === meId);
    // 1) move company ownership, 2) promote target, 3) demote self
    const { error: e1 } = await supabase.from('companies').update({ owner_id: seat.profile_id }).eq('id', companyId);
    if (e1) { toast({ title: 'Transfer failed', variant: 'destructive' }); return; }
    await supabase.from('hr_seats').update({ role: 'owner' }).eq('id', seat.id);
    if (mySeat) await supabase.from('hr_seats').update({ role: 'admin' }).eq('id', mySeat.id);
    setMembers((prev) => prev.map((m) => {
      if (m.id === seat.id) return { ...m, role: 'owner' };
      if (mySeat && m.id === mySeat.id) return { ...m, role: 'admin' };
      return m;
    }));
    toast({ title: 'Ownership transferred', description: `${seat.name} is now the owner.`, variant: 'success' });
  };

  if (loading) return <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center"><div className="spinner" /></div>;

  if (!companyId) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4">
        <p className="text-sm text-gray-400 text-center">You're not part of a company yet. Register or join one during onboarding.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">My team</p>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-6 h-6 text-brand" />{companyName}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has access and what they can do.</p>
        </div>

        {canSeeCode && companyCode && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow hover:shadow-md">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Company code</h2>
            <p className="text-xs text-gray-500 mb-3">Share this so colleagues can join your company during sign-up.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 rounded-xl bg-brand-50 border border-brand-100 text-base font-mono font-semibold tracking-widest text-brand">{companyCode}</code>
              <button onClick={copyCode} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Members ({members.length})</h2>
            {!isOwner && <span className="text-xs text-gray-400">Only the owner can change roles</span>}
          </div>
          <div className="space-y-2">
            {members.map((m) => {
              const c = getAvatarColor(m.name);
              const isMe = m.profile_id === meId;
              const isOwnerRow = m.role === 'owner';
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: c.bg, color: c.text }}>{getInitials(m.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                      {isMe && <span className="text-[10px] font-bold text-brand bg-brand-50 px-1.5 py-0.5 rounded">You</span>}
                    </div>
                    <p className="text-[11px] text-gray-400">Joined {m.joined}</p>
                  </div>
                  {isOwner && !isOwnerRow ? (
                    <div className="flex items-center gap-1.5">
                      <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} className="text-xs font-semibold rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button onClick={() => transferOwnership(m)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-amber-700 hover:bg-amber-50 border border-amber-200"><Crown className="w-3.5 h-3.5" /> Make owner</button>
                      <button onClick={() => removeMember(m)} title="Remove" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" aria-label="Remove member"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold uppercase border ${ROLE_STYLES[m.role]}`}>{m.role === 'owner' && <Crown className="w-3 h-3" />}{m.role}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-gray-400" /> What each role can do</h2>
          <ul className="space-y-2 text-xs text-gray-600">
            <li><span className="font-semibold text-amber-700">Owner</span> — full control: roles, members, posts, jobs, company profile, ownership transfer.</li>
            <li><span className="font-semibold text-blue-700">Admin</span> — edit the company profile, post/delete posts and jobs, message candidates. Cannot change roles.</li>
            <li><span className="font-semibold text-gray-700">Member</span> — post jobs and edit their own postings.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
