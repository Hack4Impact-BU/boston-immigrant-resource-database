import Link from "next/link";
import { getForumSettings } from "@/lib/forum";

export default async function RightRail() {
  const { importantLinks, rules } = await getForumSettings();

  return (
    <aside className="hidden w-[230px] shrink-0 flex-col gap-4 lg:flex">
      {/* <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#27317B]">Important Links</h3>
        <div className="mt-3 flex flex-col">
          {importantLinks.map((link, i) => (
            <Link
              key={`${link.label}-${i}`}
              href={link.href || "#"}
              className="border-b border-slate-100 py-2 text-xs text-slate-600 transition-colors last:border-b-0 hover:text-[#2F80C2]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section> */}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#27317B]">Rules</h3>
        <ol className="mt-3 flex flex-col">
          {rules.map((rule, i) => (
            <li
              key={`${rule}-${i}`}
              className="border-b border-slate-100 py-2 text-xs text-slate-600 last:border-b-0"
            >
              {i + 1}. {rule}
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
