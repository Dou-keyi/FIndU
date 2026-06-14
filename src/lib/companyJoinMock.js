// companyJoin — real Supabase calls for the "join existing company" flow.
// (Filename kept for import stability; no longer a mock.)
import { supabase } from './supabase';

// Duplicate-company guard: returns the existing company for a domain, or null.
export async function checkDomainExists(domain) {
  if (!domain) return null;
  const d = domain.trim().toLowerCase().replace(/^@/, '');
  const { data } = await supabase
    .from('companies').select('id, name, domain').ilike('domain', d).limit(1);
  return (data && data[0]) || null;
}

// Preview a company by its code before joining (no write).
export async function verifyCompanyCode(code) {
  if (!code) return { ok: false };
  const { data, error } = await supabase
    .from('companies').select('id, name, domain, industry')
    .eq('company_code', code.trim().toUpperCase()).limit(1);
  if (error || !data || !data[0]) return { ok: false };
  return { ok: true, company: data[0] };
}

// Actually join — creates a 'member' hr_seat via the security-definer RPC.
export async function joinCompanyByCode(code) {
  const { data, error } = await supabase.rpc('join_company_by_code', { p_code: code.trim() });
  if (error) return { ok: false, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, company: { id: row?.company_id, name: row?.company_name } };
}
