"use client";

import { useClerk } from "@clerk/nextjs";
import { useRef, useState } from "react";

export function AccessStatusSignOutButton() {
	const { signOut } = useClerk();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const isSigningOutRef = useRef(false);

	async function handleSignOut() {
		if (isSigningOutRef.current) {
			return;
		}

		isSigningOutRef.current = true;
		setIsSigningOut(true);

		try {
			await signOut({ redirectUrl: "/" });
		} finally {
			isSigningOutRef.current = false;
			setIsSigningOut(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleSignOut}
			disabled={isSigningOut}
			className="mt-3 inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{isSigningOut ? "Logging out..." : "Log out"}
		</button>
	);
}
