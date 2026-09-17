export function TransparencyFooter({ limitations }: { limitations: string[] }) {
  return (
    <footer className="rounded border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
      <p className="mb-2 font-semibold">Public-Data Limitation Notice</p>
      <ul className="list-disc space-y-1 pl-4">
        {limitations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </footer>
  );
}
