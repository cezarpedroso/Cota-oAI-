import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { login } from "@/lib/auth/actions";
import { getCopy } from "@/lib/locale/copy";
import { getLocale } from "@/lib/locale/server";

export const instant = false;

export default async function Page({ searchParams }: PageProps<"/login">) {
  const locale = await getLocale();
  const t = getCopy(locale).auth;
  const query = await searchParams;
  const callbackError = query.error === "invalid_confirmation_link";
  return (
    <AuthLayout
      title={t.loginTitle}
      description={t.loginDescription}
      locale={locale}
    >
      {callbackError && (
        <p
          aria-live="polite"
          className="mb-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {t.invalidConfirmationLink}
        </p>
      )}
      <AuthForm action={login} locale={locale} />
      <p className="mt-6 text-sm text-slate-600">
        {t.loginPrompt}{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/signup"
        >
          {t.loginLink}
        </Link>
      </p>
    </AuthLayout>
  );
}
