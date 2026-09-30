import Link from "next/link";
import { Globe } from "lucide-react";

export default function ImmigrationGptBadge() {
  return (
    <Link
      href="https://immigrationgpt.org/"
      target="_blank"
      rel="noreferrer"
      className="flex h-20 items-center justify-center gap-3 no-underline sm:h-24"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <Globe className="h-8 w-8" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold text-[#27317B]">Immigration GPT</span>
        <span className="max-w-[280px] whitespace-normal text-sm font-normal text-slate-500">
          Free chatbot to help find resources and answers for immigrants and refugees
        </span>
      </div>
    </Link>
  );
}
