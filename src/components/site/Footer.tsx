export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col gap-1 px-6 py-10 md:px-8">
        <p className="font-display text-sm font-semibold">Field Notes</p>
        <p className="ledger-label">
          윤효연 · 기술 기록 · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
