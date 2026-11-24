import type { Metadata } from 'next';
import { FocusedReport } from '../v2/focused-report';
import { StudyOpening } from './study-opening';
import './study.css';

export const metadata: Metadata = {
  title: 'Pikaia-Turn — Wait or respond? / Technical Report',
  description: 'Study response readiness at a pause, then explore bilingual recall, waiting time and false cut-offs for the Pikaia-Turn family.',
};

export default function Page() {
  return <FocusedReport edition="v3" opening={<StudyOpening/>}/>;
}
