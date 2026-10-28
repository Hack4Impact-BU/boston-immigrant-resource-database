// Where a signed-in person goes. The middleware (proxy.ts) takes it from there: an approved account gets /map, and anyone still waiting
// for access is sent on to /access-status.
export const AFTER_SIGN_IN_PATH = "/map";

// True while the login form is signing someone in, or has done so and is sending them on. The form sends them on itself then, so
// RedirectIfSignedIn (which reacts to any new session, including the one the form has just created) leaves it alone: two
// navigations to the same page, and a refresh, started at once interfere with each other in Next's router, and the person stays
// on the login page.
let isLoginFormBusy = false;

export function setLoginFormBusy(isBusy: boolean) {
  isLoginFormBusy = isBusy;
}

export function getIsLoginFormBusy() {
  return isLoginFormBusy;
}
