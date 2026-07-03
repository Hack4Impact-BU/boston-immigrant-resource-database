import { client } from "@/lib/sanity";
import Sidebar from "@/components/marketing/Sidebar";

interface ResourceItem {
  _id: string;
  link: string;
  href: string;
  before?: string;
  after?: string;
}

interface ResourceSection {
  _id: string;
  title: string;
  type: "text" | "numbered";
  items: ResourceItem[];
}

function ResourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="underline decoration-slate-500 underline-offset-2 transition-colors hover:text-slate-900">
      {children}
    </a>
  );
}

export default async function ResourcesPage() {
  let sections: ResourceSection[] = [];

  try {
    sections = await client.fetch(`*[_type == "resourceSection"] | order(order asc) {
      _id,
      title,
      type,
      items[] {
        _id,
        link,
        href,
        before,
        after
      }
    }`);
  } catch (error) {
    console.error("Failed to fetch resource sections:", error);
  }

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar isOpen={true} activePage="Additional Resources" />
      <main className="flex-1 bg-[#f2f4f7] px-2 py-2 text-slate-800 sm:px-3 sm:py-3 ml-52">
      <section className="mx-auto min-h-[calc(100vh-1rem)] rounded-xl bg-white px-4 py-4 shadow-[0_0_0_1px_rgba(229,231,235,0.9)] sm:px-5 sm:py-5">
        <h1 className="text-[1.15rem] font-semibold tracking-tight text-[#4c8cc9] sm:text-[1.3rem]">
          Additional Resources
        </h1>

        {sections.length === 0 ? (
          <div className="mt-4 text-slate-500">
            No resource sections were returned from Sanity. Check that the documents are published and that the document type is <span className="font-medium">resourceSection</span>.
          </div>
        ) : (
          <div className="mt-4 space-y-7 rounded-2xl bg-[#f8fafc] px-6 py-6 shadow-[inset_0_0_0_1px_rgba(241,245,249,1)] sm:px-7 sm:py-7">
            {sections.map((section) => (
              <section key={section.title} className="space-y-1.5">
                <h2 className="text-[0.95rem] font-semibold text-slate-700 sm:text-[1rem]">
                  {section.title}
                </h2>

                {section.type === "text" ? (
                  <p className="text-[0.72rem] leading-5 text-slate-700 sm:text-[0.82rem]">
                    {section.items?.[0]?.before}
                    <ResourceLink href={section.items?.[0]?.href || "#"}>{section.items?.[0]?.link || "Missing link"}</ResourceLink>
                  </p>
                ) : (
                  <ol className="space-y-0.5 pl-5 text-[0.72rem] leading-5 text-slate-700 sm:text-[0.82rem]">
                    {section.items?.map((item) => (
                      <li key={item.link} className="pl-1">
                        <ResourceLink href={item.href}>{item.link}</ResourceLink>
                        {item.after}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}

            <p className="pt-1 text-[0.9rem] font-semibold text-slate-700 sm:text-[0.95rem]">
              *If there is another helpful resource we can add to the list, please reach out to us!
            </p>
          </div>
        )}
      </section>
    </main>
    </div>
  );
}