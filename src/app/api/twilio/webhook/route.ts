import { handleInboundProviderSms, buildTwilioXmlResponse, normalizeSmsBody, normalizeSmsFrom } from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const formData = new URLSearchParams(await request.text());
		const from = normalizeSmsFrom(formData.get("From"));
		const body = normalizeSmsBody(formData.get("Body"));

		if (!from) {
			return new Response(buildTwilioXmlResponse("We could not read the sending phone number."), {
				status: 400,
				headers: {
					"Content-Type": "text/xml; charset=utf-8",
				},
			});
		}

		const result = await handleInboundProviderSms(from, body);

		return new Response(buildTwilioXmlResponse(result.reply), {
			status: 200,
			headers: {
				"Content-Type": "text/xml; charset=utf-8",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";

		return new Response(buildTwilioXmlResponse(message), {
			status: 500,
			headers: {
				"Content-Type": "text/xml; charset=utf-8",
			},
		});
	}
}