import Image from "next/image";
import logo from "/public/icons/Just_BIRD_logo_blue.png";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { MailIcon, EyeOffIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Login() {
    return ( 
        <main className="
                relative h-screen w-screen 
                overflow-hidden overscroll-none
                flex justify-center items-center
            ">
            <Image
                src="/icons/loginBackground.png"
                alt=""
                fill // absolutely positioned to fill its parent (parent must also be positioned)
                priority
                className="object-cover"
            />
            <div className="
                relative z-10
                h-[75%] aspect-[9/10] min-h-100 
                [container-type:inline-size]
            ">
                <div className="
                    rounded-sm bg-white p-[12cqw]
                    h-full w-full
                    flex flex-col 
                ">
                    <div className="flex justify-center h-[10cqw] mb-[1cqw]">
                        <Image
                            src={logo}
                            alt=""
                            className="object-contain"
                        />
                    </div>
                    <p className="text-center text-[7cqw] text-[#27317B] font-semibold mb-[1.5cqw]">WELCOME</p>
                    <p className="text-center text-[3.5cqw] text-[#555555AA] font-semibold mb-[6cqw]">
                        Sign in to access your resource dashboard
                    </p>
                    <div>
                        <InputGroup className="rounded-sm h-[9cqw] mb-[1cqw]">
                            <InputGroupInput 
                                type="email" 
                                placeholder="Email" 
                                className="h-full text-[2.75cqw] placeholder:text-[2.75cqw] placeholder:leading-[10cqw]" 
                            />
                            <InputGroupAddon className="px-[2.25cqw] py-[1cqw]">
                                <MailIcon className="size-[3cqw]" />
                            </InputGroupAddon>
                        </InputGroup>
                        <InputGroup className="rounded-sm h-[9cqw] mb-[3cqw]">
                            <InputGroupAddon className="px-[2.25cqw] py-[1cqw]">
                                <LockIcon className="size-[3cqw]"/>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="inline-end-input"
                                type="password"
                                placeholder="Password"
                                className="h-full text-[2.75cqw] placeholder:text-[2.75cqw]"
                            />
                            <InputGroupAddon align="inline-end" className="px-[2.25cqw] py-[1.2cqw]">
                                <EyeOffIcon className="size-[3cqw]"/>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                    <div className="
                        flex justify-between items-center 
                        font-source-sans-3 mb-[5cqw]"
                    >
                        <div className="flex gap-[0.75cqw] items-center">
                            <Checkbox id="rememberMe" className="w-[1.75cqw] h-[1.75cqw] rounded-xs" ></Checkbox>
                            <Label htmlFor="rememberMe" className="font-medium text-[2.5cqw] text-[var(--chart-3)]">Remember me</Label>
                        </div>
                        <Link href="" className="font-medium text-[2.5cqw] text-[var(--chart-3)] ">Forgot Password?</Link>
                    </div>
                    <Button className="w-[45cqw] h-[8cqw] mx-auto rounded-sm bg-[#4E61F6] hover:bg-[#9747FF] text-[3cqw] font-semibold mb-[2cqw]">Sign in</Button>
                    <Link href="" className="mx-auto font-medium text-[2cqw] text-[var(--chart-3)] underline">Create Account</Link>
                </div>
            </div>
        </main>
    );
}