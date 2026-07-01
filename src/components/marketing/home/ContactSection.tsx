"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("name") ?? "").trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: String(form.get("subject") ?? ""),
          firstName: firstName || fullName,
          lastName: lastName || "",
          preferredMethodOfContact: "Email",
          primaryReasonForContact: String(form.get("subject") ?? "General inquiry"),
          email: form.get("email"),
          phoneNumber: "",
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
          className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm md:p-8"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your name"
              required
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="How can we help?"
              required
              className="rounded-lg border-gray-200"
            />
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
            <p className="text-sm text-green-600">
              Thank you! Your message has been submitted.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600">
              Something went wrong. Please try again.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-bird-accent px-8 hover:bg-bird-accent-hover"
            >
              {status === "loading" ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
