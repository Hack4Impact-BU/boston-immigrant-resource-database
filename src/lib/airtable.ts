import Airtable from "airtable";

const AIRTABLE_BASE_ID = "appKHrrX5ekPYIQBm";
const AIRTABLE_CONTACT_US_TABLE_NAME = "Contact Us Requests";
const AIRTABLE_CLIENT_REFERRALS_TABLE_NAME = "Client Referrals";
const AIRTABLE_USER_TABLE_NAME = "User";

const airtableClient = new Airtable({
	apiKey: process.env.AIRTABLE_API_KEY,
});

const base = airtableClient.base(AIRTABLE_BASE_ID);

const contactUsRequestsTable: Airtable.Table<ContactUsRequestFieldSet> =
	base(AIRTABLE_CONTACT_US_TABLE_NAME) as Airtable.Table<ContactUsRequestFieldSet>;

const clientReferralsTable: Airtable.Table<ClientReferralFieldSet> =
	base(AIRTABLE_CLIENT_REFERRALS_TABLE_NAME) as Airtable.Table<ClientReferralFieldSet>;

const userTable: Airtable.Table<UserFieldSet> = base(
	AIRTABLE_USER_TABLE_NAME,
) as Airtable.Table<UserFieldSet>;

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

type UserFieldSet = {
	clerkUserId: string;
	organizationName: string;
	website: string;
	phoneNumber: string;
	email: string;
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

function requireAirtableApiKey() {
	if (!process.env.AIRTABLE_API_KEY) {
		throw new Error("AIRTABLE_API_KEY is not set.");
	}
}

export async function createContactUsRequest(
	input: CreateContactUsRequestInput,
): Promise<CreateContactUsRequestResult> {
	requireAirtableApiKey();

	const record = await contactUsRequestsTable.create(
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
	requireAirtableApiKey();

	const record = await clientReferralsTable.create(
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
	requireAirtableApiKey();

	const record = await userTable.create(
		{
			clerkUserId: input.clerkUserId,
			organizationName: input.organizationName,
			website: input.website,
			phoneNumber: input.phoneNumber,
			email: input.email,
		},
		{ typecast: true },
	);

	return { id: record.id };
}
