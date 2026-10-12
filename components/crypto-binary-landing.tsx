'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Clock3,
  LineChart,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteAuth } from '@/components/custom/site-auth-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type FeedMarket = {
  symbol: string;
  price: number;
  change: number;
  digits: number;
};

const INITIAL_MARKETS: FeedMarket[] = [
  { symbol: 'Volatility 10', price: 1284.62, change: 0.34, digits: 2 },
  { symbol: 'Volatility 75', price: 4932.18, change: -0.16, digits: 2 },
  { symbol: 'Jump 50', price: 827.43, change: 0.82, digits: 2 },
  { symbol: 'BTC/USD', price: 67420.58, change: 1.24, digits: 2 },
  { symbol: 'EUR/USD', price: 1.08472, change: -0.08, digits: 5 },
  { symbol: 'Crypto Binary trend', price: 92.14, change: 0.57, digits: 2 },
];

const INITIAL_SERIES = [34, 37, 32, 43, 39, 45, 41, 52, 48, 58, 54, 62, 56, 69, 65, 74, 67, 81, 76, 86, 79, 93];

const FEATURES = [
  {
    number: '01',
    title: 'Automated Options Bots',
    description: 'Build, backtest, and run rule-based strategies with configurable risk controls.',
    icon: Bot,
    accent: 'mint',
  },
  {
    number: '02',
    title: 'Synthetic & Crypto Volatility',
    description: 'Explore simulated indices designed to move independently of real-world economic news.',
    icon: Waves,
    accent: 'cyan',
  },
  {
    number: '03',
    title: 'Rise/Fall Momentum',
    description: 'Read short-term direction with live charts, clear entry context, and expiry tracking.',
    icon: LineChart,
    accent: 'lime',
  },
  {
    number: '04',
    title: 'Digit & Tick Analysis',
    description: 'Follow last-digit movement, tick history, and probability signals in real time.',
    icon: Clock3,
    accent: 'amber',
  },
] as const;

function formatPrice(value: number, digits: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getChartPoints(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 90 - ((value - min) / span) * 75;
      return `${x},${y}`;
    })
    .join(' ');
}

export function CryptoBinaryLanding() {
  const { openAuth } = useSiteAuth();
  const logoSrc = useLogoSrc();
  const reduceMotion = useReducedMotion();
  const [markets, setMarkets] = useState(INITIAL_MARKETS);
  const [series, setSeries] = useState(INITIAL_SERIES);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const linePoints = useMemo(() => getChartPoints(series), [series]);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPrompt);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    );

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMarkets(current => current.map(market => {
        const change = Number((market.change + (Math.random() - 0.48) * 0.14).toFixed(2));
        const price = Math.max(0.00001, market.price * (1 + (Math.random() - 0.49) * 0.0018));
        return { ...market, change, price };
      }));
      setSeries(current => [...current.slice(1), Math.max(12, Math.min(96, current.at(-1)! + (Math.random() - 0.45) * 17))]);
    }, 1350);

    return () => window.clearInterval(timer);
  }, []);

  const installApp = async () => {
    if (isInstalled) {
      toast.message('Crypto Binary is already installed.');
      return;
    }
    if (!installPrompt) {
      toast.message('App installation is not available in this browser yet.');
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  const tickerItems = [...markets, ...markets];
  const reveal = reduceMotion
    ? { initial: false, whileInView: undefined, transition: undefined }
    : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.55 } };

  return (
    <main className="cb-landing h-full min-h-0 overflow-y-auto bg-[#0b1010] text-[#f1f5f2]">
      <header className="cb-nav-wrap">
        <nav className="cb-nav" aria-label="Main navigation">
          <a className="cb-brand" href="/" aria-label="Crypto Binary home">
            {logoSrc ? (
              <Image src={logoSrc} alt="" width={36} height={36} className="cb-brand-image" />
            ) : (
              <span className="cb-brand-mark">CB</span>
            )}
            <span className="cb-brand-name">CRYPTO <b>BINARY</b></span>
          </a>
          <div className="cb-nav-actions">
            <button className="cb-nav-login" onClick={() => openAuth('login')}>Login</button>
            <button className="cb-nav-create" onClick={() => openAuth('signup')}>Create account <ArrowUpRight size={15} /></button>
            <button className="cb-nav-install" onClick={installApp}>
              <ArrowDownToLine size={15} /> {isInstalled ? 'Installed' : 'Install App'}
            </button>
          </div>
        </nav>
      </header>

      <div className="cb-ticker border-b border-white/[0.07]" aria-label="Simulated market ticker">
        <div className="cb-ticker-label"><span className="cb-live-dot" /> SIMULATED FEED</div>
        <motion.div
          className="cb-ticker-track"
          animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
          transition={reduceMotion ? undefined : { duration: 34, ease: 'linear', repeat: Infinity }}
        >
          {tickerItems.map((market, index) => (
            <div className="cb-ticker-item" key={`${market.symbol}-${index}`}>
              <span className="cb-ticker-symbol">{market.symbol}</span>
              <span className="cb-ticker-price">{formatPrice(market.price, market.digits)}</span>
              <span className={market.change >= 0 ? 'cb-positive' : 'cb-negative'}>
                {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <section className="cb-hero cb-shell">
        <div className="cb-hero-copy">
          <motion.div {...reveal} viewport={{ once: true }}>
            <div className="cb-eyebrow"><Sparkles size={14} /> THE MARKET, IN MOTION</div>
            <p className="cb-greeting">Good morning <span>— let’s find your signal.</span></p>
            <h1>Welcome to <span>Crypto Binary</span></h1>
            <p className="cb-hero-subtitle">
              Access advanced decentralized options, automated trading bots, and high-frequency analytical markets in one unified ecosystem.
            </p>
            <div className="cb-hero-actions">
              <button className="cb-button-primary" onClick={() => openAuth('login')}>
                Login <ArrowRight size={17} />
              </button>
              <button className="cb-button-secondary" onClick={() => openAuth('signup')}>
                Create account <ArrowUpRight size={16} />
              </button>
              <button className="cb-button-install" onClick={installApp}>
                <ArrowDownToLine size={17} /> {isInstalled ? 'App installed' : 'Install Crypto Binary'}
              </button>
            </div>
            <div className="cb-trust-line">
              <ShieldCheck size={15} /> Demo balances only <i /> Simulated outcomes <i /> No real-money funding
            </div>
          </motion.div>
        </div>

        <motion.div
          className="cb-terminal"
          initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.12 }}
          aria-label="Simulated live price chart"
        >
          <div className="cb-terminal-top">
            <div className="cb-terminal-title"><span className="cb-live-dot" /> MARKET SNAPSHOT</div>
            <span className="cb-sim-tag">PAPER FEED</span>
          </div>
          <div className="cb-chart-heading">
            <div>
              <div className="cb-chart-symbol">BTC/USD <span>· 1m</span></div>
              <div className="cb-chart-price">{formatPrice(markets[3].price, 2)} <span className={markets[3].change >= 0 ? 'cb-positive' : 'cb-negative'}>{markets[3].change >= 0 ? '+' : ''}{markets[3].change.toFixed(2)}%</span></div>
            </div>
            <span className="cb-chart-period">LIVE SIMULATION</span>
          </div>
          <div className="cb-chart-canvas">
            <div className="cb-chart-grid" />
            <div className="cb-chart-y-labels"><span>68,200</span><span>67,800</span><span>67,400</span><span>67,000</span></div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cb-chart-svg" aria-hidden="true">
              <defs>
                <linearGradient id="cb-chart-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#65efb5" stopOpacity=".23" />
                  <stop offset="100%" stopColor="#65efb5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`0,100 ${linePoints} 100,100`} fill="url(#cb-chart-fill)" />
              <polyline points={linePoints} fill="none" stroke="#65efb5" strokeWidth=".85" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="cb-chart-current"><span /> {formatPrice(markets[3].price, 2)}</div>
          </div>
          <div className="cb-chart-footer">
            <span><i className="cb-chart-keyline" /> Market price</span>
            <span>Updates every 1.35s</span>
          </div>
          <div className="cb-market-strip">
            <div><span>EUR/USD</span><b className={markets[4].change >= 0 ? 'cb-positive' : 'cb-negative'}>{markets[4].change >= 0 ? '+' : ''}{markets[4].change.toFixed(2)}%</b></div>
            <div><span>VOL 75</span><b className={markets[1].change >= 0 ? 'cb-positive' : 'cb-negative'}>{markets[1].change >= 0 ? '+' : ''}{markets[1].change.toFixed(2)}%</b></div>
            <div><span>JUMP 50</span><b className={markets[2].change >= 0 ? 'cb-positive' : 'cb-negative'}>{markets[2].change >= 0 ? '+' : ''}{markets[2].change.toFixed(2)}%</b></div>
          </div>
        </motion.div>
      </section>

      <section className="cb-features cb-shell" aria-labelledby="cb-features-title">
        <motion.div className="cb-section-heading" {...reveal} viewport={{ once: true }}>
          <div>
            <div className="cb-eyebrow">BUILT FOR ACTIVE THINKING</div>
            <h2 id="cb-features-title">One workspace. <span>More ways to read the market.</span></h2>
          </div>
          <p>Tools for exploring price movement, testing ideas, and tracking each decision in one place.</p>
        </motion.div>
        <div className="cb-feature-grid">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                className={`cb-feature-card cb-feature-${feature.accent}`}
                key={feature.number}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.08 }}
                whileHover={reduceMotion ? undefined : { y: -5 }}
              >
                <div className="cb-feature-card-head"><span>{feature.number}</span><Icon size={20} strokeWidth={1.7} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="cb-feature-rule" />
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="cb-bottom-cta cb-shell">
        <div className="cb-bottom-copy">
          <div className="cb-eyebrow"><Zap size={14} /> YOUR NEXT MOVE STARTS HERE</div>
          <h2>Make room for <span>better decisions.</span></h2>
          <p>Explore a demo account, follow live market feeds, and keep your positions close.</p>
        </div>
        <button className="cb-button-primary" onClick={() => openAuth('signup')}>
          Create your account <ArrowRight size={17} />
        </button>
      </section>

      <footer className="cb-footer cb-shell">
        <a className="cb-brand" href="/" aria-label="Crypto Binary home">
          <span className="cb-brand-mark">CB</span>
          <span className="cb-brand-name">CRYPTO <b>BINARY</b></span>
        </a>
        <span>Virtual demo trading. Prices and outcomes shown here are simulated.</span>
        <a href="/reports">Positions history <ArrowUpRight size={13} /></a>
      </footer>
    </main>
  );
}