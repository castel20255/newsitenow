'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type ActivityNotice = {
  id: number;
  kind: 'withdrawal' | 'trade';
  name: string;
  phone: string;
  amount: string;
  time: string;
  market: string;
  contract: string;
};

const DISPLAY_INTERVALS = [30_000, 50_000, 1 * 60_000 + 20_000];
const FIRST_NAMES = ['Amara', 'Daniel', 'Hassan', 'Achieng', 'Brian', 'Nadia', 'Kamau', 'Leah', 'Adrian', 'Mercy', 'Victor', 'Zuri'];
const LAST_NAMES = ['Otieno', 'Mwangi', 'Hussein', 'Wanjiku', 'Kiptoo', 'Njoroge', 'Amani', 'Abdi', 'Mutua', 'Barasa', 'Omondi', 'Kariuki'];
const MARKETS = ['Volatility 100 Index', 'EUR/USD', 'GBP/USD', 'Bitcoin/USD', 'Gold/USD', 'Volatility 75 Index', 'USD/JPY', 'Ethereum/USD'];
const CONTRACTS = ['Over', 'Under', 'Matches', 'Differs', 'Rise', 'Fall'];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function maskedName(firstName: string, lastName: string): string {
  const firstLength = Math.min(firstName.length, 2 + Math.floor(Math.random() * 3));
  const lastLength = Math.min(lastName.length, 2 + Math.floor(Math.random() * 3));
  return `${firstName.slice(0, firstLength)}xxx${firstName.slice(-1).toLowerCase()} ${lastName.slice(0, lastLength)}xxx${lastName.slice(-1).toLowerCase()}`;
}

function randomTime(previousTime: string): string {
  let time = '';
  while (!time || time === previousTime) {
    const day = Math.random() < 0.5 ? 'today' : 'yesterday';
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const period = Math.random() < 0.5 ? 'AM' : 'PM';
    time = `${day} at ${hour}:${minute} ${period}`;
  }
  return time;
}

function makeNotice(kind: ActivityNotice['kind'], previous: ActivityNotice | null): ActivityNotice {
  let name = '';
  while (!name || name === previous?.name) {
    name = maskedName(randomItem(FIRST_NAMES), randomItem(LAST_NAMES));
  }

  const phonePrefix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const phoneSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    kind,
    name,
    phone: `+2547${phonePrefix}xxx${phoneSuffix}`,
    amount: (5 + Math.random() * 2295).toFixed(2),
    time: randomTime(previous?.time ?? ''),
    market: randomItem(MARKETS),
    contract: randomItem(CONTRACTS),
  };
}

export function SimulatedActivityNotice() {
  const [notice, setNotice] = useState<ActivityNotice | null>(null);
  const nextKind = useRef<ActivityNotice['kind']>('withdrawal');

  useEffect(() => {
    let displayTimer = 0;
    let dismissTimer = 0;
    let intervalIndex = 1;

    const showNext = () => {
      setNotice((previous) => makeNotice(nextKind.current, previous));
      nextKind.current = nextKind.current === 'withdrawal' ? 'trade' : 'withdrawal';
      dismissTimer = window.setTimeout(() => setNotice(null), 8500);
      displayTimer = window.setTimeout(showNext, DISPLAY_INTERVALS[intervalIndex]);
      intervalIndex = (intervalIndex + 1) % DISPLAY_INTERVALS.length;
    };

    displayTimer = window.setTimeout(showNext, DISPLAY_INTERVALS[0]);
    return () => {
      window.clearTimeout(displayTimer);
      window.clearTimeout(dismissTimer);
    };
  }, []);

  if (!notice) return null;

  return (
    <aside
      key={notice.id}
      className="simulated-activity-notice"
      role="status"
      aria-live="polite"
      aria-label="Demo trading activity"
    >
      <div className="simulated-activity-copy">
        <div className="simulated-activity-heading">
          <span className="simulated-activity-indicator" aria-hidden="true" />
          <span>ACTIVITY</span>
          <span className="simulated-activity-kind">DEMO · {notice.kind}</span>
        </div>
        {notice.kind === 'withdrawal' ? (
          <p>
            <strong>{notice.name}</strong> withdrew <strong>${notice.amount}</strong> USD
            <span className="simulated-activity-detail">{notice.phone} · {notice.time}</span>
          </p>
        ) : (
          <p>
            <strong>{notice.name}</strong> is trading now: <strong>{notice.contract}</strong> on {notice.market}
            <span className="simulated-activity-detail">{notice.time}</span>
          </p>
        )}
      </div>
      <button
        type="button"
        className="simulated-activity-dismiss"
        aria-label="Dismiss simulated activity message"
        title="Dismiss"
        onClick={() => setNotice(null)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}