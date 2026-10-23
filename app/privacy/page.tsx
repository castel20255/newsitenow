import Link from 'next/link';

const sections = [
  {
    title: '1. About this policy',
    paragraphs: [
      'This Privacy Policy describes how Crypto Binary handles information when you create an account or use its market, wallet, and trading features. It applies to information collected through the platform.',
    ],
  },
  {
    title: '2. Information we handle',
    paragraphs: [
      'Account details may include your name, username, email address, phone number, country, and authentication data. Passwords are submitted to Supabase Auth for verification; Crypto Binary does not persist plaintext passwords in its own application database.',
      'Wallet and activity records may include balances, deposits, withdrawal requests, payment details you provide, selected markets, trade terms, outcomes, and timestamps.',
      'The platform also uses technical information needed to provide and protect the service, such as browser and device details, session and preference storage, and service or error logs.',
    ],
  },
  {
    title: '3. How information is used',
    paragraphs: [
      'We use information to create and secure accounts, provide Demo and Real Wallet features, process payment requests, record and settle trades, show account history, respond to support requests, maintain the service, and detect misuse or technical problems.',
      'Essential cookies and local storage may be used to maintain sessions, remember account or appearance preferences, and support security. Disabling them may prevent some features from working.',
    ],
  },
  {
    title: '4. Service providers and sharing',
    paragraphs: [
      'We share information with providers only as needed to operate the platform. These may include Supabase for authentication and database services, market-data providers for price feeds, and payment providers for supported deposit or withdrawal methods such as M-Pesa.',
      'Information may also be disclosed when required by law, to respond to valid legal requests, or to protect users, the service, and our rights. We do not sell personal information to advertisers.',
    ],
  },
  {
    title: '5. Retention and security',
    paragraphs: [
      'We retain account, wallet, and trade records while needed to operate the service and meet applicable legal, accounting, security, or dispute-resolution requirements. Retention periods depend on the type of record and the applicable requirements.',
      'We use access controls and service-provider safeguards intended to protect information. No internet service can guarantee absolute security, so protect your credentials and contact support if you suspect unauthorized access.',
    ],
  },
  {
    title: '6. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights to request access to, correction of, or deletion of personal information, or to object to certain processing. Some records may need to be retained for legal or operational reasons.',
      'To ask a privacy question or make a request, contact support using the contact options provided in the app. We may need to verify your account before responding.',
    ],
  },
  {
    title: '7. Children and policy updates',
    paragraphs: [
      'Crypto Binary is intended for adults aged 18 or older. We do not knowingly provide accounts to children.',
      'We may revise this policy as the service changes. The current version and revision date will appear on this page.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="legal-page flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">← Back to home</Link>
        <header className="mt-8 border-b border-border pb-6">
          <p className="text-sm font-medium text-muted-foreground">Crypto Binary</p>
          <h1 className="mt-2 text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: October 22, 2026</p>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
            This policy explains what information the platform handles, why it is used, and the choices available to you.
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
          <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service →</Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
        </footer>
      </div>
    </main>
  );
}