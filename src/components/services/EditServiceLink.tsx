import Link from "next/link";
import { Pencil } from "lucide-react";

type EditServiceLinkProps = {
  serviceId: string;
  serviceName: string;
};

/**
 * The pencil button on a service card, which opens the form to edit the service. It is built like the trash button beside it
 * (DeleteServiceButton): the same size, border and colors, so that the two look like a pair. It has no text, so it is named for a
 * screen reader ("Edit Free Legal Clinic") and, for a mouse, by a tooltip.
 */
export function EditServiceLink({ serviceId, serviceName }: EditServiceLinkProps) {
  return (
    <Link
      href={`/services/manage/${serviceId}/edit`}
      aria-label={`Edit ${serviceName}`}
      title="Edit service"
      className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    >
      <Pencil size={14} aria-hidden="true" />
    </Link>
  );
}
