import { Navigate, NavLink, Route, Routes } from 'react-router';
import { EncounterListPage } from './features/encounter/EncounterListPage';
import { EncounterPage } from './features/encounter/EncounterPage';
import { LibraryPage } from './features/library/LibraryPage';
import { StatblockEditorPage } from './features/library/StatblockEditorPage';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 font-medium ${isActive ? 'bg-accent text-white' : 'text-ink hover:bg-stone-200'}`;

export default function App() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <header className="flex flex-wrap items-center gap-4 py-4">
        <h1 className="text-xl font-bold tracking-tight">Pathfinder Encounter Tracker</h1>
        <nav className="flex gap-1">
          <NavLink to="/encounters" className={linkClass}>
            Encounters
          </NavLink>
          <NavLink to="/library" className={linkClass}>
            Library
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/encounters" replace />} />
          <Route path="/encounters" element={<EncounterListPage />} />
          <Route path="/encounters/:id" element={<EncounterPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:id" element={<StatblockEditorPage />} />
          <Route path="*" element={<Navigate to="/encounters" replace />} />
        </Routes>
      </main>
    </div>
  );
}
