import type { Metadata } from 'next';
import { FocusedReport } from '../v2/focused-report';
import { ParticleField } from './particle-field';
import './motion.css';

export const metadata: Metadata = {
  title: 'Pikaia-Turn — Particle Study / Technical Report V3',
  description: 'Explore the Pikaia-Turn technical report, with an interactive particle study of the Pikaia specimen.',
};

export default function Page() {
  return <FocusedReport edition="v3" heroEffect={<ParticleField/>}/>;
}
