"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AFTER_SIGN_IN_PATH, getIsLoginFormBusy } from "./after-sign-in";

/**
 * Sends someone who is already signed in away from the page it is on, to /map. The middleware does this for every request to the
 * server, but it can't for a page that is already open in the browser: a login page kept open in another tab, or brought back with
 * the Back button after signing in, still shows the form, and signing in again from it fails with "You're already signed in." Clerk
 * lets this page know as soon as it sees a session, in this tab or another one.
 *
 * Not for the register page: a new account is signed in part way through registering, and the registration form sends it on
 * to /access-status itself.
 */
export function RedirectIfSignedIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // (If the login form is busy, it is what signed this person in, and it sends them on itself.)
    if (isLoaded && isSignedIn && !getIsLoginFormBusy()) {
      router.replace(AFTER_SIGN_IN_PATH);
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}
