import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

export function createSupabaseServerClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"];

  if (!url || !key) {
    throw new Error("Supabase public URL and publishable key are required.");
  }

  const cookies: CookieMethodsServer = {
    getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
    setAll: (values) => {
      for (const { name, value, options } of values) {
        setCookie(name, value, options);
      }
    },
  };

  return createServerClient(url, key, {
    cookies,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: import.meta.env.PROD,
      path: "/",
    },
  });
}
