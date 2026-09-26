import { ActionCostIcon } from '@/components/ui/ActionCostIcon';
import { Traits } from '@/components/ui/Traits';
import { abilitiesByCategory, formatModifier, strikeMap, traitsLine } from '@/lib/statblock';
import { ATTRIBUTE_KEYS, type Ability, type SpellRank, type Statblock, type Strike } from '@/types/statblock';
import type { ReactNode } from 'react';

const Line = ({ label, children }: { label: string; children: ReactNode }) => (
  <p className="leading-snug">
    <span className="font-bold">{label}</span> {children}
  </p>
);

const Divider = () => <hr className="my-1.5 border-ink/60" />;

const AbilityLine = ({ a }: { a: Ability }) => (
  <p className="leading-snug">
    <span className="font-bold">{a.name}</span>
    <ActionCostIcon cost={a.actionCost} />
    {a.traits.length > 0 && <span className="text-stone-600">({a.traits.join(', ')}) </span>}
    {a.frequency && (
      <>
        <span className="font-semibold">Frequency</span> {a.frequency};{' '}
      </>
    )}
    {a.trigger && (
      <>
        <span className="font-semibold">Trigger</span> {a.trigger};{' '}
      </>
    )}
    {a.requirements && (
      <>
        <span className="font-semibold">Requirements</span> {a.requirements};{' '}
      </>
    )}
    {(a.frequency || a.trigger || a.requirements) && <span className="font-semibold">Effect</span>} {a.description}
  </p>
);

const StrikeLine = ({ s }: { s: Strike }) => {
  const [a, b, c] = strikeMap(s);
  return (
    <p className="leading-snug">
      <span className="font-bold">{s.kind === 'melee' ? 'Melee' : 'Ranged'}</span>
      <ActionCostIcon cost={1} />
      {s.name} {formatModifier(a)}{' '}
      <span className="text-stone-500">
        [{formatModifier(b)}/{formatModifier(c)}]
      </span>
      {(s.traits.length > 0 || s.range || s.reload) && (
        <> ({[...s.traits, s.range, s.reload ? `reload ${s.reload}` : undefined].filter(Boolean).join(', ')})</>
      )}
      , <span className="font-bold">Damage</span> {s.damage.map((d) => `${d.formula} ${d.type}`.trim()).join(' plus ')}
      {s.effects && ` ${s.effects}`}
    </p>
  );
};

const rankText = (r: SpellRank) =>
  `${r.rank === 0 ? 'Cantrips' : `${ordinal(r.rank)}`}${r.slots ? ` (${r.slots} slots)` : ''} ${r.spells
    .map((sp) => `${sp.name}${sp.uses ? ` (${sp.uses})` : ''}${sp.notes ? ` [${sp.notes}]` : ''}`)
    .join(', ')}`;

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

export function StatblockView({ statblock: sb }: { statblock: Statblock }) {
  const section = (cat: Ability['category']) =>
    abilitiesByCategory(sb, cat).map((a) => <AbilityLine key={a.id} a={a} />);

  return (
    <article className="rounded border border-stone-300 bg-white p-4 text-sm">
      <header className="flex items-baseline justify-between gap-2 border-b-2 border-ink pb-1">
        <h3 className="text-lg font-bold uppercase">{sb.name || '(unnamed)'}</h3>
        <span className="font-bold uppercase">Creature {sb.level}</span>
      </header>
      <Traits traits={traitsLine(sb)} className="my-1.5" />
      {sb.source?.book && (
        <p className="text-xs text-stone-500">
          Source {sb.source.book}
          {sb.source.page ? ` pg. ${sb.source.page}` : ''}
        </p>
      )}
      <Line label="Perception">
        {formatModifier(sb.perception.modifier)}
        {sb.perception.senses.length > 0 && `; ${sb.perception.senses.join(', ')}`}
        {sb.perception.notes && `; ${sb.perception.notes}`}
      </Line>
      {(sb.languages.length > 0 || sb.languageNotes) && (
        <Line label="Languages">
          {sb.languages.join(', ')}
          {sb.languageNotes && `; ${sb.languageNotes}`}
        </Line>
      )}
      {sb.skills.length > 0 && (
        <Line label="Skills">
          {sb.skills.map((s) => `${s.name} ${formatModifier(s.modifier)}${s.notes ? ` (${s.notes})` : ''}`).join(', ')}
        </Line>
      )}
      <Line label="">
        {ATTRIBUTE_KEYS.map((k) => (
          <span key={k} className="mr-2">
            <span className="font-bold capitalize">{k}</span> {formatModifier(sb.attributes[k])}
          </span>
        ))}
      </Line>
      {sb.items.length > 0 && <Line label="Items">{sb.items.join(', ')}</Line>}
      {section('interaction')}
      <Divider />
      <p className="leading-snug">
        <span className="font-bold">AC</span> {sb.ac.value}
        {sb.ac.notes && ` (${sb.ac.notes})`}; <span className="font-bold">Fort</span>{' '}
        {formatModifier(sb.saves.fortitude)}, <span className="font-bold">Ref</span> {formatModifier(sb.saves.reflex)},{' '}
        <span className="font-bold">Will</span> {formatModifier(sb.saves.will)}
        {sb.saves.notes && `; ${sb.saves.notes}`}
      </p>
      <p className="leading-snug">
        <span className="font-bold">HP</span> {sb.hp.max}
        {sb.hp.notes && ` (${sb.hp.notes})`}
        {sb.immunities.length > 0 && (
          <>
            ; <span className="font-bold">Immunities</span> {sb.immunities.join(', ')}
          </>
        )}
        {sb.weaknesses.length > 0 && (
          <>
            ; <span className="font-bold">Weaknesses</span>{' '}
            {sb.weaknesses.map((w) => `${w.type} ${w.value}${w.notes ? ` (${w.notes})` : ''}`).join(', ')}
          </>
        )}
        {sb.resistances.length > 0 && (
          <>
            ; <span className="font-bold">Resistances</span>{' '}
            {sb.resistances.map((w) => `${w.type} ${w.value}${w.notes ? ` (${w.notes})` : ''}`).join(', ')}
          </>
        )}
      </p>
      {section('automatic')}
      {section('reactive')}
      <Divider />
      <Line label="Speed">
        {sb.speed.base} feet
        {sb.speed.other.map((o) => `, ${o.type} ${o.value} feet`).join('')}
        {sb.speed.notes && `; ${sb.speed.notes}`}
      </Line>
      {sb.strikes
        .filter((s) => s.kind === 'melee')
        .map((s) => (
          <StrikeLine key={s.id} s={s} />
        ))}
      {sb.strikes
        .filter((s) => s.kind === 'ranged')
        .map((s) => (
          <StrikeLine key={s.id} s={s} />
        ))}
      {sb.spellcasting.map((sc) => (
        <p key={sc.id} className="leading-snug">
          <span className="font-bold">{sc.name || `${sc.tradition} ${sc.kind} spells`}</span> DC {sc.dc}
          {sc.attack !== undefined && sc.attack !== 0 && `, attack ${formatModifier(sc.attack)}`}
          {sc.kind === 'focus' &&
            sc.focusPoints !== undefined &&
            `, ${sc.focusPoints} Focus Point${sc.focusPoints === 1 ? '' : 's'}`}
          {[...sc.ranks].sort((a, b) => b.rank - a.rank).map((r) => `; ${rankText(r)}`)}
          {sc.constant.length > 0 &&
            `; Constant ${sc.constant.map((r) => `(${ordinal(r.rank)}) ${r.spells.map((x) => x.name).join(', ')}`).join('; ')}`}
        </p>
      ))}
      {sb.rituals.length > 0 && <Line label="Rituals">{sb.rituals.join(', ')}</Line>}
      {section('offensive')}
    </article>
  );
}
