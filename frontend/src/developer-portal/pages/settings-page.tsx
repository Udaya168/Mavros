import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOwnProfile, updateOwnProfile } from "@/lib/public-auth";

export function SettingsPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organization = developerSession.memberships[0];
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["own-profile"],
    queryFn: () => getOwnProfile(),
  });
  const [fullName, setFullName] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await updateOwnProfile({ data: { fullName: name } });
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: async () => {
      setSuccess("Profile changes saved.");
      await queryClient.invalidateQueries({ queryKey: ["own-profile"] });
    },
  });

  const initialName =
    profileQuery.data?.profile?.full_name?.trim() || profileQuery.data?.user?.displayName || "";
  const value = fullName ?? initialName;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    saveMutation.mutate(value.trim());
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Settings</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Update your own profile and review your verified organization identity. Organization-wide
        preferences are not available in the current schema.
      </p>
      <section className="mt-6 max-w-xl rounded-xl border border-[#dbe2ec] bg-white p-5">
        <h2 className="font-semibold text-[#20314a]">Organization</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#68778c]">Name</dt>
            <dd className="mt-1 font-medium text-[#20314a]">
              {organization?.organizationName ?? "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-[#68778c]">Workspace slug</dt>
            <dd className="mt-1 font-medium text-[#20314a]">
              {organization?.organizationSlug ?? "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-[#68778c]">Your role</dt>
            <dd className="mt-1 font-medium capitalize text-[#20314a]">
              {organization?.role ?? "Unavailable"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[#8793a5]">
          This organization identity is read-only. No organization settings table or write
          permission is configured.
        </p>
      </section>
      {profileQuery.isPending ? (
        <p className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
          Loading profile…
        </p>
      ) : profileQuery.isError || !profileQuery.data.user ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">Your profile could not be loaded.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void profileQuery.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : (
        <form
          onSubmit={submit}
          className="mt-6 max-w-xl space-y-4 rounded-xl border border-[#dbe2ec] bg-white p-5"
        >
          <label className="block space-y-1.5 text-sm font-medium text-[#20314a]">
            Display name
            <Input
              required
              minLength={1}
              maxLength={120}
              value={value}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <div className="text-sm">
            <p className="font-medium text-[#20314a]">Email</p>
            <p className="mt-1 text-[#68778c]">{profileQuery.data.user.email ?? "Unavailable"}</p>
          </div>
          {saveMutation.error && (
            <p role="alert" className="text-sm text-red-700">
              {saveMutation.error.message}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-emerald-700">
              {success}
            </p>
          )}
          <Button
            type="submit"
            disabled={saveMutation.isPending || value.trim().length === 0}
            className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          >
            {saveMutation.isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      )}
    </div>
  );
}
