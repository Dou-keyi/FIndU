// CompanyPage.jsx — company portfolio (employer side). Tabs: Home / Jobs.
// Home = stats + inline-editable company details. Editable logo + cover (pencil).
// Floating + button -> feed. Frontend-first (local state).
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, Loader2, Building2, MapPin, Globe, ExternalLink,
  Briefcase, Plus, Pencil, FileText, Download, Upload, X, Check,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toggleFollow, checkIsFollowing, getFollowerCount } from '../lib/feedData';
import { getInitials, getAvatarColor, getBrandTint } from '../lib/avatarUtils';
import { getCompanyExtras } from '../lib/companyProfileMock';
import FeedJobCard from '../components/feed/FeedJobCard';
import JobDetailModal from '../components/swipe/JobDetailModal';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';
import { EditableLine, EditableTags } from '../components/company/InlineEdit';
import { deleteJob } from '../lib/jobPostingData';
import { toast } from '../components/ui/use-toast';

const TABS = [{ key: 'home', label: 'Home' }, { key: 'jobs', label: 'Jobs' }];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Logistics', 'Consulting', 'Education', 'Other'];
const HEADCOUNTS = ['1–10', '11–50', '51–200', '201–1000', '1000+'];

function StatCard({ value, label }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center transition-colors hover:bg-brand-50/60">
      <p className="text-2xl font-extrabold text-gray-900 leading-none tracking-tight">{value}</p>
      <p className="text-[11px] font-medium text-gray-500 mt-1.5">{label}</p>
    </div>
  );
}

export default function CompanyPage() {
  const { companyId } = useParams();
  const { user, profile } = useAuth();
  const role = profile?.role || 'candidate';
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [details, setDetails] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [hrSeats, setHrSeats] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [coverPreview, setCoverPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [leadership, setLeadership] = useState([]);
  const [reports, setReports] = useState([]);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('');

  const [jobDetailNode, setJobDetailNode] = useState(null);
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);
  const coverInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const isOwner = company?.owner_id === user?.id;
  const isEmployerForCompany = isOwner || hrSeats.some((s) => s.profile_id === user?.id);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data: compData, error: compErr } = await supabase.from('companies').select('*').eq('id', companyId).single();
      if (compErr) throw compErr;
      setCompany(compData);
      const ex = getCompanyExtras(compData);
      setDetails({
        about: compData.about || '', culture: compData.culture || '', tagline: ex.tagline || '',
        location: ex.location || '', website: ex.website || '', industry: compData.industry || '',
        headcount_range: compData.headcount_range || '', founded: ex.founded || '',
        specialties: ex.specialties || [], markets: ex.markets || [],
      });
      const { data: leads } = await supabase.from('company_leadership')
        .select('id, name, role, avatar_url').eq('company_id', companyId).order('position').order('created_at');
      setLeadership((leads || []).map((l) => ({ id: l.id, name: l.name, role: l.role, avatar_url: l.avatar_url })));
      const { data: reps } = await supabase.from('company_reports')
        .select('id, label, file_name, file_url').eq('company_id', companyId).order('created_at', { ascending: false });
      setReports((reps || []).map((r) => ({ id: r.id, label: r.label, fileName: r.file_name, url: r.file_url })));

      const { data: jobsData } = await supabase.from('jobs').select('*, company:companies(id, name, logo_url)')
        .eq('company_id', companyId).eq('status', 'open').order('created_at', { ascending: false });
      setCompanyJobs(jobsData || []);
      setFollowerCount(await getFollowerCount(companyId));
      if (user && role === 'candidate') setIsFollowing(await checkIsFollowing(user.id, companyId));
      if (user) {
        const { data: seats } = await supabase.from('hr_seats').select('*, profile:profiles!profile_id(id, full_name)').eq('company_id', companyId);
        setHrSeats(seats || []);
      }
    } catch (err) { console.error('Failed to load company:', err); }
    finally { setLoading(false); }
  }, [companyId, user, role]);

  useEffect(() => { loadData(); }, [loadData]);

  const persistCompany = async (patch) => {
    const { error } = await supabase.from('companies').update(patch).eq('id', companyId);
    if (error) toast({ title: 'Could not save', description: 'Only owners and admins can edit the company.', variant: 'destructive' });
  };
  const updateField = (k, v) => { setDetails((d) => ({ ...d, [k]: v })); persistCompany({ [k]: v }); };
  const updateList = (k, arr) => { setDetails((d) => ({ ...d, [k]: arr })); persistCompany({ [k]: arr }); };

  const uploadImage = async (bucket, file, prefix, column, setPreview) => {
    setPreview(URL.createObjectURL(file));
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const filePath = `${companyId}/${prefix}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    if (upErr) { toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); return; }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
    await persistCompany({ [column]: pub.publicUrl });
    toast({ title: 'Saved', variant: 'success' });
  };
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadImage('company-covers', file, 'cover', 'cover_url', setCoverPreview);
  };
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadImage('company-logos', file, 'logo', 'logo_url', setLogoPreview);
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) return;
    const { data, error } = await supabase.from('company_leadership')
      .insert({ company_id: companyId, name: newPersonName.trim(), role: newPersonRole.trim() || 'Team member', position: leadership.length })
      .select('id, name, role, avatar_url').single();
    if (error) { toast({ title: 'Could not add', description: 'Only owners and admins can edit.', variant: 'destructive' }); return; }
    setLeadership((prev) => [...prev, { id: data.id, name: data.name, role: data.role, avatar_url: data.avatar_url }]);
    setNewPersonName(''); setNewPersonRole(''); setAddingPerson(false);
  };
  const cancelAddPerson = () => { setNewPersonName(''); setNewPersonRole(''); setAddingPerson(false); };
  const removePerson = async (p) => {
    setLeadership((prev) => prev.filter((x) => x.id !== p.id));
    if (p.id) await supabase.from('company_leadership').delete().eq('id', p.id);
  };

  const handleReportAdd = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const filePath = `${companyId}/report-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('company-reports').upload(filePath, file, { upsert: true });
    if (upErr) { toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); return; }
    const { data: pub } = supabase.storage.from('company-reports').getPublicUrl(filePath);
    const { data, error } = await supabase.from('company_reports')
      .insert({ company_id: companyId, label: file.name, file_name: file.name, file_url: pub.publicUrl })
      .select('id, label, file_name, file_url').single();
    if (error) { toast({ title: 'Could not save report', description: 'Only owners and admins can edit.', variant: 'destructive' }); return; }
    setReports((prev) => [{ id: data.id, label: data.label, fileName: data.file_name, url: data.file_url }, ...prev]);
    toast({ title: 'Report uploaded', variant: 'success' });
  };
  const removeReport = async (r) => {
    setReports((prev) => prev.filter((x) => x.id !== r.id));
    if (r.id) await supabase.from('company_reports').delete().eq('id', r.id);
  };

  const handleFollow = async () => {
    if (!user || role !== 'candidate') return;
    setFollowLoading(true);
    try { const ns = await toggleFollow(user.id, companyId, isFollowing); setIsFollowing(ns); setFollowerCount((p) => (ns ? p + 1 : Math.max(0, p - 1))); }
    finally { setFollowLoading(false); }
  };

  const handleJobApply = async (job) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('applications').insert({ job_id: job.id, candidate_id: user.id });
      if (error && error.code !== '23505') throw error;
      setApplyConfirmNode({ ...job, title: job.title, company_name: company?.name });
    } catch (err) { console.error('Failed to apply:', err); }
  };
  const openJobDetail = (job) => setJobDetailNode({ ...job, label: job.title, sublabel: company?.name, company_name: company?.name, company_about: details?.about, skills_required: job.skills_required });
  const handleEditJob = (jobId) => navigate(`/edit-job/${jobId}`);
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try { await deleteJob(jobId); setCompanyJobs((p) => p.filter((j) => j.id !== jobId)); toast({ title: 'Job Deleted', variant: 'success' }); }
    catch { toast({ title: 'Error', description: 'Could not delete job', variant: 'destructive' }); }
  };

  if (loading || !details) return <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center"><div className="spinner" /></div>;
  if (!company) return <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center"><p className="text-sm text-gray-400">Company not found.</p></div>;

  const initials = getInitials(company.name);
  const color = getAvatarColor(company.name);
  const tint = getBrandTint(company.name);
  const coverImage = coverPreview || getCompanyExtras(company).coverUrl;
  const logoImage = logoPreview || company.logo_url;
  const metaBits = [details.industry, details.location, `${followerCount} follower${followerCount !== 1 ? 's' : ''}`, details.headcount_range ? `${details.headcount_range} employees` : null].filter(Boolean);
  const showRow = (val) => val || isEmployerForCompany;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 relative">
      <div className="max-w-3xl mx-auto md:py-6 md:px-4">
        <div className="bg-white md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Cover (bottom layer) */}
          <div className="relative">
            <div className="h-28 md:h-44 w-full"
              style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: `linear-gradient(135deg, ${tint} 0%, ${tint}99 45%, #f8fafc 100%)` }} />
            {isEmployerForCompany && (
              <>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                <button onClick={() => coverInputRef.current?.click()}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur text-gray-600 hover:text-brand hover:bg-white transition-colors shadow-sm"
                  aria-label="Change cover" title="Change cover"><Pencil className="w-4 h-4" /></button>
              </>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Logo (overlay above cover) + editable */}
            <div className="relative w-20 h-20 -mt-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold ring-4 ring-white shadow-md bg-white overflow-hidden"
                style={{ backgroundColor: color.bg, color: color.text }}>
                {logoImage ? <img src={logoImage} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              {isEmployerForCompany && (
                <>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                  <button onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white shadow ring-1 ring-gray-200 flex items-center justify-center text-gray-600 hover:text-brand transition-colors"
                    aria-label="Change logo" title="Change logo"><Pencil className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
              {company.verified && <ShieldCheck className="w-5 h-5 text-brand" />}
            </div>
            {(details.tagline || isEmployerForCompany) && (
              <div className="mt-0.5"><EditableLine value={details.tagline} onApply={(v) => updateField('tagline', v)} canEdit={isEmployerForCompany} placeholder="Add a tagline" className="text-sm text-gray-600" /></div>
            )}
            <p className="text-sm text-gray-500 mt-1">{metaBits.map((b, i) => (<span key={i}>{i > 0 && <span className="mx-1.5 text-gray-300">·</span>}{b}</span>))}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {role === 'candidate' && (
                <button onClick={handleFollow} disabled={followLoading}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${isFollowing ? 'bg-brand text-white hover:bg-brand-dark' : 'border border-brand text-brand hover:bg-brand-50'}`}>
                  {followLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{isFollowing ? 'Following ✓' : '+ Follow'}
                </button>
              )}
              {details.website && (
                <a href={details.website} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5">Visit website <ExternalLink className="w-3.5 h-3.5" /></a>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 px-2">
            <div className="flex">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`relative px-5 py-3 text-sm font-semibold transition-colors ${activeTab === t.key ? 'text-brand' : 'text-gray-500 hover:text-gray-900'}`}>
                  {t.label}
                  {activeTab === t.key && <motion.div layoutId="company-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 px-4 md:px-0 space-y-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <StatCard value={followerCount} label="Followers" />
                  <StatCard value={companyJobs.length} label="Open roles" />
                  <StatCard value={leadership.length} label="Leaders" />
                  <StatCard value={details.markets.length} label="Markets" />
                </div>

                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow hover:shadow-md space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-2">Overview</h2>
                    <EditableLine value={details.about} onApply={(v) => updateField('about', v)} canEdit={isEmployerForCompany} multiline placeholder="What does your company do?" className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap block" />
                  </div>

                  <div className="border-t border-gray-100 pt-4 grid sm:grid-cols-2 gap-4">
                    {showRow(details.website) && <Detail icon={Globe} label="Website"><EditableLine value={details.website} onApply={(v) => updateField('website', v)} canEdit={isEmployerForCompany} placeholder="Add website" className="text-brand break-all" /></Detail>}
                    {showRow(details.industry) && <Detail icon={Briefcase} label="Industry"><EditableLine type="select" options={INDUSTRIES} value={details.industry} onApply={(v) => updateField('industry', v)} canEdit={isEmployerForCompany} placeholder="Add industry" className="text-gray-800 font-medium" /></Detail>}
                    {showRow(details.headcount_range) && <Detail icon={Users} label="Company size"><EditableLine type="select" options={HEADCOUNTS} value={details.headcount_range} onApply={(v) => updateField('headcount_range', v)} canEdit={isEmployerForCompany} placeholder="Add size" className="text-gray-800 font-medium" /></Detail>}
                    {showRow(details.location) && <Detail icon={MapPin} label="Headquarters"><EditableLine value={details.location} onApply={(v) => updateField('location', v)} canEdit={isEmployerForCompany} placeholder="Add location" className="text-gray-800 font-medium" /></Detail>}
                    {showRow(details.founded) && <Detail icon={Building2} label="Founded"><EditableLine value={details.founded} onApply={(v) => updateField('founded', v)} canEdit={isEmployerForCompany} placeholder="Add year" className="text-gray-800 font-medium" /></Detail>}
                    <Detail icon={ShieldCheck} label="Verified">{company.verified ? 'SSM verified ✓' : 'Verification pending'}</Detail>
                    {company.ssm_number && <Detail icon={FileText} label="SSM">{company.ssm_number}</Detail>}
                  </div>

                  {showRow(details.markets.length) && (
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Markets served</h3>
                      <EditableTags values={details.markets} onApply={(arr) => updateList('markets', arr)} canEdit={isEmployerForCompany} accent="gray" emptyText="Add markets" />
                    </div>
                  )}

                  {showRow(details.specialties.length) && (
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Specialties</h3>
                      <EditableTags values={details.specialties} onApply={(arr) => updateList('specialties', arr)} canEdit={isEmployerForCompany} accent="brand" emptyText="Add specialties" />
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Leadership team</h3>
                      {isEmployerForCompany && !addingPerson && <button onClick={() => setAddingPerson(true)} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"><Plus className="w-3.5 h-3.5" /> Add</button>}
                    </div>
                    {isEmployerForCompany && addingPerson && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <input value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="Name" className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                        <input value={newPersonRole} onChange={(e) => setNewPersonRole(e.target.value)} placeholder="Role (e.g. CEO)" className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                        <button onClick={addPerson} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark"><Check className="w-3.5 h-3.5" /> Apply</button>
                        <button onClick={cancelAddPerson} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"><X className="w-3.5 h-3.5" /> Cancel</button>
                      </div>
                    )}
                    {leadership.length === 0 ? <p className="text-sm text-gray-400">No leadership added yet.</p> : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {leadership.map((p, i) => {
                          const c = getAvatarColor(p.name);
                          return (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: c.bg, color: c.text }}>{p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(p.name)}</div>
                              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p><p className="text-xs text-gray-500 truncate">{p.role}</p></div>
                              {isEmployerForCompany && <button onClick={() => removePerson(p)} className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Remove"><X className="w-4 h-4" /></button>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Reports</h3>
                      {isEmployerForCompany && (
                        <>
                          <input id="report-add" type="file" accept="application/pdf" className="hidden" onChange={handleReportAdd} />
                          <button onClick={() => document.getElementById('report-add')?.click()} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"><Upload className="w-3.5 h-3.5" /> Upload</button>
                        </>
                      )}
                    </div>
                    {reports.length === 0 ? <p className="text-sm text-gray-400">No reports yet.</p> : (
                      <div className="space-y-2">
                        {reports.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4" /></div>
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{r.label || r.fileName}</p><p className="text-[11px] text-gray-400 truncate">{r.fileName || 'No file'}</p></div>
                            {r.url ? <a href={r.url} download={r.fileName} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand hover:bg-brand-50"><Download className="w-3.5 h-3.5" /> Download</a> : <span className="text-[11px] text-gray-400">Preview only</span>}
                            {isEmployerForCompany && <button onClick={() => removeReport(r)} className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Remove report"><X className="w-4 h-4" /></button>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {showRow(details.culture) && (
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Culture</h3>
                      <EditableLine value={details.culture} onApply={(v) => updateField('culture', v)} canEdit={isEmployerForCompany} multiline placeholder="What's it like to work here?" className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap block" />
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === 'jobs' && (
              <motion.div key="jobs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-bold text-gray-900">Open roles ({companyJobs.length})</h2>
                    {isEmployerForCompany && <button onClick={() => navigate('/post-job')} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"><Plus className="w-3.5 h-3.5" /> Post a job</button>}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Roles currently open at {company.name}.</p>
                  {companyJobs.length === 0 ? <p className="text-sm text-gray-400 py-2">No open roles right now.</p> : (
                    <div className="space-y-3">{companyJobs.map((job) => <FeedJobCard key={job.id} job={job} onViewDetail={openJobDetail} onApply={handleJobApply} isEmployerForCompany={isEmployerForCompany} onEdit={handleEditJob} onDelete={handleDeleteJob} />)}</div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating + -> feed (employer) */}
      {isEmployerForCompany && (
        <button onClick={() => navigate('/feed')}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 h-14 w-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-dark active:scale-95 transition-all"
          aria-label="Create a post">
          <Plus className="w-6 h-6" />
        </button>
      )}

      <JobDetailModal node={jobDetailNode} isOpen={!!jobDetailNode} onClose={() => setJobDetailNode(null)} onApply={() => { if (jobDetailNode) handleJobApply(jobDetailNode); setJobDetailNode(null); }} />
      <ApplyConfirmSheet node={applyConfirmNode} isOpen={!!applyConfirmNode} onClose={() => setApplyConfirmNode(null)} />
    </div>
  );
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="text-sm min-w-0"><span className="text-gray-500">{label}: </span><span className="text-gray-800 font-medium">{children}</span></div>
    </div>
  );
}
