import { NextResponse } from "next/server";
import { getTableSchema } from "@/lib/airtable";

export async function GET() {
  try {
    const schema = await getTableSchema("Services");
    const statusField = schema.find((field) => field.name === "Status");
    return NextResponse.json(statusField?.optionColors ?? {});
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch Status colors" }, { status: 500 });
  }
}
