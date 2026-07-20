import Airtable from "airtable";

const AIRTABLE_CONTACT_US_TABLE_NAME = "Contact Us Requests";
const AIRTABLE_CLIENT_REFERRALS_TABLE_NAME = "Client Referrals";
const AIRTABLE_USER_TABLE_NAME = "User";

type ContactUsRequestFieldSet = {
	Organization: string;
	"First Name": string;
	"Last Name": string;
	"Primary Reason For Contact": string;
	"Preferred Method of Contact": string;
	Email: string;
	Phone: string;
	Message: string;
};

type ClientReferralFieldSet = {
	Message: string;
	"Services copy"?: string[];
	"Target Provider Preselected"?: string;
	"Target Service"?: string[];
	"Target Service Preselected"?: string;
};

export type UserAccessStatus = "approved" | "pending" | "rejected" | "error" | "no config";

type UserFieldSet = {
	clerkUserId: string;
	organizationName: string;
	website: string;
	phoneNumber: string;
	email: string;
	access?: UserAccessStatus | UserAccessStatus[];
	Access?: UserAccessStatus | UserAccessStatus[];
};

export type CreateContactUsRequestInput = {
	organizationName: string;
	firstName: string;
	lastName: string;
	primaryReasonForContact: string;
	preferredMethodOfContact: string;
	email: string;
	phoneNumber: string;
	message: string;
};

export type CreateContactUsRequestResult = {
	id: string;
};

export type CreateClientReferralInput = {
	message: string;
	servicesCopyRecordIds?: string[];
	targetProviderRecordId?: string;
	targetServiceRecordIds?: string[];
	targetServicePreselected?: string;
};

export type CreateClientReferralResult = {
	id: string;
};

export type CreateUserInput = {
	clerkUserId: string;
	organizationName: string;
	website: string;
	phoneNumber: string;
	email: string;
};

export type CreateUserResult = {
	id: string;
};

function getAirtableApiKey() {
	return process.env.AIRTABLE_API_KEY;
}

function getAirtableBaseId() {
	return process.env.AIRTABLE_BASE_ID;
}

function requireAirtableConfig() {
	const apiKey = getAirtableApiKey();
	const baseId = getAirtableBaseId();

	if (!apiKey) {
		throw new Error("AIRTABLE_API_KEY is not set.");
	}

	if (!baseId) {
		throw new Error("AIRTABLE_BASE_ID is not set.");
	}

	return { apiKey, baseId };
}

function hasAirtableConfig() {
	return Boolean(getAirtableApiKey() && getAirtableBaseId());
}

function getAirtableBase() {
	const { apiKey, baseId } = requireAirtableConfig();

	return new Airtable({ apiKey }).base(baseId);
}

function getContactUsRequestsTable() {
	return getAirtableBase()(AIRTABLE_CONTACT_US_TABLE_NAME) as Airtable.Table<ContactUsRequestFieldSet>;
}

function getClientReferralsTable() {
	return getAirtableBase()(AIRTABLE_CLIENT_REFERRALS_TABLE_NAME) as Airtable.Table<ClientReferralFieldSet>;
}

function getUserTable() {
	return getAirtableBase()(AIRTABLE_USER_TABLE_NAME) as Airtable.Table<UserFieldSet>;
}

function escapeAirtableFormulaValue(value: string) {
	return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function normalizeUserAccessStatus(value: unknown): UserAccessStatus {
	const accessValue = Array.isArray(value) ? value[0] : value;

	if (typeof accessValue !== "string") {
		return "pending";
	}

	const normalizedValue = accessValue.trim().toLowerCase();

	if (
		normalizedValue === "approved" ||
		normalizedValue === "pending" ||
		normalizedValue === "rejected"
	) {
		return normalizedValue;
	}

	return "pending";
}

function chooseUserAccessStatus(records: ReadonlyArray<Airtable.Record<UserFieldSet>>) {
	const statuses = records.map((record) =>
		normalizeUserAccessStatus(record.get("access") ?? record.get("Access")),
	);

	if (statuses.includes("approved")) {
		return "approved";
	}

	if (statuses.includes("rejected")) {
		return "rejected";
	}

	return "pending";
}

export async function createContactUsRequest(
	input: CreateContactUsRequestInput,
): Promise<CreateContactUsRequestResult> {
	const record = await getContactUsRequestsTable().create(
		{
			Organization: input.organizationName,
			"First Name": input.firstName,
			"Last Name": input.lastName,
			"Primary Reason For Contact": input.primaryReasonForContact,
			"Preferred Method of Contact": input.preferredMethodOfContact,
			Email: input.email,
			Phone: input.phoneNumber,
			Message: input.message,
		},
		{ typecast: true },
	);

	return { id: record.id };
}

export async function createClientReferral(
	input: CreateClientReferralInput,
): Promise<CreateClientReferralResult> {
	const record = await getClientReferralsTable().create(
		{
			Message: input.message,
			"Services copy": input.servicesCopyRecordIds,
			"Target Provider Preselected": input.targetProviderRecordId,
			"Target Service": input.targetServiceRecordIds,
			"Target Service Preselected": input.targetServicePreselected,
		},
		{ typecast: true },
	);

	return { id: record.id };
}

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
	const record = await getUserTable().create(
		{
			clerkUserId: input.clerkUserId,
			organizationName: input.organizationName,
			website: input.website,
			phoneNumber: input.phoneNumber,
			email: input.email,
			access: "pending",
		},
		{ typecast: true },
	);

	return { id: record.id };
}

export async function getUserAccessStatus(clerkUserId: string): Promise<UserAccessStatus> {
	if (!hasAirtableConfig()) {
		return "no config";
	}

	try {
		const records = await getUserTable()
			.select({
				filterByFormula: `{clerkUserId} = '${escapeAirtableFormulaValue(clerkUserId)}'`,
				maxRecords: 10,
			})
			.all();

		return chooseUserAccessStatus(records);
	} catch {
		return "error";
	}
}
