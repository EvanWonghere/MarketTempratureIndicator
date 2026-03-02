"use client";

import useSWR from "swr";

const HEADLINES_API = "/api/headlines";
const POLLING_MS = 60 * 1000;
const DISPLAY_COUNT = 20;

interface HeadlineRow {
  time: string;
  text: string;
}

interface HeadlinesData {
  list: HeadlineRow[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface HeadlinesProps {
  /** 盘中为 true 时每 60s 轮询，休市不轮询 */
  enablePolling?: boolean;
}

export function Headlines({ enablePolling = false }: HeadlinesProps) {
  const { data, error } = useSWR<HeadlinesData>(HEADLINES_API, fetcher, {
    refreshInterval: enablePolling ? POLLING_MS : 0,
    revalidateOnFocus: true,
  });

  const list = data?.list ?? [];
  const displayList = list.slice(0, DISPLAY_COUNT);

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-800">
        {error && (
          <li className="py-2 text-xs text-zinc-500 font-mono">快讯暂时不可用</li>
        )}
        {!error && displayList.length === 0 && (
          <li className="py-2 text-xs text-zinc-500 font-mono">暂无快讯</li>
        )}
        {!error &&
          displayList.map((row, i) => (
            <li
              key={`${row.time}-${i}`}
              className="flex gap-2 py-1.5 items-start text-xs font-mono group"
            >
              <span className="shrink-0 text-zinc-600 tabular-nums w-9">{row.time}</span>
              <span
                className="flex-1 min-w-0 text-zinc-400 truncate group-hover:whitespace-normal group-hover:break-words text-[11px] leading-tight"
                title={row.text}
              >
                {row.text}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
