'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type ActivityNotice = {
  id: number;
  kind: 'withdrawal' | 'trade' | 'deposit';
  name: string;
  phone: string;
  amount: string;
  time: string;
  market: string;
  contract: string;
};

const DISPLAY_INTERVAL = 20_000;
const DISPLAY_DURATION = 7_000;
const FIRST_NAMES = ['Amara', 'Daniel', 'Hassan', 'Achieng', 'Brian', 'Nadia', 'Kamau', 'Leah', 'Adrian', 'Mercy', 'Victor', 'Zuri'];
const LAST_NAMES = ['Otieno', 'Mwangi', 'Hussein', 'Wanjiku', 'Kiptoo', 'Njoroge', 'Amani', 'Abdi', 'Mutua', 'Barasa', 'Omondi', 'Kariuki'];
const MARKETS = ['Volatility 100 Index', 'EUR/USD', 'GBP/USD', 'Bitcoin/USD', 'Gold/USD', 'Volatility 75 Index', 'USD/JPY', 'Ethereum/USD'];
const CONTRACTS = ['Over', 'Under', 'Matches', 'Differs', 'Rise', 'Fall'];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function maskedName(firstName: string, lastName: string): string {
  return `${firstName.slice(0, 2)}*** ${lastName[0]}.`;
}

function currentTimestamp(): string {
  const now = new Date();
  const day = now.getHours() < 4 ? 'Yesterday' : 'Today';
  const time = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} at ${time}`;
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
    amount: (kind === 'deposit' ? 2 + Math.random() * 498 : 5 + Math.random() * 2295).toFixed(2),
    time: kind === 'withdrawal' ? currentTimestamp() : '',
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
    const showNext = () => {
      setNotice((previous) => makeNotice(nextKind.current, previous));
      nextKind.current = nextKind.current === 'withdrawal'
        ? 'trade'
        : nextKind.current === 'trade'
          ? 'deposit'
          : 'withdrawal';
      dismissTimer = window.setTimeout(() => setNotice(null), DISPLAY_DURATION);
      displayTimer = window.setTimeout(showNext, DISPLAY_INTERVAL);
    };

    displayTimer = window.setTimeout(showNext, DISPLAY_INTERVAL);
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
      aria-label="Trading activity"
    >
      <div className="simulated-activity-copy">
        <div className="simulated-activity-heading">
          <span className="simulated-activity-indicator" aria-hidden="true" />
          <span>ACTIVITY</span>
          <span className="simulated-activity-kind">{notice.kind}</span>
        </div>
        {notice.kind === 'withdrawal' ? (
          <p>
            <strong>{notice.name}</strong> withdrew <strong>${notice.amount}</strong> USD
            <span className="simulated-activity-detail">{notice.phone} · {notice.time}</span>
          </p>
        ) : notice.kind === 'trade' ? (
          <p>
            <strong>{notice.name}</strong> is trading now: <strong>{notice.contract}</strong> on {notice.market}
          </p>
        ) : (
          <p>
            <strong>{notice.name}</strong> deposited <strong>${notice.amount}</strong> USD
            <span className="simulated-activity-detail">{notice.phone}</span>
          </p>
        )}
      </div>
      <button
        type="button"
        className="simulated-activity-dismiss"
        aria-label="Dismiss activity message"
        title="Dismiss"
        onClick={() => setNotice(null)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}