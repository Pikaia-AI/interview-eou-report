import type { Metadata } from 'next';
import { FocusedReport } from './focused-report';

export const metadata: Metadata = {
  title: 'Pikaia-Turn — Technical Report V2',
  description: 'Meet the Pikaia-Turn family, explore public and full-pool results, and compare waiting time, interruptions and input ablations.',
};

export default function Page() {
  return <FocusedReport/>;
}
