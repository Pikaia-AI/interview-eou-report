import Report from './report-page';
import { ReportVersionSwitch } from './report-version-switch';

export default function Page() {
  return <><ReportVersionSwitch version="v1"/><Report/></>;
}
