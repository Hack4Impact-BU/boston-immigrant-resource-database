import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-6 py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(72,128,199,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(93,174,255,0.12),transparent_30%)]" />
            <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/70 to-transparent" />

            <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 px-8 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-10">
                <div className="mb-8 flex justify-center">
                    <Image
                        src="/icons/Just_BIRD_logo_blue.png"
                        alt="BIRD"
                        width={72}
                        height={72}
                        priority
                        className="h-14 w-14 object-contain"
                    />
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                        Welcome Back
                    </h1>
                    <p className="mt-3 text-base text-slate-700">
                        Sign in to access your resource dashboard
                    </p>
                </div>

                <form className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Your email address"
                            className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="password"
                            className="text-sm font-medium text-slate-700"
                        >
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Your Password"
                            className="h-12 rounded-lg border-slate-300 px-4 text-sm shadow-sm placeholder:text-slate-400"
                        />
                    </div>

                    <Button className="h-12 w-full rounded-lg bg-[#5d93c7] text-base font-semibold text-white shadow-[0_10px_24px_rgba(93,147,199,0.28)] transition-colors hover:bg-[#4b81b6]">
                        Sign In
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-semibold text-slate-900 underline underline-offset-4">
                        Sign up
                    </Link>
                </p>
            </div>
        </main>
    );
}