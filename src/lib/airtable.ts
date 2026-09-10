import Airtable from "airtable";

const AIRTABLE_CONTACT_US_TABLE_NAME = "Contact Us Requests";
const AIRTABLE_CLIENT_REFERRALS_TABLE_NAME = "Client Referrals";
const AIRTABLE_USER_TABLE_NAME = "User";
const AIRTABLE_OLD_SOFTR_USERS_TABLE_NAME = "Old Softr Users";

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
	firstName: string;
	lastName: string;
	organizationName: string;
	website: string;
	phoneNumber: string;
	email: string;
	access?: UserAccessStatus | UserAccessStatus[];
	Access?: UserAccessStatus | UserAccessStatus[];
	providerId?: string;
	userRole?: string;
};

type OldSoftrUserStatus = "Not Migrated" | "New User Created";

type OldSoftrUserFieldSet = {
	Email: string;
	Status?: OldSoftrUserStatus | OldSoftrUserStatus[];
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
	firstName: string;
	lastName: string;
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

function getOldSoftrUsersTable() {
	return getAirtableBase()(AIRTABLE_OLD_SOFTR_USERS_TABLE_NAME) as Airtable.Table<OldSoftrUserFieldSet>;
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
			firstName: input.firstName,
			lastName: input.lastName,
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

export async function getUserOrganizationName(clerkUserId: string): Promise<string | null> {
	if (!hasAirtableConfig()) {
		return null;
	}

	try {
		const records = await getUserTable()
			.select({
				filterByFormula: `{clerkUserId} = '${escapeAirtableFormulaValue(clerkUserId)}'`,
				maxRecords: 1,
			})
			.all();

		const organizationName = records[0]?.get("organizationName");

		return typeof organizationName === "string" && organizationName.trim()
			? organizationName.trim()
			: null;
	} catch {
		return null;
	}
}

/**
 * Looks up the Providers-table record ID linked to this Clerk account, if any has
 * been set yet. Returns null if unset, misconfigured, or the User record can't be found.
 *
 * There is no automatic email/domain matching here by design: a person registering an
 * account is not guaranteed to share the exact contact email already on file for their
 * organization's existing Provider listing, so the link is only ever set explicitly
 * (see linkUserToProvider) rather than inferred.
 */
export async function getUserProviderId(clerkUserId: string): Promise<string | null> {
	if (!hasAirtableConfig()) {
		return null;
	}

	try {
		const records = await getUserTable()
			.select({
				filterByFormula: `{clerkUserId} = '${escapeAirtableFormulaValue(clerkUserId)}'`,
				maxRecords: 1,
			})
			.all();

		const providerId = records[0]?.get("providerId");

		return typeof providerId === "string" && providerId.trim() ? providerId.trim() : null;
	} catch {
		return null;
	}
}

/**
 * Persists which Provider record this Clerk account manages. Throws if the User
 * record can't be found, since a silent no-op here would be confusing to debug later.
 */
export async function linkUserToProvider(clerkUserId: string, providerId: string): Promise<void> {
	const records = await getUserTable()
		.select({
			filterByFormula: `{clerkUserId} = '${escapeAirtableFormulaValue(clerkUserId)}'`,
			maxRecords: 1,
		})
		.all();

	const userRecord = records[0];

	if (!userRecord) {
		throw new Error("Could not find a User record for this account.");
	}

	await getUserTable().update(userRecord.id, { providerId }, { typecast: true });
}

export async function getUserEmail(clerkUserId: string): Promise<string | null> {
	if (!hasAirtableConfig()) {
		return null;
	}

	try {
		const records = await getUserTable()
			.select({
				filterByFormula: `{clerkUserId} = '${escapeAirtableFormulaValue(clerkUserId)}'`,
				maxRecords: 1,
			})
			.all();

		const email = records[0]?.get("email");

		return typeof email === "string" && email.trim() ? email.trim() : null;
	} catch {
		return null;
	}
}

/**
 * True if this email belongs to a provider who already had an account on the old
 * Softr-built site — regardless of their migration Status, since either value
 * ("Not Migrated" or "New User Created") means they already completed the
 * application/MOU process once and shouldn't be asked to redo it.
 */
export async function isOldSoftrUser(email: string): Promise<boolean> {
	if (!hasAirtableConfig() || !email.trim()) {
		return false;
	}

	try {
		const records = await getOldSoftrUsersTable()
			.select({
				filterByFormula: `LOWER({Email}) = '${escapeAirtableFormulaValue(email.trim().toLowerCase())}'`,
				maxRecords: 1,
			})
			.all();

		return records.length > 0;
	} catch {
		return false;
	}
}

/**
 * Flips a matching Old Softr Users record to "New User Created" once that person
 * actually registers on the new site. Silently does nothing if there's no match or
 * Airtable isn't configured — this is a bookkeeping side effect of registration, not
 * something that should ever block or fail the registration itself.
 */
export async function markOldSoftrUserAsMigrated(email: string): Promise<void> {
	if (!hasAirtableConfig() || !email.trim()) {
		return;
	}

	try {
		const records = await getOldSoftrUsersTable()
			.select({
				filterByFormula: `LOWER({Email}) = '${escapeAirtableFormulaValue(email.trim().toLowerCase())}'`,
				maxRecords: 1,
			})
			.all();

		const matchingRecord = records[0];

		if (!matchingRecord) {
			return;
		}

		await getOldSoftrUsersTable().update(matchingRecord.id, { Status: "New User Created" }, { typecast: true });
	} catch {
		// Bookkeeping only — never let a failure here surface as a registration error.
	}
}
