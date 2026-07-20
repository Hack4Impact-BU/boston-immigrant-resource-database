import Image from "next/image";
import Link from "next/link";

import { AccessStatusSignOutButton } from "./access-status-sign-out-button";

type AccessStatusPageProps = {
	searchParams: Promise<{
		access?: string | string[];
	}>;
};

function getAccessStatus(access: string | string[] | undefined) {
	const value = Array.isArray(access) ? access[0] : access;

	return value === "rejected" ? "rejected" : "pending";
}

export default async function AccessStatusPage({ searchParams }: AccessStatusPageProps) {
	const { access } = await searchParams;
	const status = getAccessStatus(access);
	const isRejected = status === "rejected";

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-6 py-12">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(72,128,199,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(93,174,255,0.12),transparent_30%)]" />
			<div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/70 to-transparent" />

			<div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 px-8 py-10 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-10">
				<div className="mb-8 flex justify-center">
					<Image
						src="/icons/Just_BIRD_logo_blue.png"
						alt="BIRD"
						width={72}
						height={72}
						priority
						className="h-14 w-14 object-contain"
					/>
				</div>

				<h1 className="text-4xl font-semibold tracking-tight text-slate-950">
					{isRejected ? "Rejected" : "Waiting for approval"}
				</h1>
				<p className="mt-4 text-base leading-7 text-slate-700">
					{isRejected
						? "Your account access request was rejected."
						: "Your account is pending approval. Please check back later."}
				</p>

				<Link
					href="/"
					className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-[#5d93c7] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(93,147,199,0.28)] transition-colors hover:bg-[#4b81b6]"
				>
					Return home
				</Link>
				<div>
					<AccessStatusSignOutButton />
				</div>
			</div>
		</main>
	);
}
