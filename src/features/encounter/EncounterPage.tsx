import { Link, useParams } from 'react-router';
import { useEncounterStore } from '@/store/encounterStore';
import { RunningPanel } from './running/RunningPanel';
import { SetupPanel } from './setup/SetupPanel';
import { SummaryView } from './summary/SummaryView';

export function EncounterPage() {
  const { id = '' } = useParams();
  const enc = useEncounterStore((s) => s.encounters[id]);

  if (!enc) {
    return (
      <p className="text-stone-600">
        Encounter not found.{' '}
        <Link to="/encounters" className="underline">
          Back to encounters
        </Link>
      </p>
    );
  }

  switch (enc.status) {
    case 'setup':
      return <SetupPanel enc={enc} />;
    case 'running':
      return <RunningPanel enc={enc} />;
    case 'ended':
      return <SummaryView enc={enc} />;
  }
}
