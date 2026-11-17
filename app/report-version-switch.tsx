import './report-version-switch.css';
import Link from 'next/link';

export function ReportVersionSwitch({ version }: { version: 'v1' | 'v2' }) {
  return <nav className="report-version-switch" aria-label="Compare report versions">
    <div className="shell">
      <span>Explore both editions</span>
      <div>
        <Link href="/" prefetch={false} aria-current={version === 'v1' ? 'page' : undefined}>V1 <span>· Complete report</span></Link>
        <Link href="/v2/" prefetch={false} aria-current={version === 'v2' ? 'page' : undefined}>V2 <span>· Focused report</span></Link>
      </div>
    </div>
  </nav>;
}
