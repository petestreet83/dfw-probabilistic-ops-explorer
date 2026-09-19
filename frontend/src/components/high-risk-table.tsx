const AIRPORT_NAMES: Record<string, string> = {
  ATL: "Atlanta",
  BOS: "Boston Logan",
  DEN: "Denver",
  DFW: "Dallas/Fort Worth",
  HOU: "Houston Hobby",
  IAD: "Washington Dulles",
  JFK: "New York JFK",
  LAX: "Los Angeles",
  MIA: "Miami",
  ORD: "Chicago O'Hare",
  PHX: "Phoenix Sky Harbor",
  SEA: "Seattle-Tacoma",
  SLC: "Salt Lake City",
};

function formatRoute(route: string): string {
  const [origin, destination] = route.split("-");
  if (!origin || !destination) return route;
  return `${AIRPORT_NAMES[origin] ?? origin} (${origin}) → ${AIRPORT_NAMES[destination] ?? destination} (${destination})`;
}

export function HighRiskTable({ flights }: { flights: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-3 text-sm font-semibold">High-Risk Flights by Route (Public Data)</h2>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-zinc-400">
              <th className="p-2">Flight</th>
              <th className="p-2">Route</th>
              <th className="p-2">Risk</th>
              <th className="p-2">Carrier Delay Proxy</th>
            </tr>
          </thead>
          <tbody>
            {flights.length === 0 ? (
              <tr>
                <td className="p-2 text-zinc-500" colSpan={4}>
                  No cached benchmark rows available.
                </td>
              </tr>
            ) : (
              flights.map((flight) => (
                <tr key={`${String(flight.flight_id)}-${String(flight.route)}-${String(flight.cache_timestamp)}`} className="border-t border-zinc-800">
                  <td className="p-2">{String(flight.flight_id)}</td>
                  <td className="p-2">{formatRoute(String(flight.route))}</td>
                  <td className="p-2">{String(flight.risk_score)}</td>
                  <td className="p-2">{String(flight.carrier_delay_proxy_minutes)} min (Carrier-controllable delay proxy)</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
