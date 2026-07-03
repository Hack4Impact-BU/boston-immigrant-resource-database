import Image from "next/image";

import { RegisterForm } from "@/features/auth/register/register-form";

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

        <RegisterForm />

        <p className="mt-24 text-center text-[0.72rem] text-slate-500">
          Boston Immigrant Resource Dashboard • Secure Access Portal
        </p>
      </div>
    </main>
  );
}
