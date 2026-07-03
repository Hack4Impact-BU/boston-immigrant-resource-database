import Sidebar from "@/components/marketing/Sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import helpingImg from "/public/img/helping.png";


export default function faq() {
    const faqItems = [
        {
            trigger: "What is BIRD?",
            content: "The Boston Immigrant Resource Dashboard (BIRD) is a real-time, online platform that helps immigrant-serving providers and communities quickly find up-to-date information on essential resources in Boston, such as legal aid, ESL classes, and workforce development.",
        },
        {
            trigger: "Who can use BIRD?",
            content: "BIRD is designed primarily for immigrant-facing providers (churches, nonprofits, city agencies, and community organizations).",
        },
        {
            trigger: "Why was BIRD created?",
            content: "Immigrant and refugee neighbors often face barriers to finding timely help. Existing resource lists and databases are often outdated. BIRD was created to close this gap by offering real-time updates using a simple green–yellow–red light system to show which services are available now."
        },
    ]
    
    const forProvidersItems = [
        {
            trigger: "How does my organization join BIRD?",
            content: "Providers can sign up by reaching out to us (via the Contact Us form), attending a tutorial session, and signing an MOU. Once approved, you’ll be able to create and manage your organization’s listings on BIRD and see other resources."
        },
        {
            trigger: "What’s expected of providers who join?",
            content: "sample text"
        },
        {
            trigger: "How often do I need to update my information?",
            content: "sample text"
        },
        {
            trigger: "Is there a cost to participate?",
            content: "sample text"
        },
    ]
        
    const usingtheDashboardItems = [
        {
            trigger: "How do I know if a resource is available?",
            content: 
                `BIRD uses the following statuses for resources:
                1. Open
                2. Waiting List
                3. Contact Provider
                4. Closed`
        },
        {
            trigger: "What types of services are included?",
            content: "sample text"
        },
        {
            trigger: "Will more services be added in the future?",
            content: "sample text"
        },
    ]

    const otherQuestionsItems = [
            {
                trigger: "Who manages BIRD?",
                content: "BIRD is a collaborative initiative originating with church and city leaders from Boston Flourish, in partnership with immigrant-serving providers across the city."
            },
            {
                trigger: "How do I get support if I’m having trouble?",
                content: "sample text"
            },
            {
                trigger: "How can I support BIRD’s mission?",
                content: "sample text"
            },
        ]    
    
    return (
        <div className="min-h-screen min-w-2xl">
            <aside className="w-[260px] fixed inset-y-0 left-0 z-50">
                <Sidebar isOpen activePage="FAQs" />
            </aside>
            <main className="flex-1 ml-[260px] p-12 flex flex-col gap-7 bg-white">
                <div className="flex flex-col gap-5 lg:flex-row">
                    <div className="w-full lg:flex-[9]">
                        <h2 className="text-[#4151CD] font-bold text-2xl mb-2">Frequently Asked Question</h2>
                        <p className="mb-12">Boston Immigrant Resource Dashboard</p>
                        <Image src={helpingImg} alt="" className="w-[80%] mb-10 rounded-2xl"></Image>
                    </div>
                    <div className="w-full lg:flex-[11] p-6 bg-[#F9FBFF]">
                        <Accordion
                        type="multiple"
                        >
                            {faqItems.map((item, i) => (
                                <AccordionItem
                                    key={i}
                                    value={`${i}`}
                                    className="border-b-0"
                                >
                                    <AccordionTrigger className="pb-1 font-bold text-left">{item.trigger}</AccordionTrigger>
                                    <AccordionContent className="font-light whitespace-pre-line">{item.content}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
                <div>
                    <h2 className="text-[#4151CD] font-bold text-2xl mb-7">For Providers</h2>
                    <div className="bg-[#F9FBFF] p-6">
                        <Accordion
                            type="multiple"
                        >
                            {forProvidersItems.map((item, i) => (
                                <AccordionItem
                                    key={i}
                                    value={`${i}`}
                                    className="border-b-0"
                                >
                                    <AccordionTrigger className="pb-1 font-bold text-left">{item.trigger}</AccordionTrigger>
                                    <AccordionContent className="font-light whitespace-pre-line">{item.content}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
                <div>
                    <h2 className="text-[#4151CD] font-bold text-2xl mb-7">Using the Dashboard</h2>
                    <div className="bg-[#F9FBFF] p-6">
                        <Accordion
                            type="multiple"
                        >
                            {usingtheDashboardItems.map((item, i) => (
                                <AccordionItem
                                    key={i}
                                    value={`${i}`}
                                    className="border-b-0"
                                >
                                    <AccordionTrigger className="pb-1 font-bold text-left">{item.trigger}</AccordionTrigger>
                                    <AccordionContent className="font-light whitespace-pre-line">{item.content}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
                <div>
                    <h2 className="text-[#4151CD] font-bold text-2xl mb-7">Other Questions</h2>
                    <div className="bg-[#F9FBFF] p-6">
                        <Accordion
                            type="multiple"
                        >
                            {otherQuestionsItems.map((item, i) => (
                                <AccordionItem
                                    key={i}
                                    value={`${i}`}
                                    className="border-b-0"
                                >
                                    <AccordionTrigger className="pb-1 font-bold text-left">{item.trigger}</AccordionTrigger>
                                    <AccordionContent className="font-light whitespace-pre-line">{item.content}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </main>
        </div>
    )
}
