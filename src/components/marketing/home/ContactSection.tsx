"use client";

import { useState } from "react";
import { Play, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function ContactSection() {
  const [contactMethod, setContactMethod] = useState<string>("Email");
  const [contactReason, setContactReason] = useState<string>("More information");
  const [contactMethods, setContactMethods] = useState<string[]>(["Email", "Phone"]);
  const [contactReasons, setContactReasons] = useState<string[]>([
    "More information",
    "Requesting Access",
  ]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: form.get("organization"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          preferredMethodOfContact: contactMethod,
          primaryReasonForContact: contactReason,
          email: form.get("email"),
          phoneNumber: form.get("phone"),
          message: form.get("message") ?? "",
        }),
      });

      if (!response.ok) throw new Error("Failed to submit");
      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="bg-[#f5f7fa] py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <h2 className="text-center text-2xl font-bold text-bird-accent md:text-3xl">
          Contact Us
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm md:p-8"
        >
          <p className="text-sm font-semibold text-bird-accent">Basic information</p>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              name="organization"
              placeholder="Organization Name *"
              required
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="First Name *"
                required
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Last Name *"
                required
                className="rounded-lg border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Method of Contact</Label>
            <div className="flex flex-wrap gap-2">
              {contactMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setContactMethod(method)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors",
                    contactMethod === method
                      ? "border-bird-accent bg-bird-accent text-white"
                      : "border-gray-200 bg-white text-black hover:border-bird-accent",
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email Address *"
              required
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone{" "}
              <span className="font-normal text-[#888]">
                (not required, unless preferred method of contact)
              </span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone Number"
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label>Reason for Contact</Label>
            <div className="flex flex-wrap gap-2">
              {contactReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setContactReason(reason)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors",
                    contactReason === reason
                      ? "border-bird-accent bg-bird-accent text-white"
                      : "border-gray-200 bg-white text-black hover:border-bird-accent",
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link &amp; Media</Label>
            <div className="flex min-h-30 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-[#fafafa] p-6 text-center">
              <Upload className="h-5 w-5 text-bird-accent" />
              <p className="text-sm text-black">Drag and Drop or upload media</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Write your message..."
              required
              className="resize-none rounded-lg border-gray-200"
            />
          </div>

          {status === "success" && (
            <p className="text-sm text-green-600">Thank you! Your message has been submitted.</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600">
              Something went wrong. Please try again.
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-bird-accent text-bird-accent hover:bg-[#F9FBFF]"
              onClick={() => {
                setStatus("idle");
                setContactMethod("Email");
                setContactReason("More information");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-bird-accent px-6 hover:bg-bird-accent-hover"
            >
              {status === "loading" ? "Submitting…" : "Submit"}
              <Play className="ml-1 h-3 w-3 fill-current" />
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
