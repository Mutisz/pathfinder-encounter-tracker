import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useLibraryStore } from '@/store/libraryStore';
import type { Statblock } from '@/types/statblock';
import { AbilitiesSection } from './StatblockEditor/AbilitiesSection';
import {
  AttributesSection,
  DefensesSection,
  HeaderSection,
  ItemsSection,
  PerceptionSection,
  RitualsSection,
  SkillsSection,
  SpeedSection,
} from './StatblockEditor/BasicSections';
import { SpellcastingSection } from './StatblockEditor/SpellcastingSection';
import { StrikesSection } from './StatblockEditor/StrikesSection';
import { StatblockView } from './StatblockView/StatblockView';

export function StatblockEditorPage() {
  const { id = '' } = useParams();
  const entry = useLibraryStore((s) => s.entries[id]);
  const saveStatblock = useLibraryStore((s) => s.saveStatblock);
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Statblock | null>(entry?.statblock ?? null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (entry && draft === null) setDraft(entry.statblock);
  }, [entry, draft]);

  if (!entry || !draft) {
    return (
      <p className="text-stone-600">
        Entry not found.{' '}
        <Link to="/library" className="underline">
          Back to library
        </Link>
      </p>
    );
  }

  const dirty = draft !== entry.statblock;
  const patch = (p: Partial<Statblock>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const save = () => {
    saveStatblock(id, draft);
    navigate('/library');
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 bg-parchment/95 px-4 py-2 backdrop-blur">
        <h2 className="grow text-lg font-semibold">
          {entry.kind === 'player' ? 'Player' : 'NPC'}: {draft.name || '(unnamed)'}
          {dirty && <span className="ml-2 text-sm font-normal text-stone-500">(unsaved)</span>}
        </h2>
        <Button variant="ghost" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? 'Hide preview' : 'Show preview'}
        </Button>
        <Button onClick={() => navigate('/library')}>Cancel</Button>
        <Button variant="primary" onClick={save} disabled={!draft.name.trim()}>
          Save
        </Button>
      </div>

      <div className={`grid gap-4 ${showPreview ? 'lg:grid-cols-[1fr_24rem]' : ''}`}>
        <div className="space-y-4">
          <HeaderSection sb={draft} patch={patch} />
          <PerceptionSection sb={draft} patch={patch} />
          <SkillsSection sb={draft} patch={patch} />
          <AttributesSection sb={draft} patch={patch} />
          <ItemsSection sb={draft} patch={patch} />
          <AbilitiesSection sb={draft} patch={patch} category="interaction" />
          <DefensesSection sb={draft} patch={patch} />
          <AbilitiesSection sb={draft} patch={patch} category="automatic" />
          <AbilitiesSection sb={draft} patch={patch} category="reactive" />
          <SpeedSection sb={draft} patch={patch} />
          <StrikesSection sb={draft} patch={patch} />
          <SpellcastingSection sb={draft} patch={patch} />
          <RitualsSection sb={draft} patch={patch} />
          <AbilitiesSection sb={draft} patch={patch} category="offensive" />
        </div>
        {showPreview && (
          <aside className="lg:sticky lg:top-14 lg:self-start">
            <StatblockView statblock={draft} />
          </aside>
        )}
      </div>
    </div>
  );
}
