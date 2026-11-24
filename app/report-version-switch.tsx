import './report-version-switch.css';
import Link from 'next/link';

export function ReportVersionSwitch({ version }: { version: 'v1' | 'v2' | 'v3' }) {
  return <nav className="report-version-switch" aria-label="Compare report versions">
    <div className="shell">
      <span>Report editions</span>
      <div>
        <Link href="/" prefetch={false} aria-current={version === 'v1' ? 'page' : undefined}>V1 <span>· Complete report</span></Link>
        <Link href="/v2/" prefetch={false} aria-current={version === 'v2' ? 'page' : undefined}>V2 <span>· Focused report</span></Link>
        <Link href="/v3/" prefetch={false} aria-current={version === 'v3' ? 'page' : undefined}>V3 <span>· Research report</span></Link>
      </div>
    </div>
  </nav>;
}
