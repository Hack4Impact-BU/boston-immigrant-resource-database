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