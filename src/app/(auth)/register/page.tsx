import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div className="absolute inset-0 border-[3px] border-[#2f5f96]" />

      <div className="relative z-10 w-full max-w-md px-4 py-8 sm:px-0">
        <div className="mb-7 flex justify-center">
          <Image
            src="/icons/Just_BIRD_logo_blue.png"
            alt="BIRD"
            width={34}
            height={34}
            priority
            className="h-9 w-9 object-contain"
          />
        </div>

        <div className="mb-10 text-center">
          <h1 className="mx-auto max-w-[320px] text-[2.1rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[2.25rem]">
            Let&apos;s get to know each other
          </h1>
        </div>

        <form className="mx-auto flex max-w-80.5 flex-col gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="organizationName" className="text-xs font-medium text-slate-500">
              Organization Name
            </Label>
            <Input
              id="organizationName"
              type="text"
              placeholder="Organization Name"
              className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium text-slate-500">
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="Website"
              className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryPhoneNumber" className="text-xs font-medium text-slate-500">
              Primary Phone Number
            </Label>
            <Input
              id="primaryPhoneNumber"
              type="tel"
              placeholder="Primary Phone Number"
              className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-slate-500">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-slate-500">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Your Password"
              className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-500">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Your Password"
              className="h-8 rounded-[0.22rem] border-slate-300 px-2.5 text-[0.72rem] shadow-none placeholder:text-slate-400"
            />
          </div>

          <Button className="mt-6 h-10 rounded-[0.22rem] bg-[#5d93c7] text-base font-semibold text-white shadow-[0_8px_18px_rgba(93,147,199,0.22)] transition-colors hover:bg-[#4b81b6]">
            Finish
          </Button>
        </form>

        <p className="mt-24 text-center text-[0.72rem] text-slate-500">
          Boston Immigrant Resource Dashboard • Secure Access Portal
        </p>
      </div>
    </main>
  );
}
