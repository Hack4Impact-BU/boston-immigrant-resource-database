import twilio, { Twilio } from "twilio";

import {
	normalizePhoneNumber,
	getServicesByPhoneNumber,
	type ServiceWithProviderContact,
	type ServiceUpdateInput,
	updateService,
} from "@/app/api/airtable";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const UPDATABLE_FIELDS: Array<{
	key: keyof ServiceUpdateInput;
	label: string;
	aliases: string[];
}> = [
	{ key: "name", label: "name", aliases: ["NAME", "SERVICE NAME", "TITLE"] },
	{ key: "description", label: "description", aliases: ["DESCRIPTION", "ABOUT"] },
	{ key: "status", label: "status", aliases: ["STATUS"] },
	{ key: "link", label: "link", aliases: ["LINK", "URL", "WEBSITE"] },
];

type ServiceReplyContext = {
	service: ServiceWithProviderContact;
	messageWithoutServiceName: string;
};

export type WeeklySmsCampaignResult = {
	attempted: number;
	sent: number;
	skipped: number;
	errors: Array<{ providerId: string; reason: string }>;
};

export type SmsReplyResult = {
	reply: string;
	updatedProviderIds: string[];
};

function getTwilioClient(): Twilio {
	if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
		throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required.");
	}

	return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function getTwilioSender(): string {
	if (!TWILIO_PHONE_NUMBER) {
		throw new Error("TWILIO_PHONE_NUMBER is required.");
	}

	return TWILIO_PHONE_NUMBER;
}


function getPreferredRecipientPhone(service: ServiceWithProviderContact): string {
	const primaryPhone = service.provider_primary_phone_number.trim();
	if (primaryPhone) {
		return primaryPhone;
	}

	return service.provider_secondary_phone_number.trim();
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildServiceNamePattern(serviceName: string): RegExp {
	const trimmedName = serviceName.trim();
	const namePattern = trimmedName
		.split(/\s+/)
		.map((part) => escapeRegex(part))
		.join("\\s+");

	return new RegExp(`^${namePattern}(?:$|[\\s:=-])`, "i");
}

function normalizeMessage(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

function buildServiceReplyContext(body: string, services: ServiceWithProviderContact[]): ServiceReplyContext | null {
	const trimmedBody = body.trim();
	if (!trimmedBody) {
		return null;
	}

	const sortedServices = [...services].sort((left, right) => right.name.length - left.name.length);

	for (const service of sortedServices) {
		const servicePattern = buildServiceNamePattern(service.name);
		const match = trimmedBody.match(servicePattern);

		if (!match) {
			continue;
		}

		const remainder = trimmedBody.slice(match[0].length).trimStart();
		return {
			service,
			messageWithoutServiceName: remainder,
		};
	}

	if (services.length === 1) {
		return {
			service: services[0],
			messageWithoutServiceName: trimmedBody,
		};
	}

	return null;
}

function formatServiceReplyInstructions(service: ServiceWithProviderContact): string {
	return [
		`Reply with the exact service name first, then your message.`,
		`Example: ${service.name} 1`,
		`Example: ${service.name} STATUS: Open`,
	].join("\n");
}

function formatWeeklyUpdateMessage(service: ServiceWithProviderContact): string {
	const lines = [
		`Hi ${service.provider_name || "provider"}, this is your weekly BIRD service update.`,
		`Service: ${service.name}`,
		service.status ? `Current status: ${service.status}` : null,
		service.description ? `Description: ${service.description}` : null,
		service.service_types ? `Service types: ${service.service_types}` : null,
		service.link ? `Link: ${service.link}` : null,
		"Reply 1 to confirm this service is current.",
		"Reply 2 to update this service.",
		"Reply 3 to stop weekly reminders for this service.",
		`To update this service, reply with the exact service name first, then FIELD: value or 1/2/3.`,
	];

	return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function formatUpdateInstructions(service: ServiceWithProviderContact): string {
	const fields = UPDATABLE_FIELDS.map((field) => field.label).join(", ");

	return [
		`To update ${service.name}, reply with one field per message in the format FIELD: value.`,
		`You can update: ${fields}.`,
		`Start your reply with the exact service name: ${service.name}`,
		"Examples:",
		`STATUS: Open`,
		`DESCRIPTION: Updated description`,
		`LINK: https://example.org`,
		`NAME: Updated service name`,
	].join("\n");
}

function formatConfirmationMessage(service: ServiceWithProviderContact): string {
	return [
		`Thanks for confirming ${service.name} is current.`,
		`Reply 2 anytime to make changes or send the exact service name followed by FIELD: value to update directly.`,
	].join("\n");
}

function formatOptOutMessage(service: ServiceWithProviderContact): string {
	return [
		`You will no longer receive weekly reminders for ${service.name}.`,
		"Reply START to resume messages later.",
	].join("\n");
}

function formatUnknownMessage(service: ServiceWithProviderContact): string {
	return [
		`We could not understand that reply for ${service.name}.`,
		formatUpdateInstructions(service),
	].join("\n\n");
}

function parseServiceUpdates(body: string): ServiceUpdateInput {
	const normalizedBody = body.trim();
	const updates: ServiceUpdateInput = {};

	const entries = normalizedBody
		.split(/(?:\r?\n|;)+/)
		.map((entry) => entry.trim())
		.filter(Boolean);

	for (const entry of entries) {
		const separatorIndex = entry.indexOf(":") >= 0 ? entry.indexOf(":") : entry.indexOf("=");

		if (separatorIndex < 0) {
			continue;
		}

		const rawField = entry.slice(0, separatorIndex).trim().toUpperCase();
		const rawValue = entry.slice(separatorIndex + 1).trim();

		if (!rawField || !rawValue) {
			continue;
		}

		const field = UPDATABLE_FIELDS.find((candidate) => candidate.aliases.includes(rawField));
		if (!field) {
			continue;
		}

		updates[field.key] = rawValue;
	}

	return updates;
}

export function buildTwilioXmlResponse(message: string): string {
	const response = new twilio.twiml.MessagingResponse();
	response.message(message);
	return response.toString();
}

export async function sendWeeklyUpdateToService(service: ServiceWithProviderContact): Promise<{ sent: boolean; reason?: string }> {
	const to = getPreferredRecipientPhone(service);

	if (!to) {
		return { sent: false, reason: "Service provider has no phone number on file." };
	}

	const client = getTwilioClient();
	const from = getTwilioSender();

	await client.messages.create({
		body: formatWeeklyUpdateMessage(service),
		from,
		to,
	});

	return { sent: true };
}

export async function sendWeeklyUpdatesToProviders(services: ServiceWithProviderContact[]): Promise<WeeklySmsCampaignResult> {
	const result: WeeklySmsCampaignResult = {
		attempted: services.length,
		sent: 0,
		skipped: 0,
		errors: [],
	};

	for (const service of services) {
		try {
			const response = await sendWeeklyUpdateToService(service);
			if (response.sent) {
				result.sent += 1;
			} else {
				result.skipped += 1;
			}
		} catch (error) {
			result.errors.push({
				providerId: service.id,
				reason: error instanceof Error ? error.message : "Unknown Twilio error",
			});
		}
	}

	return result;
}

export async function handleInboundProviderSms(from: string, body: string): Promise<SmsReplyResult> {
	const services = await getServicesByPhoneNumber(from);

	if (services.length === 0) {
		return {
			reply: "We could not match this number to a provider service record.",
			updatedProviderIds: [],
		};
	}

	const replyContext = buildServiceReplyContext(body, services);
	const matchedService = replyContext?.service ?? null;

	if (!matchedService) {
		return {
			reply: services.length > 1
				? `This phone number matches multiple service records. Please reply with the exact service name first. ${formatServiceReplyInstructions(services[0])}`
				: "We could not match this reply to a service record.",
			updatedProviderIds: [],
		};
	}

	const provider = matchedService;
	const normalizedBody = normalizeMessage(replyContext?.messageWithoutServiceName ?? body).toUpperCase();

	if (!normalizedBody) {
		return {
			reply: formatUpdateInstructions(provider),
			updatedProviderIds: [],
		};
	}

	if (normalizedBody === "1" || normalizedBody === "CONFIRM" || normalizedBody === "YES") {
		return {
			reply: formatConfirmationMessage(provider),
			updatedProviderIds: [],
		};
	}

	if (normalizedBody === "2" || normalizedBody === "UPDATE") {
		return {
			reply: formatUpdateInstructions(provider),
			updatedProviderIds: [],
		};
	}

	if (normalizedBody === "3" || normalizedBody === "STOP" || normalizedBody === "UNSUBSCRIBE") {
		return {
			reply: formatOptOutMessage(provider),
			updatedProviderIds: [],
		};
	}

	const updates = parseServiceUpdates(replyContext?.messageWithoutServiceName ?? body);
	if (Object.keys(updates).length === 0) {
		return {
			reply: formatUnknownMessage(provider),
			updatedProviderIds: [],
		};
	}

	await updateService(provider.id, updates);

	return {
		reply: [
			`Updated ${provider.name} successfully.`,
			`Reply 2 for more changes or send the exact service name followed by FIELD: value.`,
		].join("\n"),
		updatedProviderIds: [provider.id],
	};
}

export function normalizeSmsBody(body: string | null | undefined): string {
	return (body ?? "").trim();
}

export function normalizeSmsFrom(from: string | null | undefined): string {
	return normalizePhoneNumber(from ?? "");
}