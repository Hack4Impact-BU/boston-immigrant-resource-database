import Airtable from "airtable";

const AIRTABLE_CONTACT_US_TABLE_NAME = "Contact Us Requests";
const AIRTABLE_CLIENT_REFERRALS_TABLE_NAME = "Client Referrals";
const AIRTABLE_USER_TABLE_NAME = "User";
const AIRTABLE_OLD_SOFTR_USERS_TABLE_NAME = "Old Softr Users";
const AIRTABLE_USER_FEEDBACK_TABLE_NAME = "User Support / Feedback";

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
	userRole?: string | string[];
};

type UserFeedbackFieldSet = {
	"Feedback Date": string;
	Status: string;
	"Submitted By": string;
	Email: string;
	"Email Entered": string;
	"Feedback Type": string;
	"Feedback Text": string;
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
	userRole?: string | null;
};

export type CreateUserResult = {
	id: string;
};

/**
 * The full set of fields shown in the Admin "Manage Users" table, including the
 * three the Admin can see but never edit there: clerkUserId, providerId, and
 * createdTime (Airtable's own record-creation timestamp, not a custom field —
 * every record has this regardless of table schema, via the API's createdTime).
 */
export type AdminUserRecord = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	organizationName: string;
	website: string;
	phoneNumber: string;
	userRole: string;
	access: UserAccessStatus;
	clerkUserId: string;
	providerId: string;
	createdTime: string;
};

export const ADMIN_USER_ROLE_OPTIONS = ["Admin", "Provider", "Viewer"] as const;
export const ADMIN_USER_ACCESS_OPTIONS: readonly UserAccessStatus[] = ["approved", "pending", "rejected"];

export type UpdateUserAsAdminInput = {
	email?: string;
	firstName?: string;
	lastName?: string;
	organizationName?: string;
	website?: string;
	phoneNumber?: string;
	userRole?: string;
	access?: UserAccessStatus;
};

function toDisplayString(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value)) {
		return typeof value[0] === "string" ? value[0] : "";
	}

	return "";
}

/**
 * All User-table records, for the Admin-only "Manage Users" table. Callers are
 * responsible for verifying the caller is actually an Admin before invoking this —
 * this function itself does not check, since it's a plain data-access helper.
 */
export async function getAllUsersForAdmin(): Promise<AdminUserRecord[]> {
	const records = await getUserTable().select().all();

	return records.map((record) => ({
		id: record.id,
		email: toDisplayString(record.get("email")),
		firstName: toDisplayString(record.get("firstName")),
		lastName: toDisplayString(record.get("lastName")),
		organizationName: toDisplayString(record.get("organizationName")),
		website: toDisplayString(record.get("website")),
		phoneNumber: toDisplayString(record.get("phoneNumber")),
		userRole: toDisplayString(record.get("userRole")),
		access: normalizeUserAccessStatus(record.get("access") ?? record.get("Access")),
		clerkUserId: toDisplayString(record.get("clerkUserId")),
		providerId: toDisplayString(record.get("providerId")),
		// Airtable's own record-creation timestamp — always present on every
		// record via the API response, independent of any custom field.
		createdTime: typeof (record._rawJson as { createdTime?: string })?.createdTime === "string"
			? (record._rawJson as { createdTime: string }).createdTime
			: "",
	}));
}

/**
 * Updates one User record's editable fields as an Admin. Callers are responsible
 * for verifying the caller is actually an Admin, and for validating userRole/access
 * against the allowed option lists, before invoking this — this function itself
 * does not check either, since it's a plain data-access helper, not the security
 * boundary (see updateUserAction in the Server Action layer for both).
 */
export async function updateUserAsAdmin(recordId: string, input: UpdateUserAsAdminInput): Promise<void> {
	const fields: Partial<UserFieldSet> = {};

	if (input.email !== undefined) fields.email = input.email;
	if (input.firstName !== undefined) fields.firstName = input.firstName;
	if (input.lastName !== undefined) fields.lastName = input.lastName;
	if (input.organizationName !== undefined) fields.organizationName = input.organizationName;
	if (input.website !== undefined) fields.website = input.website;
	if (input.phoneNumber !== undefined) fields.phoneNumber = input.phoneNumber;
	// The airtable package's own FieldSet type doesn't model null as a valid
	// value, but Airtable's real API does accept it to clear a Single Select
	// field — an empty string is not equivalent and may be rejected instead.
	if (input.userRole !== undefined) {
		fields.userRole = (input.userRole === "" ? null : input.userRole) as string | undefined;
	}
	if (input.access !== undefined) fields.access = input.access;

	await getUserTable().update(recordId, fields, { typecast: true });
}

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

function getUserFeedbackTable() {
	return getAirtableBase()(AIRTABLE_USER_FEEDBACK_TABLE_NAME) as Airtable.Table<UserFeedbackFieldSet>;
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

export type CreateUserFeedbackInput = {
	name: string;
	email: string;
	emailEntered: string;
	feedbackType: string;
	feedbackText: string;
};

export type CreateUserFeedbackResult = {
	id: string;
};

export async function createUserFeedback(input: CreateUserFeedbackInput): Promise<CreateUserFeedbackResult> {
	const record = await getUserFeedbackTable().create(
		{
			"Feedback Date": new Date().toISOString(),
			Status: "Needs Review",
			"Submitted By": input.name,
			Email: input.email,
			"Email Entered": input.emailEntered,
			"Feedback Type": input.feedbackType,
			"Feedback Text": input.feedbackText,
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

/**
 * Airtable's 40 single-select option colors, as CSS rgb() values. Transcribed
 * from Airtable's own open-source blocks SDK (github.com/Airtable/blocks,
 * packages/sdk/src/colors.ts) rather than approximated, so these match exactly
 * what the Airtable UI itself renders for each named color.
 */
const AIRTABLE_COLOR_RGB: Record<string, string> = {
	blueLight2: "rgb(207, 223, 255)", blueLight1: "rgb(156, 199, 255)", blue: "rgb(18, 131, 218)",
	blueBright: "rgb(45, 127, 249)", blueDark1: "rgb(39, 80, 174)",
	cyanLight2: "rgb(208, 240, 253)", cyanLight1: "rgb(119, 209, 243)", cyan: "rgb(1, 169, 219)",
	cyanBright: "rgb(24, 191, 255)", cyanDark1: "rgb(11, 118, 183)",
	tealLight2: "rgb(194, 245, 233)", tealLight1: "rgb(114, 221, 195)", teal: "rgb(2, 170, 164)",
	tealBright: "rgb(32, 217, 210)", tealDark1: "rgb(6, 160, 155)",
	greenLight2: "rgb(209, 247, 196)", greenLight1: "rgb(147, 224, 136)", green: "rgb(17, 175, 34)",
	greenBright: "rgb(32, 201, 51)", greenDark1: "rgb(51, 138, 23)",
	yellowLight2: "rgb(255, 234, 182)", yellowLight1: "rgb(255, 214, 110)", yellow: "rgb(224, 141, 0)",
	yellowBright: "rgb(252, 180, 0)", yellowDark1: "rgb(184, 117, 3)",
	orangeLight2: "rgb(254, 226, 213)", orangeLight1: "rgb(255, 169, 129)", orange: "rgb(247, 101, 59)",
	orangeBright: "rgb(255, 111, 44)", orangeDark1: "rgb(215, 77, 38)",
	redLight2: "rgb(255, 220, 229)", redLight1: "rgb(255, 158, 183)", red: "rgb(239, 48, 97)",
	redBright: "rgb(248, 43, 96)", redDark1: "rgb(186, 30, 69)",
	pinkLight2: "rgb(255, 218, 246)", pinkLight1: "rgb(249, 157, 226)", pink: "rgb(233, 41, 186)",
	pinkBright: "rgb(255, 8, 194)", pinkDark1: "rgb(178, 21, 139)",
	purpleLight2: "rgb(237, 226, 254)", purpleLight1: "rgb(205, 176, 255)", purple: "rgb(124, 57, 237)",
	purpleBright: "rgb(139, 70, 255)", purpleDark1: "rgb(107, 28, 176)",
	grayLight2: "rgb(238, 238, 238)", grayLight1: "rgb(204, 204, 204)", gray: "rgb(102, 102, 102)",
	grayBright: "rgb(102, 102, 102)", grayDark1: "rgb(68, 68, 68)",
};

export type FieldOptionColors = Record<string, string>;

/**
 * Reads the User table's actual configured single-select colors for the given
 * field names, via Airtable's metadata (schema) API — a different endpoint than
 * the record API the rest of this file uses, requiring a token with schema.bases:read
 * access. Returns an empty map for any field whose colors can't be read (missing
 * scope, network error, field not found, etc.) rather than throwing, since this is
 * a display enhancement, not something that should block the page from rendering.
 */
export async function getUserFieldOptionColors(
	fieldNames: readonly string[],
): Promise<Record<string, FieldOptionColors>> {
	const result: Record<string, FieldOptionColors> = {};

	if (!hasAirtableConfig()) {
		return result;
	}

	try {
		const { apiKey, baseId } = requireAirtableConfig();
		const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			cache: "no-store",
		});

		if (!response.ok) {
			return result;
		}

		const data = (await response.json()) as {
			tables?: Array<{
				name?: string;
				fields?: Array<{
					name?: string;
					options?: { choices?: Array<{ name?: string; color?: string }> };
				}>;
			}>;
		};

		const userTable = data.tables?.find((table) => table.name === AIRTABLE_USER_TABLE_NAME);

		for (const fieldName of fieldNames) {
			const field = userTable?.fields?.find((f) => f.name === fieldName);
			const choices = field?.options?.choices;

			if (!choices) {
				continue;
			}

			const colorsForField: FieldOptionColors = {};

			for (const choice of choices) {
				if (choice.name && choice.color && AIRTABLE_COLOR_RGB[choice.color]) {
					colorsForField[choice.name] = AIRTABLE_COLOR_RGB[choice.color];
				}
			}

			result[fieldName] = colorsForField;
		}

		return result;
	} catch {
		return result;
	}
}

export type AirtableFieldSchema = {
	name: string;
	type: string;
	/** Choice names, for singleSelect/multipleSelects fields; empty otherwise. */
	options: readonly string[];
	/** Choice name -> rgb() color string, for singleSelect/multipleSelects fields. */
	optionColors: FieldOptionColors;
};

/**
 * Reads a table's full field schema (name, type, and for select-type fields
 * their options + Airtable-configured colors) via Airtable's metadata API — the
 * same endpoint getUserFieldOptionColors uses, generalized to any table rather
 * than just User. Returns an empty array if the schema can't be read (missing
 * schema.bases:read scope, network error, table not found, etc.) rather than
 * throwing, since callers should degrade gracefully rather than fail to render.
 */
export async function getTableSchema(tableName: string): Promise<AirtableFieldSchema[]> {
	if (!hasAirtableConfig()) {
		return [];
	}

	try {
		const { apiKey, baseId } = requireAirtableConfig();
		const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			cache: "no-store",
		});

		if (!response.ok) {
			return [];
		}

		const data = (await response.json()) as {
			tables?: Array<{
				name?: string;
				fields?: Array<{
					name?: string;
					type?: string;
					options?: { choices?: Array<{ name?: string; color?: string }> };
				}>;
			}>;
		};

		const table = data.tables?.find((t) => t.name === tableName);

		if (!table?.fields) {
			return [];
		}

		return table.fields
			.filter((field): field is { name: string; type: string; options?: { choices?: Array<{ name?: string; color?: string }> } } =>
				typeof field.name === "string" && typeof field.type === "string",
			)
			.map((field) => {
				const choices = field.options?.choices ?? [];
				const optionColors: FieldOptionColors = {};

				for (const choice of choices) {
					if (choice.name && choice.color && AIRTABLE_COLOR_RGB[choice.color]) {
						optionColors[choice.name] = AIRTABLE_COLOR_RGB[choice.color];
					}
				}

				return {
					name: field.name,
					type: field.type,
					options: choices.map((choice) => choice.name).filter((name): name is string => typeof name === "string"),
					optionColors,
				};
			});
	} catch {
		return [];
	}
}

export type AdminContactRequestRecord = {
	id: string;
	createdTime: string;
	fields: Record<string, unknown>;
};

/**
 * All Contact Us Requests records, for the Admin-only management table. Fields
 * are returned as a raw, dynamic map (not a fixed TypeScript shape) since the
 * columns this tool shows are discovered from the live schema via getTableSchema,
 * not hard-coded. Callers are responsible for verifying the caller is actually
 * an Admin before invoking this — this function itself does not check.
 */
export async function getAllContactUsRequestsForAdmin(): Promise<AdminContactRequestRecord[]> {
	const records = await getContactUsRequestsTable().select().all();

	return records.map((record) => ({
		id: record.id,
		createdTime: typeof (record._rawJson as { createdTime?: string })?.createdTime === "string"
			? (record._rawJson as { createdTime: string }).createdTime
			: "",
		fields: record.fields as Record<string, unknown>,
	}));
}

/**
 * Updates a single field on a single Contact Us Requests record, by field name
 * discovered at runtime rather than a fixed set of known keys — this table's
 * columns aren't hard-coded, so the field name isn't known at compile time.
 * typecast is left off deliberately: for a dynamic tool without a hard-coded
 * list of valid Single Select options, Airtable's own validation (rejecting an
 * unrecognized option) is safer than typecast silently creating a new one from
 * a typo. Callers are responsible for verifying the caller is actually an Admin
 * before invoking this.
 */
export async function updateContactUsRequestField(recordId: string, fieldName: string, value: unknown): Promise<void> {
	await getContactUsRequestsTable().update(recordId, { [fieldName]: value } as Partial<Airtable.FieldSet>);
}

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
	const fields: Partial<UserFieldSet> = {
		clerkUserId: input.clerkUserId,
		firstName: input.firstName,
		lastName: input.lastName,
		organizationName: input.organizationName,
		website: input.website,
		phoneNumber: input.phoneNumber,
		email: input.email,
		access: "pending",
	};

	if (input.userRole) {
		fields.userRole = input.userRole;
	}

	const record = await getUserTable().create(fields, { typecast: true });

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

export async function getUserRole(clerkUserId: string): Promise<string | null> {
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

		const role = records[0]?.get("userRole");

		return typeof role === "string" && role.trim() ? role.trim() : null;
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
 * Fetches the name and email needed to attribute a feedback submission to the
 * current account, in a single lookup rather than three separate ones.
 */
export async function getUserProfileForFeedback(
	clerkUserId: string
): Promise<{ name: string; email: string } | null> {
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

		const userRecord = records[0];

		if (!userRecord) {
			return null;
		}

		const firstName = userRecord.get("firstName");
		const lastName = userRecord.get("lastName");
		const email = userRecord.get("email");

		if (typeof email !== "string" || !email.trim()) {
			return null;
		}

		const name = [firstName, lastName]
			.filter((part): part is string => typeof part === "string" && part.trim().length > 0)
			.join(" ")
			.trim();

		return { name: name || email.trim(), email: email.trim() };
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
 * Returns the role this person committed to on their old Softr-site MOU, if any —
 * so a returning provider's role carries over automatically at sign-up instead of
 * needing to be set manually after the fact. Returns null for brand-new users (no
 * match) or if the matching record's role was never filled in.
 */
export async function getOldSoftrUserRole(email: string): Promise<string | null> {
	if (!hasAirtableConfig() || !email.trim()) {
		return null;
	}

	try {
		const records = await getOldSoftrUsersTable()
			.select({
				filterByFormula: `LOWER({Email}) = '${escapeAirtableFormulaValue(email.trim().toLowerCase())}'`,
				maxRecords: 1,
			})
			.all();

		const role = records[0]?.get("userRole");

		return typeof role === "string" && role.trim() ? role.trim() : null;
	} catch {
		return null;
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
