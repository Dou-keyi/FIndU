// companyProfile — maps the companies row to the shape CompanyPage uses.
// Real columns now back all of these; website falls back to the domain.
export function getCompanyExtras(company) {
  if (!company) {
    return { coverUrl: null, location: null, website: null, tagline: null, founded: null, specialties: [], markets: [] };
  }
  const domain = (company.domain || '').trim();
  return {
    coverUrl: company.cover_url || null,
    location: company.location || null,
    website: company.website || (domain ? `https://${domain}` : null),
    tagline: company.tagline || null,
    founded: company.founded || null,
    specialties: company.specialties || [],
    markets: company.markets || [],
  };
}
