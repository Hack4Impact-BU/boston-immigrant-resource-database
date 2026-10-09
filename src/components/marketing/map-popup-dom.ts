// DOM builders shared by the map pop-ups (the Providers page and the Search Services page).
//
// Pop-ups are built with DOM APIs and textContent rather than HTML strings: provider and service names are editable by
// Provider users, and this way their text can never be interpreted as markup.

/** The few provider fields a pop-up reads. Both pages' Provider types satisfy this. */
export type PopupProvider = {
  id: string;
  name: string;
  address?: string | null;
  logo?: string | null;
  primary_phone_number?: string | null;
  email?: string | null;
  language_support?: readonly string[] | null;
};

export function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, style: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.style.cssText = style;
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

export const LINK_STYLE = "color:#0369a1;text-decoration:underline;overflow-wrap:anywhere;";

export function providerProfileHref(providerId: string): string {
  return `/providers/${encodeURIComponent(providerId)}`;
}

function createLabeledRow(label: string, content: Node): HTMLElement {
  const row = createElement("div", "margin-top:6px;line-height:1.4;");
  row.append(createElement("span", "color:#94a3b8;", `${label} `), content);
  return row;
}

/**
 * The part of a provider pop-up that both pages share: logo, the provider's name (a link to its profile), address, then
 * phone, email and languages when the provider has them. Callers append whatever else their pop-up shows.
 */
export function buildProviderSummaryBase(provider: PopupProvider): HTMLElement {
  const summary = createElement("div", "font-family:Arial, sans-serif;font-size:12px;color:#334155;");

  const header = createElement("div", "display:flex;gap:10px;align-items:flex-start;");
  const logo = document.createElement("img");
  logo.src = provider.logo || "/icons/Just_BIRD_logo_blue.png";
  logo.alt = "";
  logo.loading = "lazy";
  logo.style.cssText = "width:40px;height:40px;flex-shrink:0;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;padding:2px;background:#fff;";
  header.append(logo);

  const heading = createElement("div", "min-width:0;");
  const name = document.createElement("a");
  name.href = providerProfileHref(provider.id);
  name.textContent = provider.name;
  name.style.cssText = "display:block;font-weight:700;font-size:13px;line-height:1.3;color:#0f172a;text-decoration:none;overflow-wrap:anywhere;";
  heading.append(name, createElement("div", "margin-top:2px;font-size:11px;color:#64748b;", provider.address || "Location not listed"));
  header.append(heading);
  summary.append(header);

  const phone = provider.primary_phone_number?.trim();
  if (phone) {
    const link = document.createElement("a");
    link.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    link.textContent = phone;
    link.style.cssText = LINK_STYLE;
    summary.append(createLabeledRow("Phone", link));
  }

  const email = provider.email?.trim();
  if (email) {
    const link = document.createElement("a");
    link.href = `mailto:${email}`;
    link.textContent = email;
    link.style.cssText = LINK_STYLE;
    summary.append(createLabeledRow("Email", link));
  }

  const languages = provider.language_support ?? [];
  if (languages.length > 0) {
    summary.append(createLabeledRow("Languages", document.createTextNode(languages.join(" · "))));
  }

  return summary;
}
