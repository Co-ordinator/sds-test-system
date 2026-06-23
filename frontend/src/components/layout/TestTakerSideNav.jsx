import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Accessibility, Award, BookOpen, HelpCircle, Home } from 'lucide-react';
import { GOV } from '../../theme/government';

const SIDE_NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home, matches: ['/dashboard', '/profile'] },
  { to: '/results', label: 'Results', Icon: Award, matches: ['/results'] },
  { to: '/glossary', label: 'Glossary', Icon: BookOpen, matches: ['/glossary'] },
  { to: '/accessibility', label: 'Accessibility', Icon: Accessibility, matches: ['/accessibility'] },
];

export default function TestTakerSideNav() {
  const location = useLocation();

  const isActive = (link) =>
    link.matches.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  return (
    <aside
      className="hidden h-full w-[310px] shrink-0 flex-col overflow-hidden border-r bg-white lg:flex"
      style={{ borderColor: GOV.border }}
      aria-label="Test taker navigation"
    >
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-2">
          {SIDE_NAV_LINKS.map(({ to, label, Icon, matches }) => {
            const active = isActive({ matches });
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 rounded-md px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? GOV.blueLightAlt : 'transparent',
                  color: active ? GOV.blue : GOV.textMuted,
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-3 pb-6">
        <div className="border-t pt-4" style={{ borderColor: GOV.borderLight }}>
          <Link
            to="/help"
            className="flex items-center gap-4 rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ color: GOV.textMuted }}
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            <span>Help &amp; FAQ</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
