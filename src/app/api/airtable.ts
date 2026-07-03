import Airtable, { FieldSet, Record } from "airtable";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appKHrrX5ekPYIQBm";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY!,
}).base(AIRTABLE_BASE_ID);

export interface Provider {
  id: string;
  name: string;
  email: string;
  primary_phone_number: string;
  secondary_phone_number: string;
  address: string;
  status?: string;
  website: string;
  google_maps_link: string;
  service_types?: string;
  description: string;
  language_support: string[];
  services: string;
  logo: string;
}

export type ProviderUpdateInput = Partial<{
  name: string;
  email: string;
  primary_phone_number: string;
  secondary_phone_number: string;
  address: string;
  website: string;
  description: string;
  services: string;
  status: string;
}>;

export interface Service {
  id: string;
  name: string;
  provider: string;
  description?: string;
  status: string;
  link?: string;
  service_types: string;
  provider_email: string;
  provider_record_ID: string;
  last_modified?: string;
}

export type ServiceUpdateInput = Partial<{
  name: string;
  description: string;
  status: string;
  link: string;
}>;

export type ServiceWithProviderContact = Service & {
  provider_name: string;
  provider_email: string;
  provider_primary_phone_number: string;
  provider_secondary_phone_number: string;
};

function normalizeLinkedRecordId(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function normalizeLinkedRecordIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }

  return typeof value === "string" && value ? [value] : [];
}

function getAttachmentUrl(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    const attachment = value[0] as { url?: unknown };
    return typeof attachment.url === "string" ? attachment.url : "";
  }

  return typeof value === "string" ? value : "";
}

function getLastModifiedValue(record: Record<FieldSet>) {
  const value = record.get("Last modified time") ?? record.get("Last Modified");

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value.trim() : parsedDate.toISOString();
  }

  return "";
}

function getDisplayFieldValue(record: Record<FieldSet>, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const value = record.get(fieldName);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const fields = (record as Record<string, unknown>).fields ?? {};
  for (const value of Object.values(fields)) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const joinedValue = value.filter((entry): entry is string => typeof entry === "string" && entry.trim()).join(", ");
      if (joinedValue) {
        return joinedValue;
      }
    }
  }

  return record.id;
}

function getDisplayNameById(records: Record<FieldSet>[]) {
  return new Map(
    records.map((record) => [record.id, getDisplayFieldValue(record, ["Name", "Service Type", "Title"])])
  );
}

function toProvider(r: Record<FieldSet>, languageNameById: Map<string, string>): Provider {
  const languageSupportIds = normalizeLinkedRecordIds(r.get("Language Support"));

  return {
    id: r.id,
    name: r.get("Name") as string,
    email: r.get("Email") as string,
    primary_phone_number: r.get("Primary Phone Number") as string,
    secondary_phone_number: r.get("Secondary Phone Number") as string,
    address: r.get("Address") as string,
    website: r.get("Website") as string,
    google_maps_link: r.get("Google Maps Link") as string,
    description: r.get("Description") as string,
    services: r.get("Services") as string,
    language_support: languageSupportIds.map((languageId) => languageNameById.get(languageId) || languageId),
    logo: getAttachmentUrl(r.get("Logo")),
    status: r.get("Status") as string | undefined,
  };
}

function toProviderUpdateFields(input: ProviderUpdateInput): Record<string, string> {
  const fields: Record<string, string> = {};

  if (typeof input.name === "string") fields.Name = input.name;
  if (typeof input.email === "string") fields.Email = input.email;
  if (typeof input.primary_phone_number === "string") fields["Primary Phone Number"] = input.primary_phone_number;
  if (typeof input.secondary_phone_number === "string") fields["Secondary Phone Number"] = input.secondary_phone_number;
  if (typeof input.address === "string") fields.Address = input.address;
  if (typeof input.website === "string") fields.Website = input.website;
  if (typeof input.description === "string") fields.Description = input.description;
  if (typeof input.services === "string") fields.Services = input.services;
  if (typeof input.status === "string") fields.Status = input.status;

  return fields;
}

function toService(r: Record<FieldSet>): Service {
  const providerRecordId = normalizeLinkedRecordId(r.get("Providers")) || normalizeLinkedRecordId(r.get("Provider RECORD ID"));

  return {
    id: r.id,
    provider: providerRecordId,
    provider_email: r.get("Provider Email") as string,
    service_types: normalizeLinkedRecordIds(r.get("Service Types")).join(", "),
    name: r.get("Name") as string,
    description: r.get("Description") as string | undefined,
    status: r.get("Status") as string,
    link: r.get("Link") as string | undefined,
    provider_record_ID: providerRecordId,
    last_modified: getLastModifiedValue(r),
  };
}

function toServiceUpdateFields(input: ServiceUpdateInput): Record<string, string> {
  const fields: Record<string, string> = {};

  if (typeof input.name === "string") fields.Name = input.name;
  if (typeof input.description === "string") fields.Description = input.description;
  if (typeof input.status === "string") fields.Status = input.status;
  if (typeof input.link === "string") fields.Link = input.link;

  return fields;
}

export async function getAllProviders(): Promise<Provider[]> {
  const [providerRecords, languageRecords] = await Promise.all([
    base("Providers").select({ view: "Grid view" }).all(),
    base("Languages").select({ view: "Grid view" }).all(),
  ]);

  const languageNameById = new Map(
    languageRecords.map((record) => [record.id, getDisplayFieldValue(record, ["Name", "Language", "Title"])])
  );

  return providerRecords.map((record) => toProvider(record, languageNameById));
}

export async function getProvidersWithPhoneNumbers(): Promise<Provider[]> {
  const providers = await getAllProviders();

  return providers.filter((provider) => Boolean(provider.primary_phone_number.trim() || provider.secondary_phone_number.trim()));
}

export async function getProviderById(id: string): Promise<Provider | null> {
  try {
    const [providerRecord, languageRecords] = await Promise.all([
      base("Providers").find(id),
      base("Languages").select({ view: "Grid view" }).all(),
    ]);

    const languageNameById = new Map(
      languageRecords.map((record) => [record.id, getDisplayFieldValue(record, ["Name", "Language", "Title"])])
    );

    return toProvider(providerRecord, languageNameById);
  } catch {
    return null;
  }
}

export async function getProvidersByPhoneNumber(phoneNumber: string): Promise<Provider[]> {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return [];
  }

  const providers = await getAllProviders();

  return providers.filter((provider) => {
    return [provider.primary_phone_number, provider.secondary_phone_number].some((value) => {
      return normalizePhoneNumber(value) === normalizedPhoneNumber;
    });
  });
}

export async function updateProvider(providerId: string, input: ProviderUpdateInput): Promise<void> {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error("AIRTABLE_API_KEY is not set.");
  }

  const fields = toProviderUpdateFields(input);

  if (Object.keys(fields).length === 0) {
    return;
  }

  await base("Providers").update(providerId, fields, { typecast: true });
}

export function normalizePhoneNumber(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return `1${digits}`;
  }

  return digits;
}

export async function getAllServices(): Promise<Service[]> {
  const [serviceRecords, serviceTypeRecords] = await Promise.all([
    base("Services").select({ view: "Grid view" }).all(),
    base("Service Types").select({ view: "Grid view" }).all(),
  ]);

  const serviceTypeNameById = getDisplayNameById(serviceTypeRecords);

  return serviceRecords.map((record) => {
    const service = toService(record);
    const serviceTypeIds = normalizeLinkedRecordIds(record.get("Service Types"));

    return {
      ...service,
      service_types: serviceTypeIds.map((serviceTypeId) => serviceTypeNameById.get(serviceTypeId) || serviceTypeId).join(", "),
    };
  });
}

export async function getAllServicesWithProviderContacts(): Promise<ServiceWithProviderContact[]> {
  const [services, providers] = await Promise.all([getAllServices(), getAllProviders()]);
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));

  return services.map((service) => {
    const provider = providerById.get(service.provider_record_ID) ?? providerById.get(service.provider);

    return {
      ...service,
      provider_name: provider?.name ?? "",
      provider_email: provider?.email ?? service.provider_email,
      provider_primary_phone_number: provider?.primary_phone_number ?? "",
      provider_secondary_phone_number: provider?.secondary_phone_number ?? "",
    };
  });
}

export async function getServicesByPhoneNumber(phoneNumber: string): Promise<ServiceWithProviderContact[]> {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return [];
  }

  const services = await getAllServicesWithProviderContacts();

  return services.filter((service) => {
    return [service.provider_primary_phone_number, service.provider_secondary_phone_number].some((value) => {
      return normalizePhoneNumber(value) === normalizedPhoneNumber;
    });
  });
}

export async function updateService(serviceId: string, input: ServiceUpdateInput): Promise<void> {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error("AIRTABLE_API_KEY is not set.");
  }

  const fields = toServiceUpdateFields(input);

  if (Object.keys(fields).length === 0) {
    return;
  }

  await base("Services").update(serviceId, fields, { typecast: true });
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const [serviceRecord, serviceTypeRecords] = await Promise.all([
      base("Services").find(id),
      base("Service Types").select({ view: "Grid view" }).all(),
    ]);

    const serviceTypeNameById = getDisplayNameById(serviceTypeRecords);
    const serviceTypeIds = normalizeLinkedRecordIds(serviceRecord.get("Service Types"));

    return {
      ...toService(serviceRecord),
      service_types: serviceTypeIds.map((serviceTypeId) => serviceTypeNameById.get(serviceTypeId) || serviceTypeId).join(", "),
    };
  } catch {
    return null;
  }
}