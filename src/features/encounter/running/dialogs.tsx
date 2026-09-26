import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Label, NumberInput } from '@/components/ui/Field';
import { activeNpcCount, removedParticipants } from '@/lib/encounter';
import type { Encounter, Participant, RemovalReason, ZeroHpOutcome } from '@/types/encounter';

export const reasonLabel: Record<RemovalReason, string> = {
  dead: 'Dead',
  ranAway: 'Ran away',
  surrendered: 'Surrendered',
};

// ---------- Damage / Heal ----------

export interface HpDialogState {
  participant: Participant;
  mode: 'damage' | 'heal';
}

export function HpDialog({
  state,
  onClose,
  onApply,
}: {
  state: HpDialogState | null;
  onClose: () => void;
  onApply: (id: string, mode: 'damage' | 'heal', amount: number) => void;
}) {
  const [amount, setAmount] = useState(0);
  const p = state?.participant;
  const apply = () => {
    if (!p || amount <= 0) return;
    onApply(p.id, state.mode, amount);
    setAmount(0);
  };
  return (
    <Dialog
      open={state !== null}
      title={state?.mode === 'heal' ? `Heal ${p?.name}` : `Damage ${p?.name}`}
      onClose={() => {
        setAmount(0);
        onClose();
      }}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={apply} disabled={amount <= 0}>
            Apply
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <p className="mb-2 text-sm text-stone-600">
          Current HP {p?.currentHp}/{p?.maxHp}
        </p>
        <Label label="Amount">
          <NumberInput value={amount} min={0} onChange={setAmount} autoFocus />
        </Label>
      </form>
    </Dialog>
  );
}

// ---------- Reduced to 0 HP ----------

export function ZeroHpDialog({
  participant,
  onClose,
  onDead,
  onOutcome,
}: {
  participant: Participant | null;
  onClose: () => void;
  onDead: (id: string) => void;
  onOutcome: (id: string, outcome: ZeroHpOutcome) => void;
}) {
  const p = participant;
  const isPlayer = p?.kind === 'player';
  return (
    <Dialog
      open={p !== null}
      title={`${p?.name} is reduced to 0 HP`}
      onClose={onClose}
      actions={
        p && isPlayer ? (
          <>
            <Button onClick={() => onOutcome(p.id, 'heroicRecovery')}>Heroic Recovery</Button>
            <Button variant="primary" onClick={() => onOutcome(p.id, 'dying')} autoFocus>
              Dying
            </Button>
          </>
        ) : p ? (
          <>
            <Button onClick={() => onOutcome(p.id, 'dying')}>Dying</Button>
            <Button variant="primary" onClick={() => onDead(p.id)} autoFocus>
              Dead
            </Button>
          </>
        ) : null
      }
    >
      <p className="text-sm text-stone-700">
        {isPlayer
          ? 'A knocked-out character moves in the initiative order to directly before the turn in which they were reduced to 0 HP.'
          : 'Most creatures die at 0 HP. Choose Dying for a significant NPC; it then moves in the order to directly before the current turn.'}
      </p>
      {isPlayer && (
        <p className="text-xs text-stone-500">
          Heroic Recovery: spend all Hero Points to lose the dying condition and stabilize at 0 HP. Conditions are not
          tracked yet.
        </p>
      )}
    </Dialog>
  );
}

// ---------- Remove ----------

export function RemoveDialog({
  participant,
  onClose,
  onRemove,
}: {
  participant: Participant | null;
  onClose: () => void;
  onRemove: (id: string, reason: RemovalReason) => void;
}) {
  const [reason, setReason] = useState<RemovalReason>('dead');
  return (
    <Dialog
      open={participant !== null}
      title={`Remove ${participant?.name}`}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (participant) onRemove(participant.id, reason);
              setReason('dead');
            }}
          >
            Remove
          </Button>
        </>
      }
    >
      <div className="space-y-1">
        {(Object.keys(reasonLabel) as RemovalReason[]).map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
            {reasonLabel[r]}
          </label>
        ))}
      </div>
    </Dialog>
  );
}

// ---------- Removed list ----------

export function RemovedDialog({
  enc,
  open,
  onClose,
  onRestore,
}: {
  enc: Encounter;
  open: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
}) {
  const removed = removedParticipants(enc);
  return (
    <Dialog
      open={open}
      title="Removed participants"
      onClose={onClose}
      actions={<Button onClick={onClose}>Close</Button>}
    >
      {removed.length === 0 ? (
        <p className="text-sm text-stone-500">Nobody has been removed yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200">
          {removed.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="grow">
                <span className="font-medium">{p.name}</span>{' '}
                <span className="text-stone-500">
                  · {reasonLabel[p.status as RemovalReason]} · round {p.removedRound} · {p.currentHp}/{p.maxHp} HP
                </span>
              </span>
              <Button size="sm" onClick={() => onRestore(p.id)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

// ---------- End encounter ----------

export function EndEncounterDialog({
  enc,
  open,
  onClose,
  onEnd,
}: {
  enc: Encounter;
  open: boolean;
  onClose: () => void;
  onEnd: () => void;
}) {
  const npcs = activeNpcCount(enc);
  return (
    <Dialog
      open={open}
      title="End encounter?"
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={npcs > 0 ? 'danger' : 'primary'} onClick={onEnd}>
            End encounter
          </Button>
        </>
      }
    >
      {npcs > 0 ? (
        <p className="text-sm">
          <strong>
            {npcs} NPC{npcs === 1 ? ' is' : 's are'} still in the encounter.
          </strong>{' '}
          They will be listed as survived. Remove them first if they are dead, fled or surrendered.
        </p>
      ) : (
        <p className="text-sm">All NPCs are out of the fight. A summary will be shown.</p>
      )}
    </Dialog>
  );
}
