import Link from 'next/link';

const sections = [
  {
    title: '1. Using Crypto Binary',
    paragraphs: [
      'Crypto Binary provides market charts, short-duration trading features, digit analysis, and wallet tools. By creating an account or using these services, you agree to these Terms. If you do not agree, do not use the platform.',
      'The platform and its features may change, be unavailable, or be limited in some locations. You are responsible for checking whether your use is permitted where you live.',
    ],
  },
  {
    title: '2. Eligibility and account security',
    paragraphs: [
      'You must be at least 18 and legally able to enter into an agreement in your jurisdiction. Provide accurate account details, keep your sign-in credentials private, and tell us if you believe someone else has accessed your account.',
      'You are responsible for activity performed through your account, except where applicable law provides otherwise.',
    ],
  },
  {
    title: '3. Demo and Real Wallets',
    paragraphs: [
      'A new account may include a $10,000 Demo balance for practice. Demo funds are virtual, have no cash value, and cannot be deposited or withdrawn.',
      'The Real Wallet displays the account balance used by the platform’s real-wallet features. Deposits and withdrawals are offered through supported payment methods, which may include M-Pesa. Requests can remain pending while they are processed. Availability, limits, and processing times may depend on the payment provider and the account.',
      'Do not submit a payment unless the displayed amount and destination details are correct. Keep your transaction records and contact support through the available in-app channel if a payment appears incorrect.',
    ],
  },
  {
    title: '4. Markets and trades',
    paragraphs: [
      'Available features may include Rise/Fall contracts on supported markets, Forex Basket markets, and digit contracts such as Over, Under, Even, Odd, Matches, and Differs. Market symbols, contract availability, prices, durations, and payout quotes can change.',
      'Trades are recorded by Crypto Binary and resolved using the market-price data available to the platform. They are not submitted to an external exchange or broker unless the platform clearly says otherwise. Data feeds, network interruptions, rounding, or technical faults may affect a quote or settlement.',
      'Trading carries risk. You can lose the stake committed to a trade. Past results do not guarantee future outcomes, and nothing on the platform is financial, investment, or tax advice. Do not trade money you cannot afford to lose.',
    ],
  },
  {
    title: '5. Acceptable use',
    paragraphs: [
      'Do not use the platform for unlawful activity, attempt to access another person’s account or restricted systems, interfere with the service, or exploit a pricing, payment, or software error. Do not submit false or unauthorized payment details.',
      'We may restrict access or review activity when needed to protect users, the platform, or payment operations, or to comply with law.',
    ],
  },
  {
    title: '6. Third-party services',
    paragraphs: [
      'Some features rely on third parties, including market-data and payment providers. Their services are subject to their own availability and terms. Crypto Binary is not responsible for outages or processing delays caused by those providers.',
    ],
  },
  {
    title: '7. Service availability and liability',
    paragraphs: [
      'The platform is provided as available. We work to maintain it, but do not promise uninterrupted access, error-free data, or that every feature will be available at all times.',
      'To the extent permitted by law, Crypto Binary is not liable for indirect or consequential loss arising from use of the service. Nothing in these Terms limits liability that cannot legally be limited.',
    ],
  },
  {
    title: '8. Changes and contact',
    paragraphs: [
      'We may update these Terms as the service changes. The latest version will be posted here with its revision date. Continued use after an update takes effect means you accept the revised Terms, where permitted by law.',
      'For questions about these Terms, contact support using the contact options provided in the app.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="legal-page flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">← Back to home</Link>
        <header className="mt-8 border-b border-border pb-6">
          <p className="text-sm font-medium text-muted-foreground">Crypto Binary</p>
          <h1 className="mt-2 text-3xl font-semibold">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: October 22, 2026</p>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
            These terms explain the rules for using Crypto Binary accounts, wallets, market tools, and trading features.
          </p>
        </header>
        <div className="divide-y divide-border">
          {sections.map(section => (
            <section key={section.title} className="space-y-3 py-6">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              {section.paragraphs.map(paragraph => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
        <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-sm">
          <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy →</Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
        </footer>
      </div>
    </main>
  );
}