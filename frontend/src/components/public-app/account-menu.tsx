import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPublicUserSession, signOutPublicUser } from "@/lib/public-auth";

const sessionQueryKey = ["public-user-session"] as const;
type PublicSession = Awaited<ReturnType<typeof getPublicUserSession>>;

export function AccountMenu({
  session,
  mobile = false,
  onNavigate,
}: {
  session: PublicSession;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const queryClient = useQueryClient();
  const [signOutError, setSignOutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const authQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => getPublicUserSession(),
    initialData: session,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });

  const user = authQuery.data.user;
  if (!user) {
    return (
      <Link
        to="/login"
        onClick={onNavigate}
        className={
          mobile
            ? "inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[#cbd6e5] bg-white px-4 text-sm font-semibold text-[#20314a] transition hover:border-[#9fb2cb] hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8] active:scale-[0.98]"
            : "inline-flex min-h-10 items-center justify-center rounded-full border border-[#cbd6e5] bg-white/70 px-4 text-xs font-semibold text-[#20314a] transition hover:border-[#9fb2cb] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8] active:scale-[0.98] xl:text-[13px]"
        }
      >
        Login
      </Link>
    );
  }

  async function handleSignOut(event: Event) {
    event.preventDefault();
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError("");
    try {
      const result = await signOutPublicUser();
      if (!result.success) {
        setSignOutError("We could not sign you out. Please try again.");
        return;
      }
      queryClient.setQueryData(sessionQueryKey, (current: PublicSession | undefined) =>
        current
          ? { ...current, user: null, role: null, authorizationStatus: "unauthenticated" }
          : current,
      );
      window.location.assign("/");
    } catch {
      setSignOutError("We could not sign you out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setSignOutError("")}>
      <DropdownMenuTrigger
        className={
          mobile
            ? "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center truncate rounded-full border border-[#cbd6e5] bg-white px-4 text-sm font-semibold text-[#20314a] transition hover:border-[#9fb2cb] hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8] active:scale-[0.98]"
            : "inline-flex min-h-10 max-w-48 items-center justify-center truncate rounded-full border border-[#cbd6e5] bg-white/70 px-4 text-xs font-semibold text-[#20314a] transition hover:border-[#9fb2cb] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8] active:scale-[0.98] xl:text-[13px]"
        }
      >
        {user.displayName || "My Account"}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="z-[60] w-48 rounded-xl border-[#dbe2ec] bg-white p-1.5 text-[#20314a] shadow-[0_16px_40px_rgba(16,32,57,0.16)]"
      >
        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-lg px-3 py-2.5 focus:bg-[#f1f6ff]"
        >
          <Link to="/profile" onClick={onNavigate}>
            <UserRound aria-hidden="true" className="size-4 text-[#52627a]" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={handleSignOut}
          className="cursor-pointer rounded-lg px-3 py-2.5 text-[#a33a3a] focus:bg-[#fff2f2] focus:text-[#a33a3a]"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </DropdownMenuItem>
        {signOutError && (
          <p role="alert" className="px-3 py-2 text-xs leading-5 text-red-700">
            {signOutError}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
