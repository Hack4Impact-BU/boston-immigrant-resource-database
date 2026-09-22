import Link from "next/link";
import { Globe } from "lucide-react";

export default function ImmigrationGptBadge() {
  return (
    <Link
      href="https://immigrationgpt.org/"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 no-underline"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
        <Globe className="h-5 w-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-[#27317B]">Immigration GPT</span>
        <span className="max-w-[240px] whitespace-normal text-xs font-normal text-slate-500">
          Free chatbot to help find resources and answers for immigrants and refugees
        </span>
      </div>
    </Link>
  );
}
