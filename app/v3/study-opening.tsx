import { ArrowDown, ArrowDownRight } from 'lucide-react';
import { Header } from '../report-ui';
import { ListeningDesk } from './listening-desk';

export function StudyOpening() {
  return <div id="top" className="study-opening">
    <Header links={[['results', 'Results'], ['latency', 'Timing'], ['protocol', 'Protocol']]}/>
    <div className="shell">
      <div className="study-byline"><span>Pikaia-Turn <i>/</i> Technical report</span><span>November 2026</span></div>
      <div className="study-intro">
        <h1>Wait or respond?</h1>
        <div><p>When a speaker pauses, can a listener naturally take a turn? We measure how well turn detectors recognize that moment in Mandarin and English interviews.</p>
          <div className="study-links"><a href="#results">See measured results <ArrowDown size={14}/></a><a href="#protocol">Evaluation protocol <ArrowDownRight size={14}/></a></div>
        </div>
      </div>
      <ListeningDesk/>
    </div>
  </div>;
}
