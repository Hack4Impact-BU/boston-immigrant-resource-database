import { NextResponse } from "next/server";

import { getAllServicesWithProviderContacts } from "@/app/api/airtable";
import { sendWeeklyUpdatesToProviders } from "@/lib/twilio";

export const runtime = "nodejs";


async function sendWeeklyUpdates() {
	try {
		const services = await getAllServicesWithProviderContacts();
		const result = await sendWeeklyUpdatesToProviders(services);

		return NextResponse.json(
			{
				success: true,
				...result,
			},
			{ status: 200 },
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";

		return NextResponse.json(
			{
				success: false,
				error: message,
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	return sendWeeklyUpdates();
}

export async function POST() {
	return sendWeeklyUpdates();
}