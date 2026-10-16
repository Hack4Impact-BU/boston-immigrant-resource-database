import type { MetadataRoute } from "next";

// The web app manifest. Chrome (and other browsers) read it when someone installs BIRD, adds it to their home screen, or creates
// a shortcut, and it decides the name and icon they see. Next.js serves it at /manifest.webmanifest and links to it from every page.
//
// The icons live in public/icons/pwa and are all the BIRD emblem on a white background:
//   - the "any" icons (192 and 512) sit on a rounded white plate, so they stay visible on dark taskbars and launchers;
//   - the "maskable" icon is full-bleed white with the emblem inside the central safe zone, so Android can crop it to any shape.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Boston Immigrant Resource Dashboard",
    short_name: "BIRD",
    description: "Find immigrant-serving organizations and the services they offer in Greater Boston.",
    // The installed app opens straight into Search Services. /map is behind the login, so a signed-out user lands on the login page
    // first and everyone else gets the same page they would get by visiting /map in the browser. (id stays "/" so the app's identity
    // doesn't depend on which page it starts on.)
    start_url: "/map",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
