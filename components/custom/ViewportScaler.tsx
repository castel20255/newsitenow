export default function ViewportScaler({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>
  );
}
