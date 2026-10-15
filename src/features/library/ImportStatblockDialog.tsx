import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Label, Select, TextArea } from '@/components/ui/Field';
import { formatModifier } from '@/lib/statblock';
import { findByName, parseStatblockJson, type StatblockImportResult } from '@/lib/statblockImport';
import { useLibraryEntries, useLibraryStore } from '@/store/libraryStore';
import type { EntryKind } from '@/types/library';

interface Props {
  open: boolean;
  kind: EntryKind;
  onClose: () => void;
  /** Called with the ids of the imported entries. */
  onImported: (entryIds: string[]) => void;
}

type Mode = 'update' | 'create';

/** Imports the tracker's own statblock JSON (docs/statblock-json.md): one statblock or an array. */
export function ImportStatblockDialog({ open, kind, onClose, onImported }: Props) {
  const entries = useLibraryEntries();
  const importEntry = useLibraryStore((s) => s.importEntry);
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<StatblockImportResult | null>(null);
  const [modes, setModes] = useState<Record<number, Mode>>({});

  const close = () => {
    setPasted('');
    setResult(null);
    setModes({});
    onClose();
  };

  const parse = () => {
    setResult(parseStatblockJson(pasted));
    setModes({});
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPasted(await file.text());
  };

  const rows = (result?.statblocks ?? []).map((parsed, i) => ({
    parsed,
    existing: findByName(entries, kind, parsed.statblock.name),
    mode: modes[i] ?? 'update',
  }));

  const save = () => {
    const ids = rows.map(
      ({ parsed, existing, mode }) =>
        importEntry(
          kind,
          parsed.statblock,
          { kind: 'json', importedAt: Date.now() },
          existing && mode === 'update' ? existing.id : undefined,
        ).id,
    );
    close();
    onImported(ids);
  };

  const label = kind === 'npc' ? 'NPC' : 'player';

  return (
    <Dialog
      open={open}
      title={`Import ${label}s from JSON`}
      onClose={close}
      wide
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={rows.length === 0}>
            Import {rows.length > 1 ? `${rows.length} ${label}s` : ''}
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone-600">
        Paste one statblock or an array of them in the tracker's JSON format (see <code>docs/statblock-json.md</code>
        ). Entries with the same name as an existing {label} are updated in place unless you choose otherwise.
      </p>
      <Label label="Statblock JSON">
        <TextArea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder='{"schemaVersion": 2, "name": "...", ...}  or  [ {...}, {...} ]'
          className="min-h-40 font-mono text-xs"
        />
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".json,application/json"
          className="text-sm"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button onClick={parse} disabled={pasted.trim() === ''}>
          Parse
        </Button>
      </div>

      {result && result.errors.length > 0 && (
        <ul className="list-disc space-y-0.5 rounded border border-red-300 bg-red-50 p-2 pl-6 text-sm text-red-800">
          {result.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <ul className="divide-y divide-stone-200 rounded border border-stone-200">
          {rows.map(({ parsed, existing, mode }, i) => {
            const sb = parsed.statblock;
            return (
              <li key={i} className="space-y-1 p-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grow">
                    <strong>{sb.name}</strong>{' '}
                    <span className="text-stone-600">
                      level {sb.level} · HP {sb.hp.max} · AC {sb.ac.value} · Perception{' '}
                      {formatModifier(sb.perception.modifier)} · {sb.strikes.length} strikes · {sb.abilities.length}{' '}
                      abilities
                    </span>
                  </span>
                  {existing && (
                    <Select
                      className="w-auto"
                      value={mode}
                      onChange={(e) => setModes((m) => ({ ...m, [i]: e.target.value as Mode }))}
                    >
                      <option value="update">Update existing {existing.statblock.name}</option>
                      <option value="create">Create a second copy</option>
                    </Select>
                  )}
                </div>
                {parsed.warnings.length > 0 && (
                  <ul className="list-disc pl-5 text-stone-600">
                    {parsed.warnings.map((w, j) => (
                      <li key={j}>{w}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
