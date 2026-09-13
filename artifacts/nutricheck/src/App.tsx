import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BarChart3, Bell, BookOpen, Box, Check, CheckCircle2,
  ChevronRight, CircleAlert, ClipboardCheck, Download, FileCheck2, FileText, Filter, HelpCircle,
  History, Home, Info, Leaf, LifeBuoy, ListChecks, LockKeyhole, LogOut, Menu,
  Pencil, Plus, QrCode, ScanLine, Search, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Store, Trash2, UploadCloud, UserRound, Users, X, Zap,
} from 'lucide-react';
import {
  type Complaint, type Product, type Rule, type Status, getStored, initialComplaints,
  initialRules, products, setStored,
} from '@/lib/mock-data';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#18B978',
    colorForeground: '#173A2A',
    colorMutedForeground: '#718078',
    colorDanger: '#C24743',
    colorBackground: '#FFFFFF',
    colorInput: '#FBFCFB',
    colorInputForeground: '#20382B',
    colorNeutral: '#DCE7DF',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#173A2A] font-extrabold tracking-[-.04em]',
    headerSubtitle: 'text-[#718078]',
    socialButtonsBlockButtonText: 'text-[#30473A] font-semibold',
    formFieldLabel: 'text-[#42554A] font-bold',
    footerActionLink: 'text-[#12885C] font-bold',
    footerActionText: 'text-[#718078]',
    dividerText: 'text-[#718078]',
    identityPreviewEditButton: 'text-[#12885C]',
    formFieldSuccessText: 'text-[#12885C]',
    alertText: 'text-[#8D3834]',
    logoBox: 'mb-3',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#DCE7DF] bg-white hover:bg-[#F3F8F5]',
    formButtonPrimary: 'bg-[#18B978] hover:bg-[#119E67] text-white shadow-[0_5px_12px_rgba(24,185,120,.18)]',
    formFieldInput: 'border-[#DCE7DF] bg-[#FBFCFB] text-[#20382B]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#E6EEE8]',
    alert: 'bg-[#FCE6E4] border-[#F0C9C6]',
    otpCodeFieldInput: 'border-[#DCE7DF] bg-[#FBFCFB]',
    formFieldRow: 'text-[#42554A]',
    main: 'bg-transparent',
  },
};

const queryClient = new QueryClient();
type ScanPhoto = { name: string; url: string };
const currentScanPhotos: { front: ScanPhoto | null; back: ScanPhoto | null } = { front: null, back: null };

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2.5 ${compact ? '' : 'w-fit'}`} data-testid="link-logo">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#18B978] text-white shadow-[0_5px_12px_rgba(24,185,120,.22)]"><ShieldCheck size={19} strokeWidth={2.5} /></span>
    {!compact && <span className="text-[17px] font-extrabold tracking-[-.04em] text-[#17191C]">Legal<span className="text-[#18B978]">Akshi</span></span>}
  </Link>;
}

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-[#18B978] text-white hover:bg-[#119e67] shadow-[0_5px_12px_rgba(24,185,120,.18)]',
    secondary: 'border border-[#dce5df] bg-white text-[#173a2a] hover:border-[#18B978] hover:text-[#12885c]',
    ghost: 'text-[#607069] hover:bg-[#eef5f0] hover:text-[#173a2a]',
    danger: 'bg-[#d9534f] text-white hover:bg-[#bd4541]',
  };
  return <button className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'green' | 'yellow' | 'red' | 'neutral' }) {
  const tones = { green: 'bg-[#e3f7ed] text-[#08784e]', yellow: 'bg-[#fff4cf] text-[#946b09]', red: 'bg-[#fce6e4] text-[#b43b37]', neutral: 'bg-[#edf1ef] text-[#53625b]' };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={status === 'pass' ? 'green' : status === 'review' ? 'yellow' : 'red'}>{status === 'pass' ? <Check size={12} /> : status === 'review' ? <Info size={12} /> : <CircleAlert size={12} />}{status === 'pass' ? 'Compliant' : status === 'review' ? 'Needs review' : 'Violation'}</Badge>;
}

function AppShell({ children, role, setRole }: { children: ReactNode; role: 'consumer' | 'officer'; setRole: (role: 'consumer' | 'officer') => void }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const consumerNav = [{ href: '/dashboard', label: 'Overview', icon: Home }, { href: '/upload', label: 'Scan a label', icon: ScanLine }, { href: '/complaints', label: 'My complaints', icon: ClipboardCheck }, { href: '/reports', label: 'Reports', icon: FileText }];
  const officerNav = [{ href: '/inspector/dashboard', label: 'Overview', icon: Home }, { href: '/inspector/rules', label: 'Rule library', icon: BookOpen }, { href: '/inspector/complaints', label: 'Enforcement queue', icon: ClipboardCheck }];
  const nav = role === 'consumer' ? consumerNav : officerNav;
  const isActive = (href: string) => location === href || (href !== '/dashboard' && location.startsWith(href));
  const displayName = user?.firstName || user?.fullName || (role === 'consumer' ? 'Consumer' : 'Officer');
  const initials = `${user?.firstName?.[0] || displayName[0] || 'N'}${user?.lastName?.[0] || ''}`.toUpperCase();
  return <div className="grain flex min-h-[100dvh] bg-[#F7F8F6]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#e1e9e3] bg-[#fbfcfa] px-4 py-5 transition-transform duration-300 md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-9 flex items-center justify-between px-2"><Logo /><button className="text-[#75847b] md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={20} /></button></div>
      <div className="mb-5 rounded-xl border border-[#d9efe4] bg-[#eaf8f1] p-3.5">
        <div className="mb-1 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#18855b]">Workspace</span><Zap size={14} className="text-[#18B978]" /></div>
        <div className="text-sm font-bold text-[#18392a]">{role === 'consumer' ? 'Consumer view' : 'Officer console'}</div>
        <div className="mt-1 text-xs leading-relaxed text-[#60786b]">{role === 'consumer' ? 'Understand what is on your shelf.' : 'Review, verify, and act on reports.'}</div>
      </div>
      <nav className="space-y-1">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#93a19a]">Navigate</p>
        {nav.map(item => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive(item.href) ? 'bg-[#dff5e9] text-[#08784e]' : 'text-[#64736b] hover:bg-[#eef4ef] hover:text-[#243b2f]'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={17} strokeWidth={isActive(item.href) ? 2.5 : 2} /><span>{item.label}</span>{item.label === 'Enforcement queue' && <span className="ml-auto rounded-full bg-[#f1ba55] px-1.5 py-0.5 text-[10px] text-white">3</span>}</Link>)}
      </nav>
      <div className="mt-auto space-y-1">
        <Link href={role === 'consumer' ? '/profile' : '/inspector/dashboard'} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#64736b] hover:bg-[#eef4ef]" data-testid="link-profile"><UserRound size={17} />{role === 'consumer' ? 'My profile' : 'Officer profile'}</Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#64736b] hover:bg-[#eef4ef]" data-testid="link-settings"><Settings size={17} />Settings</Link>
        <div className="my-3 h-px bg-[#e6ece7]" />
        <button onClick={() => { const next = role === 'consumer' ? 'officer' : 'consumer'; setRole(next); setLocation(next === 'consumer' ? '/dashboard' : '/inspector/dashboard'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#64736b] hover:bg-[#eef4ef]" data-testid="button-switch-role"><Users size={17} />Switch to {role === 'consumer' ? 'officer' : 'consumer'} view</button>
         <button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#64736b] hover:bg-[#eef4ef]" data-testid="button-logout"><LogOut size={17} />Sign out</button>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#173a2a]/20 md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay-menu" />}
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#e3eae5] bg-[#f7f8f6]/90 px-5 backdrop-blur-md md:px-10">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-[#52665b] hover:bg-white md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={20} /></button><div className="text-xs font-medium text-[#87958d]">{role === 'consumer' ? 'Personal workspace' : 'Regulatory workspace'} <span className="mx-1.5 text-[#cad2cd]">/</span><span className="text-[#3d5146]">{location === '/dashboard' || location === '/inspector/dashboard' ? 'Overview' : 'LegalAkshi'}</span></div></div>
         <div className="flex items-center gap-4"><button className="relative rounded-lg p-2 text-[#607069] hover:bg-white" data-testid="button-notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#f1ba55]" /></button><div className="hidden h-6 w-px bg-[#dfe7e1] sm:block" /><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#d9f2e5] text-xs font-bold text-[#12885c]">{initials}</span><span className="hidden text-sm font-semibold text-[#283d32] sm:block">{displayName}</span></div></div>
      </header>
      <div className="mx-auto max-w-[1380px] px-5 py-7 md:px-10 md:py-9">{children}</div>
    </main>
  </div>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#18a86f]">{eyebrow}</p>}<h1 className="text-[28px] font-extrabold tracking-[-.045em] text-[#17191C] md:text-[34px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#68766f]">{description}</p>}</div>{action}</div>;
}

function ProductVisual({ kind, large = false }: { kind: string; large?: boolean }) {
  return <div className={`relative overflow-hidden rounded-xl ${large ? 'h-64' : 'h-28'} ${kind === 'oats' ? 'bg-[#f2d471]' : 'bg-[#e9c99b]'}`}>
    <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 25%, white 0 3%, transparent 4%), radial-gradient(circle at 80% 70%, white 0 2%, transparent 3%)', backgroundSize: '28px 28px' }} />
    <div className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-sm bg-[#fbfaf2] text-center shadow-md ${large ? 'h-44 w-32' : 'h-20 w-16'}`}><Leaf className="mb-1 text-[#1a9b68]" size={large ? 25 : 14} /><span className={`${large ? 'text-sm' : 'text-[7px]'} font-extrabold leading-none text-[#3d493d]`}>{kind === 'oats' ? 'SAFFOLA' : 'AASHIRVAAD'}</span><span className={`${large ? 'text-[9px]' : 'text-[5px]'} mt-1 text-[#6b786f]`}>{kind === 'oats' ? 'MASALA OATS' : 'SELECT ATTA'}</span><div className="mt-2 h-1 w-8 rounded-full bg-[#18B978]" /></div>
  </div>;
}

function escapeReportValue(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

function downloadComplianceReport(product: Product) {
  const declarations = product.declarations.map(item => `
    <tr>
      <td>${escapeReportValue(item.label)}</td>
      <td><strong>${item.status === 'pass' ? 'Compliant' : item.status === 'review' ? 'Needs review' : 'Violation'}</strong></td>
      <td>${escapeReportValue(item.evidence)}</td>
      <td>${escapeReportValue(item.ruleRef)}</td>
    </tr>`).join('');
  const violations = product.violations.length === 0
    ? '<p class="muted">No issues found in the checks performed.</p>'
    : `<ul>${product.violations.map(item => `<li><strong>${escapeReportValue(item.issue)}</strong><br /><span>${escapeReportValue(item.evidence)}</span><br /><small>${escapeReportValue(item.clause)} · ${escapeReportValue(item.requirement)}</small></li>`).join('')}</ul>`;
  const nutrition = product.nutrition.map(item => `<div class="nutrition"><span>${escapeReportValue(item.label)}</span><strong>${escapeReportValue(item.value)}</strong><small>per 100 g</small></div>`).join('');
  const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LegalAkshi report · ${escapeReportValue(product.name)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Arial, sans-serif; color: #20382b; background: #f7f8f6; }
    body { margin: 0; padding: 40px 24px; }
    main { max-width: 900px; margin: auto; background: #fff; padding: 42px; border: 1px solid #dfe9e2; border-radius: 18px; }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #eaf1eb; padding-bottom: 22px; }
    h1, h2, p { margin-top: 0; } h1 { margin-bottom: 8px; font-size: 30px; letter-spacing: -.04em; } h2 { margin-top: 30px; font-size: 17px; }
    .brand { color: #18b978; font-weight: 800; font-size: 20px; } .meta, .muted, small { color: #718078; }
    .score { min-width: 120px; text-align: right; color: #a27812; font-size: 34px; font-weight: 800; } .score small { display: block; font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; } th, td { text-align: left; vertical-align: top; padding: 12px 10px; border-bottom: 1px solid #e8eee9; } th { color: #718078; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    li { margin: 0 0 14px; line-height: 1.5; } li span { color: #586a5f; } li small { display: inline-block; margin-top: 4px; }
    .nutrition-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; } .nutrition { border: 1px solid #e2eae4; border-radius: 10px; padding: 14px; } .nutrition span, .nutrition small { display: block; color: #718078; font-size: 12px; } .nutrition strong { display: block; margin: 8px 0 4px; font-size: 20px; }
    footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid #e8eee9; color: #87958c; font-size: 11px; }
    @media (max-width: 650px) { body { padding: 12px; } main { padding: 22px; } header { display: block; } .score { margin-top: 18px; text-align: left; } .nutrition-grid { grid-template-columns: repeat(2, 1fr); } table { display: block; overflow-x: auto; white-space: nowrap; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div><div class="brand">LegalAkshi</div><p class="meta">Compliance report · ${escapeReportValue(product.category)}</p><h1>${escapeReportValue(product.name)}</h1><p class="meta">${escapeReportValue(product.manufacturer)} · Checked ${escapeReportValue(product.scannedAt)}</p></div>
      <div class="score">${product.score}<small>out of 100</small></div>
    </header>
    <h2>Summary</h2>
    <p>${product.status === 'pass' ? 'This label meets the checks performed.' : 'This label is mostly compliant, with findings that deserve attention.'}</p>
    <h2>Findings</h2>
    ${violations}
    <h2>Declarations checked</h2>
    <table><thead><tr><th>Declaration</th><th>Status</th><th>Evidence</th><th>Rule reference</th></tr></thead><tbody>${declarations}</tbody></table>
    <h2>Nutrition</h2>
    <div class="nutrition-grid">${nutrition}</div>
    <footer>Generated by LegalAkshi on ${escapeReportValue(generatedAt)}. This report provides evidence and guidance; final findings are made by the relevant authority.</footer>
  </main>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `legalakshi-report-${product.id}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ProductCard({ product }: { product: Product }) {
  const [, setLocation] = useLocation();
  return <button onClick={() => setLocation(`/analysis/${product.id}`)} className="group w-full rounded-xl border border-[#e2eae4] bg-white p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-[#b9e6d0] hover:shadow-md" data-testid={`card-product-${product.id}`}><ProductVisual kind={product.image} /><div className="px-1 pt-3"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-[#20382b]">{product.name}</h3><p className="mt-1 text-xs text-[#819087]">{product.manufacturer}</p></div><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] text-xs font-extrabold ${product.status === 'pass' ? 'border-[#8bd8b4] text-[#12885c]' : 'border-[#f1cf71] text-[#a27812]'}`}>{product.score}</div></div><div className="mt-3 flex items-center justify-between"><StatusBadge status={product.status} /><span className="text-[11px] text-[#99a49e]">{product.scannedAt}</span></div></div></button>;
}

function useCurrentUserName(fallback: string) {
  const { user } = useUser();
  return user?.firstName || user?.fullName || fallback;
}

function ConsumerDashboard() {
  const name = useCurrentUserName('there');
  return <><PageTitle eyebrow={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} title={`${getGreeting()}, ${name}.`} description="Your shelf, decoded. See what changed, what matters, and what you can do next." action={<Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#18B978] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(24,185,120,.18)] hover:bg-[#119e67]" data-testid="link-scan-label"><ScanLine size={17} />Scan a new label</Link>} />
    <div className="mb-8 grid gap-4 sm:grid-cols-3"><Stat label="Labels checked" value="12" note="+3 this month" icon={ScanLine} tone="green" /><Stat label="Average score" value="87.4" note="Across your scans" icon={BarChart3} tone="yellow" /><Stat label="Complaints filed" value="1" note="1 under review" icon={ClipboardCheck} tone="blue" /></div>
    <section className="mb-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="relative overflow-hidden rounded-2xl bg-[#173a2a] p-7 text-white md:p-9"><div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border-[34px] border-[#18B978]/20" /><div className="absolute -bottom-24 right-20 h-64 w-64 rounded-full border-[20px] border-[#f3c969]/15" /><div className="relative max-w-lg"><Badge tone="green"><Sparkles size={12} />A clearer way to shop</Badge><h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em] md:text-[30px]">One scan. The full story.</h2><p className="mt-3 text-sm leading-relaxed text-[#c3ddd0]">Turn small print into plain language. We check every declaration against the rules that protect you.</p><Link href="/upload" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#f3ca68] px-4 py-2.5 text-sm font-bold text-[#324023] transition hover:bg-[#f8d986]" data-testid="link-start-scan">Start with a label <ArrowRight size={16} /></Link></div></div><div className="rounded-2xl border border-[#e1eae4] bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="font-bold text-[#20382b]">Your checking rhythm</h2><span className="text-xs text-[#839188]">Last 30 days</span></div><div className="mt-7 flex h-24 items-end gap-2">{[34,48,41,60,52,76,63,82,70,90,76,96].map((height, i) => <div key={i} className="group flex flex-1 flex-col items-center gap-1"><div className={`w-full rounded-t-sm ${i === 11 ? 'bg-[#18B978]' : 'bg-[#d6f0e2]'} transition-all group-hover:bg-[#a9e2c5]`} style={{ height: `${height}%` }} /><span className="text-[9px] text-[#a0aaa4]">{['M','T','W','T','F','S','S','M','T','W','T','F'][i]}</span></div>)}</div><div className="mt-5 flex items-center gap-2 text-xs text-[#68766f]"><span className="h-2 w-2 rounded-full bg-[#18B978]" /> Most active on grocery days</div></div></section>
    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold tracking-[-.03em] text-[#20382b]">Recently checked</h2><p className="mt-1 text-xs text-[#7c8a82]">Your last two label checks</p></div><Link href="/reports" className="flex items-center gap-1 text-xs font-bold text-[#138d60] hover:text-[#0c6f4b]" data-testid="link-view-reports">View all <ChevronRight size={14} /></Link></div><div className="grid gap-4 md:grid-cols-2">{products.map(product => <ProductCard key={product.id} product={product} />)}</div></section>
  </>;
}

function Stat({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof ScanLine; tone: string }) {
  return <div className="flex items-center justify-between rounded-xl border border-[#e1eae4] bg-white p-5 shadow-soft"><div><p className="text-xs font-semibold text-[#7b8981]">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-[-.05em] text-[#20382b]">{value}</p><p className={`mt-1 text-[11px] font-semibold ${tone === 'yellow' ? 'text-[#a27812]' : tone === 'blue' ? 'text-[#507b8c]' : 'text-[#138d60]'}`}>{note}</p></div><span className={`grid h-10 w-10 place-items-center rounded-lg ${tone === 'yellow' ? 'bg-[#fff5d8] text-[#b38417]' : tone === 'blue' ? 'bg-[#e5f1f4] text-[#507b8c]' : 'bg-[#e0f7eb] text-[#138d60]'}`}><Icon size={19} /></span></div>;
}

function Landing() {
  return <div className="min-h-[100dvh] overflow-hidden bg-[#F7F8F6] text-[#17191C]"><header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><Logo /><div className="hidden items-center gap-8 text-sm font-semibold text-[#617169] md:flex"><a href="#how" className="hover:text-[#18B978]">How it works</a><a href="#officers" className="hover:text-[#18B978]">For officers</a><a href="#trust" className="hover:text-[#18B978]">Our checks</a></div><div className="flex items-center gap-2"><Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#547064] hover:bg-white" data-testid="link-landing-login">Log in</Link><Link href="/signup" className="rounded-lg bg-[#18B978] px-4 py-2.5 text-sm font-bold text-white shadow-[0_5px_12px_rgba(24,185,120,.2)] hover:bg-[#119e67]" data-testid="link-landing-signup">Get started</Link></div></header><main>
    <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 md:grid-cols-[1.03fr_.97fr] md:pb-28 md:pt-20"><div className="absolute left-[-120px] top-16 h-72 w-72 rounded-full bg-[#d8f3e4] blur-3xl" /><div className="relative"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c8ead8] bg-[#eaf8f1] px-3 py-1.5 text-xs font-bold text-[#11875a]"><span className="h-1.5 w-1.5 rounded-full bg-[#18B978]" />Built for the Indian shelf</div><h1 className="max-w-xl text-[46px] font-extrabold leading-[1.04] tracking-[-.065em] text-[#173a2a] md:text-[68px]">Read the label.<br /><span className="text-[#18B978]">Know your rights.</span></h1><p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[#63756b]">LegalAkshi turns the fine print on packaged food into a clear answer — checked against FSSAI and Legal Metrology rules.</p><div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-[#18B978] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(24,185,120,.2)] hover:bg-[#119e67]" data-testid="link-hero-start">Check a label <ArrowRight size={17} /></Link><Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-[#d9e6dd] bg-white px-5 py-3 text-sm font-bold text-[#2e5140] hover:border-[#18B978]" data-testid="link-hero-demo"><QrCode size={16} />See a sample report</Link></div><div className="mt-9 flex items-center gap-5 text-xs text-[#839289]"><span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#18B978]" />Free to start</span><span className="flex items-center gap-1.5"><LockKeyhole size={14} className="text-[#18B978]" />Private by design</span></div></div><div className="relative mx-auto w-full max-w-[470px]"><div className="absolute -inset-5 rounded-[28px] bg-[#e4f5eb] rotate-3" /><div className="relative rounded-2xl border border-[#dceae1] bg-white p-4 shadow-lift"><div className="mb-4 flex items-center justify-between border-b border-[#edf1ee] pb-3"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#dff5e9] text-[#18B978]"><ScanLine size={15} /></span><span className="text-xs font-bold text-[#315542]">Label check</span></div><span className="font-mono text-[10px] text-[#9aa69f]">LA / 00082</span></div><ProductVisual kind="atta" large /><div className="mt-4 flex items-center justify-between"><div><p className="text-sm font-bold text-[#20382b]">Aashirvaad Select Atta</p><p className="mt-1 text-xs text-[#829088]">Staples · scanned just now</p></div><div className="grid h-14 w-14 place-items-center rounded-full border-4 border-[#f1cf71] text-lg font-extrabold text-[#a27812]">82</div></div><div className="mt-4 rounded-xl bg-[#fff7df] p-3.5"><div className="flex items-center gap-2 text-xs font-bold text-[#946b09]"><Info size={15} />One thing needs your eye</div><p className="mt-1.5 text-xs leading-relaxed text-[#7b6a3a]">Net quantity is present, but appears on the side seam instead of the principal panel.</p></div><div className="mt-3 flex items-center justify-between border-t border-[#edf1ee] pt-3 text-[11px] font-semibold text-[#138d60]"><span>4 declarations checked</span><span className="flex items-center gap-1">Open report <ArrowRight size={13} /></span></div></div></div></section>
<section id="how" className="border-y border-[#e2ebe5] bg-white"><div className="mx-auto max-w-6xl px-6 py-20"><div className="max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#18a86f]">A second pair of eyes</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-[#173a2a] md:text-4xl">Less guessing in the aisle.</h2><p className="mt-3 text-sm leading-relaxed text-[#68786e]">Three calm steps from a package in your hand to an answer you can trust.</p></div><div className="mt-12 grid gap-8 md:grid-cols-3">{[['01','Capture','Point your camera at the front and back of any packaged food label.'],['02','Understand','We read the text and check declarations against the current rules.'],['03','Act','Get a plain-language report, then raise a complaint when something is off.']].map(([num,title,copy]) => <div key={num} className="border-t-2 border-[#bce9d2] pt-5"><span className="font-mono text-xs text-[#18B978]">{num}</span><h3 className="mt-5 text-xl font-bold text-[#20382b]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#718078]">{copy}</p></div>)}</div></div></section>
    <section id="officers" className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[.8fr_1.2fr]"><div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#18a86f]">For the people who enforce</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-[#173a2a] md:text-4xl">From evidence to action, without the paper trail.</h2><p className="mt-4 text-sm leading-relaxed text-[#68786e]">Regulatory teams get a focused queue of verified complaints, rule-level evidence, and an audit trail built for the next step.</p><Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#12885c]" data-testid="link-officer-login">Explore officer workspace <ArrowRight size={16} /></Link></div><div className="rounded-2xl border border-[#dce9e0] bg-white p-5 shadow-soft"><div className="flex items-center justify-between border-b border-[#edf1ee] pb-4"><div className="flex items-center gap-2 text-sm font-bold text-[#20382b]"><ClipboardCheck size={17} className="text-[#18B978]" />Enforcement queue</div><Badge tone="yellow">3 awaiting review</Badge></div>{['Missing FSSAI licence number','Net quantity on side panel','Misleading “natural” claim'].map((item, i) => <div key={item} className="flex items-center justify-between border-b border-[#f0f3f0] py-4 last:border-0"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${i === 0 ? 'bg-[#fce6e4] text-[#b43b37]' : 'bg-[#fff4d4] text-[#a27812]'}`}><CircleAlert size={15} /></span><div><p className="text-sm font-semibold text-[#30473a]">{item}</p><p className="mt-1 text-[11px] text-[#92a098]">{['Bengaluru · 2 hours ago','Pune · Yesterday','Delhi · 2 days ago'][i]}</p></div></div><ChevronRight size={16} className="text-[#adb8b0]" /></div>)}</div></section>
    <section id="trust" className="bg-[#173a2a] px-6 py-16 text-white"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#7fddb0]">The fine print matters</p><h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-[-.05em] md:text-4xl">Clear enough to use.<br />Serious enough to trust.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#b8d3c5]">No verdicts hidden behind jargon. Every finding shows the evidence, the requirement, and the rule reference.</p></div></section>
  </main><footer className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 py-8 text-xs text-[#8b9991] sm:flex-row"><Logo compact /><span>© 2024 LegalAkshi · Made for clearer shelves</span></footer></div>;
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const [role, setRole] = useState<'consumer' | 'officer'>(() => getStored('role', 'consumer'));
  const authRole = (next: 'consumer' | 'officer') => {
    setRole(next);
    setStored('role', next);
  };
  return <div className="grid min-h-[100dvh] bg-[#F7F8F6] md:grid-cols-[.86fr_1.14fr]">
    <div className="relative hidden overflow-hidden bg-[#173a2a] p-12 text-white md:block">
      <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full border-[30px] border-[#18B978]/20" />
      <div className="absolute right-[-80px] top-[-70px] h-72 w-72 rounded-full border-[28px] border-[#f3ca68]/15" />
      <Logo />
      <div className="relative mt-32 max-w-md">
        <span className="font-mono text-xs text-[#84dcb1]">LEGALAKSHI / PRIVATE WORKSPACE</span>
        <h1 className="mt-6 text-5xl font-extrabold leading-[1.06] tracking-[-.06em]">The label<br />shouldn't be<br /><span className="text-[#72dfaa]">a puzzle.</span></h1>
        <p className="mt-7 max-w-sm text-sm leading-relaxed text-[#b8d3c5]">A clear-eyed companion for every packaged-food decision — and a sharper workspace for the people who keep the rules moving.</p>
      </div>
      <div className="absolute bottom-10 left-12 flex items-center gap-2 text-xs text-[#9cbbae]"><LockKeyhole size={14} className="text-[#72dfaa]" />Your scans stay private</div>
    </div>
    <div className="flex items-center justify-center overflow-y-auto p-6 md:p-12">
      <div className="w-full max-w-[470px]">
        <div className="mb-8 inline-flex md:hidden" data-testid="link-auth-logo"><Logo /></div>
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#18a86f]">{mode === 'login' ? 'Welcome back' : 'Start with clarity'}</p>
          <h2 className="text-3xl font-extrabold tracking-[-.05em] text-[#173a2a]">{mode === 'login' ? 'Good to see you.' : 'Create your account.'}</h2>
          <p className="mt-2 text-sm text-[#75837b]">{mode === 'login' ? 'Pick up where you left off.' : 'A better way to read what you buy.'}</p>
        </div>
        <div className="mb-5 grid grid-cols-2 rounded-lg border border-[#dce7df] bg-white p-1">
          <button onClick={() => authRole('consumer')} className={`rounded-md py-2.5 text-xs font-bold ${role === 'consumer' ? 'bg-[#dff5e9] text-[#12885c]' : 'text-[#85928a]'}`} data-testid="button-role-consumer"><UserRound size={14} className="mr-1 inline" />Consumer</button>
          <button onClick={() => authRole('officer')} className={`rounded-md py-2.5 text-xs font-bold ${role === 'officer' ? 'bg-[#dff5e9] text-[#12885c]' : 'text-[#85928a]'}`} data-testid="button-role-officer"><ShieldCheck size={14} className="mr-1 inline" />Regulatory officer</button>
        </div>
        <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-soft md:p-6">
          {mode === 'login'
            ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
            : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}
        </div>
      </div>
    </div>
  </div>;
}

function Field({ label, placeholder, type = 'text', testId, value, onChange }: { label: string; placeholder?: string; type?: string; testId: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#3d5145]">{label}</span><input required type={type} placeholder={placeholder} value={value} onChange={onChange} className="focus-ring w-full rounded-lg border border-[#dbe6de] bg-white px-3.5 py-3 text-sm text-[#20382b] outline-none transition focus:border-[#18B978]" data-testid={testId} /></label>;
}

function PhotoSlot({ title, description, photo, onChange, onRemove, testId }: { title: string; description: string; photo: ScanPhoto | null; onChange: (file: File) => void; onRemove: () => void; testId: string }) {
  return <div className="rounded-2xl border border-[#e0e9e3] bg-white p-4 shadow-soft">
    <div className="mb-3 flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#20382b]">{title}</p><p className="mt-1 text-xs leading-relaxed text-[#829088]">{description}</p></div>{photo && <CheckCircle2 size={18} className="shrink-0 text-[#18B978]" />}</div>
    <label className="group relative flex h-52 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#b9e6d0] bg-[#eef9f2] text-center transition hover:border-[#18B978] hover:bg-[#e7f7ee]">
      {photo ? <img src={photo.url} alt={`${title} preview`} className="h-full w-full object-cover" /> : <div><span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#18B978] shadow-soft"><UploadCloud size={25} /></span><span className="block text-xs font-bold text-[#214333]">Choose photo</span><span className="mt-1 block text-[11px] text-[#718179]">JPG or PNG · up to 10 MB</span></div>}
      <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) onChange(file); event.currentTarget.value = ''; }} data-testid={testId} />
    </label>
    {photo && <div className="mt-3 flex items-center justify-between gap-3"><span className="truncate text-[11px] text-[#718179]">{photo.name}</span><button type="button" onClick={onRemove} className="shrink-0 text-xs font-bold text-[#b43b37] hover:underline">Remove</button></div>}
  </div>;
}

function UploadPage() {
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<{ front: ScanPhoto | null; back: ScanPhoto | null }>({ front: currentScanPhotos.front, back: currentScanPhotos.back });
  const setPhoto = (side: 'front' | 'back', file: File) => {
    const nextPhoto = { name: file.name, url: URL.createObjectURL(file) };
    const previous = photos[side];
    if (previous) URL.revokeObjectURL(previous.url);
    const next = { ...photos, [side]: nextPhoto };
    setPhotos(next);
    currentScanPhotos[side] = nextPhoto;
  };
  const removePhoto = (side: 'front' | 'back') => {
    const previous = photos[side];
    if (previous) URL.revokeObjectURL(previous.url);
    const next = { ...photos, [side]: null };
    setPhotos(next);
    currentScanPhotos[side] = null;
  };
  const handleUpload = () => { if (!photos.front || !photos.back) return; setUploading(true); setTimeout(() => setLocation('/extraction'), 900); };
  const handleSample = () => {
    if (currentScanPhotos.front) URL.revokeObjectURL(currentScanPhotos.front.url);
    if (currentScanPhotos.back) URL.revokeObjectURL(currentScanPhotos.back.url);
    currentScanPhotos.front = null;
    currentScanPhotos.back = null;
    setPhotos({ front: null, back: null });
    setUploading(true);
    setTimeout(() => setLocation('/extraction'), 600);
  };
  return <><PageTitle eyebrow="Label scanner" title="Bring both sides closer." description="Add one clear photo of the front and one of the back. We’ll read both sides, then you can review every field before analysis." /><div className="mx-auto max-w-4xl">
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#cfeedd] bg-[#eaf8f1] p-4 text-xs leading-relaxed text-[#4c7761]"><ScanLine size={17} className="mt-0.5 shrink-0 text-[#18B978]" /><span><b className="text-[#276047]">Two photos make the check stronger.</b> The front shows the product identity; the back usually carries the declarations, licence, quantity, and nutrition details.</span></div>
    <div className="grid gap-5 md:grid-cols-2"><PhotoSlot title="Front of the product" description="Brand, product name, claims, and principal display panel." photo={photos.front} onChange={file => setPhoto('front', file)} onRemove={() => removePhoto('front')} testId="input-label-photo-front" /><PhotoSlot title="Back of the product" description="Ingredients, nutrition, licence, dates, quantity, and manufacturer details." photo={photos.back} onChange={file => setPhoto('back', file)} onRemove={() => removePhoto('back')} testId="input-label-photo-back" /></div>
    <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#e4ece6] pt-5 sm:flex-row sm:items-center"><Button variant="secondary" onClick={handleSample} disabled={uploading} data-testid="button-use-sample">{uploading ? 'Preparing sample…' : 'Use sample label'} <ArrowRight size={15} /></Button><Button onClick={handleUpload} disabled={uploading || !photos.front || !photos.back} data-testid="button-start-scan">{uploading ? 'Preparing scan…' : 'Analyze both photos'} <ArrowRight size={16} /></Button></div>
    <p className="mt-3 text-right text-[11px] text-[#8b9890]">{photos.front && photos.back ? 'Both label sides are ready for OCR review.' : 'Add both photos to continue, or use the sample label.'}</p>
  </div></>;
}

function ExtractionPage() {
  const [, setLocation] = useLocation();
  const product = products[0];
  const [fields, setFields] = useState(product.extractedFields);
  const update = (key: string, value: string) => setFields(old => old.map(field => field.key === key ? { ...field, value } : field));
  const photoEntries = [{ key: 'front', label: 'Front of product', photo: currentScanPhotos.front }, { key: 'back', label: 'Back of product', photo: currentScanPhotos.back }];
  return <><PageTitle eyebrow="Step 2 of 3 · OCR review" title="Make it accurate." description="We found these details across both label photos. Correct anything that looks off — your changes become the source of truth for the report." action={<span className="font-mono text-xs text-[#849188]">SCAN / LA-00082</span>} /><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-soft"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{photoEntries.map(entry => <div key={entry.key} className="overflow-hidden rounded-xl border border-[#e3ece5] bg-[#fbfcfb]"><div className="flex h-44 items-center justify-center">{entry.photo ? <img src={entry.photo.url} alt={`${entry.label} preview`} className="h-full w-full object-cover" /> : <ProductVisual kind="atta" large />}</div><div className="flex items-center gap-2 border-t border-[#e3ece5] px-3 py-2 text-xs font-semibold text-[#607269]"><ScanLine size={14} className="text-[#18B978]" />{entry.label}</div></div>)}</div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#dce7df] py-2.5 text-xs font-bold text-[#426050] hover:border-[#18B978]" onClick={() => setLocation('/upload')} data-testid="button-replace-photo"><UploadCloud size={15} />Replace label photos</button></div><div className="rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-soft"><div className="flex items-center justify-between border-b border-[#edf1ee] pb-4"><div><h2 className="font-bold text-[#20382b]">Extracted fields</h2><p className="mt-1 text-xs text-[#849188]">Review the text we picked up</p></div><Badge tone="green"><Check size={12} />OCR complete</Badge></div><div className="mt-5 space-y-4">{fields.map(field => <div key={field.key}><div className="mb-1.5 flex items-center justify-between"><label className="text-xs font-bold text-[#42554a]">{field.label}</label><span className={`font-mono text-[10px] ${field.confidence > .9 ? 'text-[#18a86f]' : 'text-[#a27812]'}`}>{Math.round(field.confidence * 100)}% match</span></div><div className="relative"><input value={field.value} onChange={e => update(field.key, e.target.value)} className="focus-ring w-full rounded-lg border border-[#dce7df] bg-[#fbfcfb] px-3 py-2.5 pr-10 text-sm text-[#20382b] outline-none focus:border-[#18B978]" data-testid={`input-extracted-${field.key}`} /><Pencil size={14} className="pointer-events-none absolute right-3 top-3 text-[#a0ada5]" /></div></div>)}</div><div className="mt-6 flex items-center justify-between border-t border-[#edf1ee] pt-5"><span className="text-xs text-[#7c8a82]">You can edit this later</span><Button onClick={() => { setStored('lastExtraction', fields); setLocation(`/analysis/${product.id}`); }} data-testid="button-run-analysis">Check compliance <ArrowRight size={16} /></Button></div></div></div></>;
}

function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const product = products.find(p => p.id === params.id) ?? products[0];
  const [tab, setTab] = useState<'summary' | 'declarations' | 'nutrition'>('summary');
  const [expanded, setExpanded] = useState<string | null>(null);
  const tone = product.status === 'pass' ? 'green' : 'yellow';
  return <><PageTitle eyebrow="Compliance report · 18 June 2024" title={product.name} description={`${product.manufacturer} · ${product.category}`} action={<Button variant="secondary" onClick={() => downloadComplianceReport(product)} data-testid="button-download-report"><Download size={16} />Download report</Button>} /><div className="mb-6 grid gap-5 lg:grid-cols-[.72fr_1.28fr]"><div className={`rounded-2xl p-7 ${product.status === 'pass' ? 'bg-[#e7f8ee]' : 'bg-[#fff5d9]'}`}><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6a7f72]">Overall compliance</p><div className={`mt-4 text-6xl font-extrabold tracking-[-.07em] ${product.status === 'pass' ? 'text-[#0d8556]' : 'text-[#a27812]'}`}>{product.score}<span className="text-2xl text-current/50">/100</span></div></div><div className={`grid h-16 w-16 place-items-center rounded-full ${product.status === 'pass' ? 'bg-[#b9e9cf] text-[#0c8556]' : 'bg-[#f8dc89] text-[#9b7314]'}`}><BadgeCheck size={31} /></div></div><div className="mt-7 h-2 overflow-hidden rounded-full bg-white/70"><div className={`h-full rounded-full ${product.status === 'pass' ? 'bg-[#18B978]' : 'bg-[#e3b73f]'}`} style={{ width: `${product.score}%` }} /></div><p className={`mt-4 text-sm font-semibold ${product.status === 'pass' ? 'text-[#176d4b]' : 'text-[#7d652c]'}`}>{product.status === 'pass' ? 'This label meets the checks we ran.' : 'Mostly compliant, with a couple of things worth knowing.'}</p></div><div className="rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-soft"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#87958c]">What this means</p><h2 className="mt-3 text-lg font-extrabold tracking-[-.03em] text-[#20382b]">{product.status === 'pass' ? 'A clean label, at a glance.' : 'One finding needs your eye.'}</h2></div><span className="text-[#18B978]"><Sparkles size={20} /></span></div><p className="mt-3 text-sm leading-relaxed text-[#697970]">{product.status === 'pass' ? 'The key declarations we checked are present and legible. Keep this report with your purchase record.' : 'We found a placement issue that may make an important piece of information harder to see. It is not a food safety verdict.'}</p><div className="mt-5 flex gap-2">{product.violations.map(v => <Badge key={v.id} tone={v.severity === 'High' ? 'red' : 'yellow'}>{v.severity} priority</Badge>)}</div></div></div><div className="mb-5 flex gap-1 border-b border-[#dde7df]"><button onClick={() => setTab('summary')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab === 'summary' ? 'border-[#18B978] text-[#12885c]' : 'border-transparent text-[#87938c]'}`} data-testid="button-tab-summary">Findings {product.violations.length > 0 && <span className="ml-1 rounded-full bg-[#fff0c1] px-1.5 py-0.5 text-[10px] text-[#946b09]">{product.violations.length}</span>}</button><button onClick={() => setTab('declarations')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab === 'declarations' ? 'border-[#18B978] text-[#12885c]' : 'border-transparent text-[#87938c]'}`} data-testid="button-tab-declarations">Declarations</button><button onClick={() => setTab('nutrition')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab === 'nutrition' ? 'border-[#18B978] text-[#12885c]' : 'border-transparent text-[#87938c]'}`} data-testid="button-tab-nutrition">Nutrition</button></div>{tab === 'summary' && <div className="space-y-3">{product.violations.length === 0 ? <EmptyState icon={CheckCircle2} title="No issues found" text="All declarations in this check passed." /> : product.violations.map(v => <div key={v.id} className="rounded-xl border border-[#e2eae4] bg-white shadow-soft"><button onClick={() => setExpanded(expanded === v.id ? null : v.id)} className="flex w-full items-center gap-4 p-5 text-left" data-testid={`button-expand-violation-${v.id}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${v.severity === 'High' ? 'bg-[#fce6e4] text-[#b43b37]' : 'bg-[#fff4d4] text-[#a27812]'}`}><CircleAlert size={19} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#20382b]">{v.issue}</span><span className="mt-1 block text-xs text-[#849188]">{v.clause} · {v.severity} priority</span></span><ChevronRight size={17} className={`text-[#9ba8a0] transition-transform ${expanded === v.id ? 'rotate-90' : ''}`} /></button>{expanded === v.id && <div className="border-t border-[#edf1ee] bg-[#fbfcfb] px-5 pb-5 pt-4"><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#9aa69f]">Evidence found</p><p className="text-sm leading-relaxed text-[#4b5d52]">{v.evidence}</p></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#9aa69f]">Requirement</p><p className="text-sm leading-relaxed text-[#4b5d52]">{v.requirement}</p></div></div><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#a27812]"><BookOpen size={14} />{v.clause} · Typical penalty {v.penalty}</div></div>}</div>)}<div className="mt-5 flex items-center justify-between rounded-xl border border-[#bee8d1] bg-[#ebf9f1] p-5"><div><p className="text-sm font-bold text-[#1e513a]">Want to report this?</p><p className="mt-1 text-xs text-[#5d806e]">Turn the evidence above into a tracked complaint.</p></div><Button onClick={() => setLocation('/complaint/new')} data-testid="button-start-complaint">Start a complaint <ArrowRight size={15} /></Button></div></div>}{tab === 'declarations' && <div className="overflow-hidden rounded-xl border border-[#e2eae4] bg-white shadow-soft">{product.declarations.map(item => <div key={item.key} className="flex flex-col gap-3 border-b border-[#edf1ee] p-5 last:border-0 sm:flex-row sm:items-center"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.status === 'pass' ? 'bg-[#e4f7ec] text-[#138d60]' : 'bg-[#fff5d8] text-[#a27812]'}`}>{item.status === 'pass' ? <Check size={17} /> : <Info size={17} />}</span><div className="flex-1"><p className="text-sm font-bold text-[#30473a]">{item.label}</p><p className="mt-1 text-xs text-[#7d8a82]">{item.evidence}</p></div><div className="text-left sm:text-right"><StatusBadge status={item.status} /><p className="mt-1 font-mono text-[10px] text-[#9aa69f]">{item.ruleRef}</p></div></div>)}</div>}{tab === 'nutrition' && <div className="grid gap-4 sm:grid-cols-2">{product.nutrition.map(n => <div key={n.label} className="rounded-xl border border-[#e2eae4] bg-white p-5 shadow-soft"><p className="text-xs text-[#849188]">{n.label}</p><p className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-[#20382b]">{n.value}</p><p className="mt-1 text-[11px] text-[#a0aaa4]">per 100 g</p></div>)}</div>}</>;
}

function ComplaintNew() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [retailer, setRetailer] = useState('Reliance Smart, Koramangala');
  const [city, setCity] = useState('Bengaluru');
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const submit = () => { const tracking = `LA-24-${Math.floor(Math.random() * 9000 + 1000)}`; const next: Complaint = { ...initialComplaints[0], id: `comp-${Date.now()}`, trackingId: tracking, retailer, city, submittedAt: '18 Jun 2024', status: 'Submitted' }; const existing = getStored<Complaint[]>('complaints', initialComplaints); setStored('complaints', [next, ...existing]); setTrackingId(tracking); setSubmitted(true); };
  if (submitted) return <div className="mx-auto max-w-xl py-12 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dff5e9] text-[#12885c]"><CheckCircle2 size={31} /></span><p className="mt-6 text-[11px] font-bold uppercase tracking-[.17em] text-[#18a86f]">Complaint submitted</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-[#173a2a]">Your report is in motion.</h1><p className="mt-3 text-sm leading-relaxed text-[#718078]">We’ve saved your evidence and created a tracking number. You can follow the progress from your complaint history.</p><div className="mt-7 rounded-xl bg-white p-5 shadow-soft"><p className="text-xs text-[#86938c]">Tracking number</p><p className="mt-2 font-mono text-xl font-bold text-[#12885c]">{trackingId}</p></div><div className="mt-6 flex justify-center gap-3"><Button variant="secondary" onClick={() => setLocation('/complaints')} data-testid="button-view-complaints">View complaints</Button><Button onClick={() => setLocation('/dashboard')} data-testid="button-back-dashboard">Back to overview</Button></div></div>;
  return <><PageTitle eyebrow={`Complaint wizard · Step ${step} of 3`} title="Make the evidence count." description="A few details help the right team find this product and understand what happened." /><div className="mx-auto max-w-2xl"><div className="mb-8 flex items-center gap-2">{[1,2,3].map(n => <div key={n} className="flex flex-1 items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${step >= n ? 'bg-[#18B978] text-white' : 'bg-[#e6ede8] text-[#88958d]'}`}>{step > n ? <Check size={14} /> : n}</span><div className={`h-1 flex-1 rounded-full ${step > n ? 'bg-[#18B978]' : 'bg-[#e6ede8]'}`} /></div>)}</div><div className="rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-soft md:p-8">{step === 1 && <><h2 className="text-lg font-bold text-[#20382b]">Where did you find it?</h2><p className="mt-1 text-sm text-[#7c8a82]">This helps the department route your complaint.</p><div className="mt-6 space-y-4"><Field label="Retailer and location" value={retailer} onChange={e => setRetailer(e.target.value)} testId="input-retailer" /><Field label="City" value={city} onChange={e => setCity(e.target.value)} testId="input-city" /></div></>}{step === 2 && <><h2 className="text-lg font-bold text-[#20382b]">Review your evidence</h2><p className="mt-1 text-sm text-[#7c8a82]">We’ll attach the findings from your label check.</p><div className="mt-6 rounded-xl border border-[#e3ece5] bg-[#fbfcfb] p-4"><div className="flex items-center gap-3"><ProductVisual kind="atta" /><div><p className="text-sm font-bold text-[#20382b]">Aashirvaad Select Atta</p><p className="mt-1 text-xs text-[#87948d]">2 findings attached · 2 label photos</p></div></div><div className="mt-4 space-y-2">{['Net quantity is not in the principal display panel','Vegetarian symbol has low contrast'].map(v => <div key={v} className="flex items-center gap-2 text-xs text-[#586a5f]"><CheckCircle2 size={14} className="text-[#18B978]" />{v}</div>)}</div></div></>}{step === 3 && <><h2 className="text-lg font-bold text-[#20382b]">One last check</h2><p className="mt-1 text-sm text-[#7c8a82]">Review the details before sending your complaint.</p><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between border-b border-[#edf1ee] pb-3"><span className="text-[#87948d]">Product</span><b className="text-[#30473a]">Aashirvaad Select Atta</b></div><div className="flex justify-between border-b border-[#edf1ee] pb-3"><span className="text-[#87948d]">Where</span><b className="text-right text-[#30473a]">{retailer}, {city}</b></div><div className="flex justify-between border-b border-[#edf1ee] pb-3"><span className="text-[#87948d]">Priority</span><Badge tone="yellow">Medium</Badge></div></div><div className="mt-5 rounded-xl bg-[#fff8df] p-4 text-xs leading-relaxed text-[#78693a]"><Info size={14} className="mr-1 inline" />LegalAkshi provides evidence and routing. Final findings are made by the relevant authority.</div></>}{<div className="mt-8 flex justify-between border-t border-[#edf1ee] pt-5">{step > 1 ? <Button variant="ghost" onClick={() => setStep(step - 1)} data-testid="button-complaint-back"><ArrowLeft size={15} />Back</Button> : <span />}{step < 3 ? <Button onClick={() => setStep(step + 1)} data-testid={`button-complaint-next-${step}`}>Continue <ArrowRight size={15} /></Button> : <Button onClick={submit} data-testid="button-submit-complaint">Submit complaint <Check size={16} /></Button>}</div>}</div></div></>;
}

function ComplaintsPage() {
  const [complaints] = useState(() => getStored<Complaint[]>('complaints', initialComplaints));
  return <><PageTitle eyebrow="Your paper trail" title="My complaints" description="Stay in the loop on every report you’ve raised." action={<Link href="/complaint/new" className="inline-flex items-center gap-2 rounded-lg bg-[#18B978] px-4 py-2.5 text-sm font-semibold text-white" data-testid="link-new-complaint"><Plus size={17} />New complaint</Link>} />{complaints.length === 0 ? <EmptyState icon={ClipboardCheck} title="Nothing here yet" text="When you raise a complaint, its progress will appear here." /> : <div className="space-y-4">{complaints.map(c => <div key={c.id} className="rounded-xl border border-[#e2eae4] bg-white p-5 shadow-soft md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="font-mono text-[11px] text-[#18a86f]">{c.trackingId}</span><Badge tone={c.status === 'Action taken' ? 'green' : 'yellow'}>{c.status}</Badge></div><h2 className="mt-3 font-bold text-[#20382b]">{c.productName}</h2><p className="mt-1 text-xs text-[#7f8e85]">{c.retailer} · {c.city} · Submitted {c.submittedAt}</p></div><Badge tone="yellow">{c.severity} priority</Badge></div><div className="mt-6 flex flex-col gap-3 border-t border-[#edf1ee] pt-5 sm:flex-row sm:items-center">{c.timeline.map((t, i) => <div key={t.label} className="flex flex-1 items-center gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${t.done ? 'bg-[#dff5e9] text-[#12885c]' : 'bg-[#edf1ef] text-[#a2ada6]'}`}>{t.done ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><div><p className="text-[11px] font-bold text-[#4e6256]">{t.label}</p><p className="mt-0.5 text-[10px] text-[#9aa69f]">{t.date}</p></div>{i < c.timeline.length - 1 && <div className="hidden h-px flex-1 bg-[#dfe9e2] sm:block" />}</div>)}</div></div>)}</div>}</>;
}

function ReportsPage() {
  return <><PageTitle eyebrow="Your records" title="Reports" description="A quiet archive of every label you’ve checked." /><div className="mb-5 flex items-center gap-2 rounded-xl border border-[#dceadf] bg-[#eaf8f1] p-4 text-xs text-[#4c7761]"><FileCheck2 size={17} className="text-[#18B978]" /><span><b className="text-[#276047]">Reports are yours.</b> Open the full analysis or download a self-contained LegalAkshi report whenever you need it.</span></div><div className="overflow-hidden rounded-xl border border-[#e2eae4] bg-white shadow-soft"><div className="hidden grid-cols-[1fr_1fr_130px_110px_150px] gap-4 border-b border-[#edf1ee] bg-[#fbfcfb] px-5 py-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#94a098] md:grid"><span>Product</span><span>Checked</span><span>Score</span><span>Status</span><span>Actions</span></div>{products.map(p => <div key={p.id} className="grid gap-3 border-b border-[#edf1ee] px-5 py-4 last:border-0 md:grid-cols-[1fr_1fr_130px_110px_150px] md:items-center md:gap-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f1e0bc] text-[#8a6a28]"><Box size={16} /></span><div><p className="text-sm font-bold text-[#30473a]">{p.name}</p><p className="text-[11px] text-[#97a39b]">{p.category}</p></div></div><span className="text-xs text-[#75847b]">{p.scannedAt}</span><span className="font-mono text-sm font-bold text-[#30473a]">{p.score}/100</span><StatusBadge status={p.status} /><div className="flex items-center gap-3"><Link href={`/analysis/${p.id}`} className="text-xs font-bold text-[#12885c] hover:underline" data-testid={`link-report-${p.id}`}>Open</Link><button type="button" onClick={() => downloadComplianceReport(p)} className="inline-flex items-center gap-1 text-xs font-bold text-[#426050] hover:text-[#12885c]" data-testid={`button-download-report-${p.id}`}><Download size={14} />Download</button></div></div>)}</div></>;
}

function ProfilePage() {
  const { user } = useUser();
  const [name, setName] = useState(() => user?.fullName || user?.firstName || '');
  const [email, setEmail] = useState(() => user?.primaryEmailAddress?.emailAddress || '');
  const [city, setCity] = useState('Bengaluru');
  const [language, setLanguage] = useState('English');
  const [saved, setSaved] = useState(false);
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'NC';
  return <><PageTitle eyebrow="Account" title="Your profile" description="The details attached to your LegalAkshi workspace." action={saved ? <Badge tone="green"><Check size={12} />Saved</Badge> : undefined} /><div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]"><div className="rounded-2xl border border-[#dfe9e2] bg-[#173a2a] p-7 text-white"><span className="grid h-16 w-16 place-items-center rounded-full bg-[#d8f2e3] text-xl font-extrabold text-[#12885c]">{initials}</span><h2 className="mt-5 text-xl font-bold">{name || 'Your name'}</h2><p className="mt-1 text-sm text-[#a7c6b5]">Consumer account</p><div className="mt-8 border-t border-white/10 pt-5 text-xs text-[#a7c6b5]"><p>Member since</p><p className="mt-1 font-bold text-white">April 2024</p></div></div><div className="rounded-2xl border border-[#dfe9e2] bg-white p-6 shadow-soft"><h2 className="font-bold text-[#20382b]">Personal details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Full name" value={name} testId="input-profile-name" onChange={e => { setName(e.target.value); setSaved(false); }} /><Field label="Email address" value={email} testId="input-profile-email" onChange={e => { setEmail(e.target.value); setSaved(false); }} /><Field label="City" value={city} testId="input-profile-city" onChange={e => { setCity(e.target.value); setSaved(false); }} /><Field label="Preferred language" value={language} testId="input-profile-language" onChange={e => { setLanguage(e.target.value); setSaved(false); }} /></div><Button className="mt-6" onClick={() => setSaved(true)} data-testid="button-save-profile">Save changes <Check size={15} /></Button></div></div></>;
}

function SettingsPage() {
  const [privacy, setPrivacy] = useState(true);
  const [updates, setUpdates] = useState(true);
  return <><PageTitle eyebrow="Workspace preferences" title="Settings" description="Small choices that make LegalAkshi work better for you." /><div className="max-w-2xl space-y-5"><Setting title="Scan privacy" text="Keep uploaded label photos in your private workspace." on={privacy} setOn={setPrivacy} testId="switch-privacy" /><Setting title="Report updates" text="Get an email when a complaint changes status." on={updates} setOn={setUpdates} testId="switch-updates" /><div className="rounded-xl border border-[#e2eae4] bg-white p-6 shadow-soft"><div className="flex items-center gap-3"><LifeBuoy size={19} className="text-[#18B978]" /><div><h2 className="font-bold text-[#20382b]">Need a hand?</h2><p className="mt-1 text-xs text-[#7d8b83]">Read how LegalAkshi evaluates a label, or contact our support team.</p></div></div><div className="mt-5 flex gap-3"><Button variant="secondary" onClick={() => undefined} data-testid="button-read-help">Read the guide</Button><Button variant="ghost" onClick={() => undefined} data-testid="button-contact-support">Contact support</Button></div></div></div></>;
}
function Setting({ title, text, on, setOn, testId }: { title: string; text: string; on: boolean; setOn: (v: boolean) => void; testId: string }) { return <div className="flex items-center justify-between gap-5 rounded-xl border border-[#e2eae4] bg-white p-6 shadow-soft"><div><h2 className="font-bold text-[#30473a]">{title}</h2><p className="mt-1 text-xs leading-relaxed text-[#7d8b83]">{text}</p></div><button onClick={() => setOn(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-[#18B978]' : 'bg-[#cbd5cf]'}`} data-testid={testId}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'left-6' : 'left-1'}`} /></button></div>; }

function OfficerDashboard() {
  const complaints = getStored<Complaint[]>('complaints', initialComplaints);
  const name = useCurrentUserName('Officer');
  return <><PageTitle eyebrow="Regulatory workspace · 18 June 2024" title={`${getGreeting()}, ${name}.`} description="The queue is focused. Three reports need a clear next step." action={<Button variant="secondary" onClick={() => window.print()} data-testid="button-export-brief"><FileText size={16} />Export daily brief</Button>} /><div className="grid gap-4 sm:grid-cols-3"><Stat label="Awaiting review" value="03" note="2 high priority" icon={ClipboardCheck} tone="yellow" /><Stat label="Action taken" value="18" note="+4 this week" icon={CheckCircle2} tone="green" /><Stat label="Active rules" value="42" note="1 draft update" icon={BookOpen} tone="blue" /></div><section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-2xl border border-[#e1eae4] bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><div><h2 className="font-bold text-[#20382b]">Priority queue</h2><p className="mt-1 text-xs text-[#85938b]">Reports needing your attention</p></div><Link href="/inspector/complaints" className="text-xs font-bold text-[#12885c]" data-testid="link-officer-queue">View queue <ChevronRight size={13} className="inline" /></Link></div><div className="mt-5 space-y-1">{complaints.concat([{ id: 'comp-02', trackingId: 'LA-24-0617-209', productName: 'Nature’s Basket Granola', retailer: 'Modern Bazaar, Viman Nagar', city: 'Pune', submittedAt: '17 Jun 2024', severity: 'High', violations: ['Missing FSSAI licence number'], status: 'Submitted', evidence: [], timeline: [] } as Complaint]).slice(0, 3).map((c, i) => <Link href={`/inspector/audit/${c.id}`} key={c.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-[#f4f8f5]" data-testid={`link-queue-item-${c.id}`}><span className={`grid h-9 w-9 place-items-center rounded-lg ${c.severity === 'High' ? 'bg-[#fce6e4] text-[#b43b37]' : 'bg-[#fff4d4] text-[#a27812]'}`}><CircleAlert size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#30473a]">{c.violations[0]}</p><p className="mt-1 text-[11px] text-[#92a098]">{c.productName} · {c.city}</p></div><span className="font-mono text-[10px] text-[#9ba79f]">{i === 0 ? '2h' : `${i}d`}</span><ChevronRight size={15} className="text-[#b1bbb4]" /></Link>)}</div></div><div className="rounded-2xl bg-[#173a2a] p-6 text-white"><div className="flex items-center justify-between"><h2 className="font-bold">This month</h2><BarChart3 size={18} className="text-[#7cddb0]" /></div><div className="mt-7 flex items-end gap-2"><span className="text-5xl font-extrabold tracking-[-.07em]">87</span><span className="mb-2 text-sm text-[#9ec3af]">reports resolved</span></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#18B978]" /></div><div className="mt-2 flex justify-between text-[10px] text-[#91b8a4]"><span>72% resolution rate</span><span>Target 80%</span></div><div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-xl font-bold">14.2h</p><p className="mt-1 text-[10px] text-[#91b8a4]">avg. response</p></div><div><p className="text-xl font-bold">4.8</p><p className="mt-1 text-[10px] text-[#91b8a4]">team rating</p></div></div></div></section></>;
}

function RulesPage() {
  const [rules, setRules] = useState(() => getStored<Rule[]>('rules', initialRules));
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<Rule | 'new' | null>(null);
  const filtered = rules.filter(r => `${r.title} ${r.clause}`.toLowerCase().includes(query.toLowerCase()));
  const saveRule = (rule: Rule) => { const next = rule.id === 'new' ? { ...rule, id: `rule-${Date.now()}` } : rule; const nextRules = rule.id === 'new' ? [next, ...rules] : rules.map(r => r.id === rule.id ? next : r); setRules(nextRules); setStored('rules', nextRules); setModal(null); };
  return <><PageTitle eyebrow="Regulatory library" title="Rules & checks" description="The living rule set behind every LegalAkshi report." action={<Button onClick={() => setModal('new')} data-testid="button-new-rule"><Plus size={17} />Add a rule</Button>} /><div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-[#97a49d]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search rules or clauses" className="focus-ring w-full rounded-lg border border-[#dce7df] bg-white py-2.5 pl-9 pr-3 text-sm outline-none" data-testid="input-search-rules" /></div><Button variant="secondary" onClick={() => setQuery('')} data-testid="button-filter-rules"><Filter size={15} />Clear filter</Button></div><div className="space-y-3">{filtered.map(rule => <div key={rule.id} className="rounded-xl border border-[#e2eae4] bg-white p-5 shadow-soft"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e2f7eb] text-[#12885c]"><BookOpen size={18} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[#20382b]">{rule.title}</h2><Badge tone={rule.status === 'Active' ? 'green' : rule.status === 'Draft' ? 'yellow' : 'neutral'}>{rule.status}</Badge></div><p className="mt-1 font-mono text-[11px] text-[#18a86f]">{rule.clause} · {rule.reference}</p></div></div><div className="flex gap-1"><button onClick={() => setModal(rule)} className="rounded-lg p-2 text-[#77867d] hover:bg-[#eef7f1] hover:text-[#12885c]" data-testid={`button-edit-rule-${rule.id}`}><Pencil size={16} /></button><button onClick={() => { const next = rules.map(r => r.id === rule.id ? { ...r, status: r.status === 'Inactive' ? 'Active' : 'Inactive' } as Rule : r); setRules(next); setStored('rules', next); }} className="rounded-lg p-2 text-[#77867d] hover:bg-[#fff3e3] hover:text-[#a27812]" data-testid={`button-toggle-rule-${rule.id}`}><SlidersHorizontal size={16} /></button></div></div><p className="mt-4 text-sm leading-relaxed text-[#5f7066]">{rule.description}</p><div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#edf1ee] pt-4 text-[11px] text-[#8c9991]"><span>Deduction <b className="text-[#53675a]">-{rule.deduction} pts</b></span><span>Effective <b className="text-[#53675a]">{rule.effectiveDate}</b></span><span className="ml-auto font-semibold text-[#12885c]">Inspect wording <ArrowRight size={13} className="inline" /></span></div></div>)}</div>{modal && <RuleModal rule={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={saveRule} />}</>;
}

function RuleModal({ rule, onClose, onSave }: { rule: Rule | null; onClose: () => void; onSave: (r: Rule) => void }) {
  const [title, setTitle] = useState(rule?.title ?? '');
  const [clause, setClause] = useState(rule?.clause ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#173a2a]/25 p-5"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#20382b]">{rule ? 'Edit rule' : 'Add a rule'}</h2><button onClick={onClose} className="rounded-lg p-2 text-[#7a8980] hover:bg-[#f1f5f2]" data-testid="button-close-rule-modal"><X size={18} /></button></div><div className="mt-5 space-y-4"><Field label="Rule title" value={title} onChange={e => setTitle(e.target.value)} testId="input-rule-title" /><Field label="Clause reference" value={clause} onChange={e => setClause(e.target.value)} testId="input-rule-clause" /><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#3d5145]">Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} className="focus-ring h-24 w-full resize-none rounded-lg border border-[#dbe6de] px-3 py-2 text-sm outline-none focus:border-[#18B978]" data-testid="input-rule-description" /></label></div><div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onClose} data-testid="button-cancel-rule">Cancel</Button><Button onClick={() => onSave({ id: rule?.id ?? 'new', title, clause, description, body: description, reference: 'LegalAkshi rule library', deduction: rule?.deduction ?? 10, effectiveDate: rule?.effectiveDate ?? '18 Jun 2024', status: rule?.status ?? 'Draft' })} data-testid="button-save-rule">Save rule <Check size={15} /></Button></div></div></div>;
}

function InspectorComplaints() {
  const [filter, setFilter] = useState('All');
  const [complaints, setComplaints] = useState(() => getStored<Complaint[]>('complaints', initialComplaints));
  const visible = complaints.filter(c => filter === 'All' || c.status === filter);
  return <><PageTitle eyebrow="Enforcement workspace" title="Complaint queue" description="Review consumer evidence, record a decision, and keep every step accountable." action={<Button variant="secondary" onClick={() => setFilter('All')} data-testid="button-refresh-queue"><History size={16} />Refresh queue</Button>} /><div className="mb-5 flex gap-2 overflow-auto pb-1">{['All', 'Submitted', 'Under review', 'Action taken', 'Closed'].map(f => <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${filter === f ? 'bg-[#dff5e9] text-[#12885c]' : 'bg-white text-[#7d8b83] hover:bg-[#eef5f0]'}`} data-testid={`button-filter-${f.toLowerCase().replaceAll(' ', '-')}`}>{f}</button>)}</div><div className="overflow-hidden rounded-xl border border-[#e2eae4] bg-white shadow-soft">{visible.length === 0 ? <EmptyState icon={ClipboardCheck} title="Queue is clear" text="No complaints match this filter." /> : visible.map(c => <div key={c.id} className="flex flex-col gap-4 border-b border-[#edf1ee] p-5 last:border-0 md:flex-row md:items-center"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${c.severity === 'High' ? 'bg-[#fce6e4] text-[#b43b37]' : 'bg-[#fff4d4] text-[#a27812]'}`}><CircleAlert size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-[#18a86f]">{c.trackingId}</span><Badge tone={c.status === 'Action taken' ? 'green' : 'yellow'}>{c.status}</Badge></div><p className="mt-2 text-sm font-bold text-[#30473a]">{c.violations[0]}</p><p className="mt-1 text-xs text-[#849188]">{c.productName} · {c.retailer} · {c.city}</p></div><span className="text-xs text-[#97a39b]">{c.submittedAt}</span><Link href={`/inspector/audit/${c.id}`} className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#dce7df] px-3 py-2 text-xs font-bold text-[#426050] hover:border-[#18B978] hover:text-[#12885c]" data-testid={`link-review-complaint-${c.id}`}>Review <ArrowRight size={13} /></Link></div>)}</div></>;
}

function AuditPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const complaints = getStored<Complaint[]>('complaints', initialComplaints);
  const fallback: Complaint = { ...initialComplaints[0], id: params.id ?? 'comp-02', trackingId: 'LA-24-0617-209', productName: 'Nature’s Basket Granola', retailer: 'Modern Bazaar, Viman Nagar', city: 'Pune', severity: 'High', violations: ['Missing FSSAI licence number'] };
  const complaint = complaints.find(c => c.id === params.id) ?? fallback;
  const [decision, setDecision] = useState(complaint.status);
  const [note, setNote] = useState('');
  const save = () => { const next = complaints.map(c => c.id === complaint.id ? { ...c, status: decision } : c); setStored('complaints', next); setLocation('/inspector/complaints'); };
  return <><PageTitle eyebrow="Official verification" title={complaint.trackingId} description={`${complaint.productName} · ${complaint.retailer}, ${complaint.city}`} action={<Badge tone={complaint.severity === 'High' ? 'red' : 'yellow'}>{complaint.severity} priority</Badge>} /><div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><div className="space-y-5"><div className="rounded-xl border border-[#e2eae4] bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><div><h2 className="font-bold text-[#20382b]">Evidence submitted</h2><p className="mt-1 text-xs text-[#849188]">Consumer report · {complaint.submittedAt}</p></div><Badge tone="green"><FileCheck2 size={12} />2 files</Badge></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="flex h-40 items-center justify-center rounded-lg bg-[#e9c99b] text-xs font-bold text-[#6f582d]">FRONT LABEL</div><div className="flex h-40 items-center justify-center rounded-lg bg-[#e7d8b0] text-xs font-bold text-[#6f582d]">SIDE LABEL</div></div></div><div className="rounded-xl border border-[#e2eae4] bg-white p-6 shadow-soft"><div className="flex items-center gap-2"><CircleAlert size={18} className="text-[#d9534f]" /><h2 className="font-bold text-[#20382b]">Reported findings</h2></div><div className="mt-4 space-y-3">{complaint.violations.map(v => <div key={v} className="rounded-lg bg-[#fff7df] p-4"><p className="text-sm font-bold text-[#6e5a27]">{v}</p><p className="mt-1 text-xs leading-relaxed text-[#867747]">Review the submitted evidence against the applicable declaration requirement.</p></div>)}</div></div></div><div className="space-y-5"><div className="rounded-xl border border-[#e2eae4] bg-white p-6 shadow-soft"><h2 className="font-bold text-[#20382b]">Record your action</h2><p className="mt-1 text-xs text-[#849188]">This decision is added to the official audit trail.</p><div className="mt-5 space-y-2">{['Under review', 'Action taken', 'Closed'].map(option => <button key={option} onClick={() => setDecision(option as Complaint['status'])} className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-semibold ${decision === option ? 'border-[#8bd8b4] bg-[#eaf8f1] text-[#12885c]' : 'border-[#e0e9e3] text-[#617269] hover:bg-[#fbfcfb]'}`} data-testid={`button-decision-${option.toLowerCase().replaceAll(' ', '-')}`}>{option}{decision === option && <Check size={16} />}</button>)}</div><label className="mt-5 block"><span className="mb-1.5 block text-xs font-bold text-[#42554a]">Internal note <span className="font-normal text-[#9aa69f]">(optional)</span></span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add context for the next officer…" className="focus-ring h-24 w-full resize-none rounded-lg border border-[#dbe6de] px-3 py-2 text-sm outline-none focus:border-[#18B978]" data-testid="input-audit-note" /></label><Button onClick={save} className="mt-5 w-full" data-testid="button-save-decision">Save decision <Check size={16} /></Button></div><div className="rounded-xl border border-[#dceadf] bg-[#eaf8f1] p-5"><div className="flex items-center gap-2 text-sm font-bold text-[#276047]"><ShieldCheck size={17} />Audit trail protected</div><p className="mt-2 text-xs leading-relaxed text-[#60816e]">Decisions are timestamped and linked to the evidence used in this review.</p></div></div></div></>;
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof ClipboardCheck; title: string; text: string }) { return <div className="rounded-xl border border-dashed border-[#cbdad0] bg-white px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#eaf8f1] text-[#18B978]"><Icon size={22} /></span><h2 className="mt-4 font-bold text-[#30473a]">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm text-[#849188]">{text}</p></div>; }
function NotFoundPage() { return <div className="grid min-h-[100dvh] place-items-center bg-[#F7F8F6] px-6"><div className="max-w-md text-center"><Logo /><div className="mx-auto mt-20 grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf8f1] text-[#18B978]"><Search size={28} /></div><p className="mt-6 font-mono text-xs text-[#18a86f]">404 / NOT IN THE RULEBOOK</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-[#173a2a]">This page took a wrong turn.</h1><p className="mt-3 text-sm leading-relaxed text-[#718078]">The shelf you’re looking for isn’t here. Let’s get you back to a clearer view.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#18B978] px-4 py-2.5 text-sm font-bold text-white" data-testid="link-not-found-home"><ArrowLeft size={16} />Back home</Link></div></div>; }

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const role = getStored<'consumer' | 'officer'>('role', 'consumer');
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn
    ? <Redirect to={role === 'officer' ? '/inspector/dashboard' : '/dashboard'} />
    : <Landing />;
}

function LoadingScreen() {
  return <div className="grid min-h-[100dvh] place-items-center bg-[#F7F8F6]"><div className="flex items-center gap-3 text-sm font-semibold text-[#426050]"><span className="h-3 w-3 animate-pulse rounded-full bg-[#18B978]" />Loading your workspace…</div></div>;
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);
  return null;
}

function Router() {
  const [role, setRole] = useState<'consumer' | 'officer'>(() => getStored('role', 'consumer'));
  const changeRole = (next: 'consumer' | 'officer') => { setRole(next); setStored('role', next); };
  const shell = (node: ReactNode) => <AppShell role={role} setRole={changeRole}>{node}</AppShell>;
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={HomeRedirect} />
    <Route path="/sign-in/*?">{() => <AuthPage mode="login" />}</Route>
    <Route path="/sign-up/*?">{() => <AuthPage mode="signup" />}</Route>
    <Route path="/login">{() => <Redirect to="/sign-in" />}</Route>
    <Route path="/signup">{() => <Redirect to="/sign-up" />}</Route>
    <Route path="/dashboard">{() => <ProtectedPage>{shell(<ConsumerDashboard />)}</ProtectedPage>}</Route>
    <Route path="/upload">{() => <ProtectedPage>{shell(<UploadPage />)}</ProtectedPage>}</Route>
    <Route path="/extraction">{() => <ProtectedPage>{shell(<ExtractionPage />)}</ProtectedPage>}</Route>
    <Route path="/analysis/:id">{() => <ProtectedPage>{shell(<AnalysisPage />)}</ProtectedPage>}</Route>
    <Route path="/complaint/new">{() => <ProtectedPage>{shell(<ComplaintNew />)}</ProtectedPage>}</Route>
    <Route path="/complaints">{() => <ProtectedPage>{shell(<ComplaintsPage />)}</ProtectedPage>}</Route>
    <Route path="/reports">{() => <ProtectedPage>{shell(<ReportsPage />)}</ProtectedPage>}</Route>
    <Route path="/profile">{() => <ProtectedPage>{shell(<ProfilePage />)}</ProtectedPage>}</Route>
    <Route path="/settings">{() => <ProtectedPage>{shell(<SettingsPage />)}</ProtectedPage>}</Route>
    <Route path="/inspector/dashboard">{() => <ProtectedPage>{shell(<OfficerDashboard />)}</ProtectedPage>}</Route>
    <Route path="/inspector/rules">{() => <ProtectedPage>{shell(<RulesPage />)}</ProtectedPage>}</Route>
    <Route path="/inspector/complaints">{() => <ProtectedPage>{shell(<InspectorComplaints />)}</ProtectedPage>}</Route>
    <Route path="/inspector/audit/:id">{() => <ProtectedPage>{shell(<AuditPage />)}</ProtectedPage>}</Route>
    <Route component={NotFoundPage} />
  </Switch></RoutedErrorBoundary>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your account' } },
      signUp: { start: { title: 'Create your account', subtitle: 'Get started today' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <Router />
    </QueryClientProvider>
  </ClerkProvider>;
}
function App() { return <TooltipProvider><WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter><Toaster /></TooltipProvider>; }
export default App;