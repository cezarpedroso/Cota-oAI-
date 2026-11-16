import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { signup } from "@/lib/auth/actions";
import { getCopy } from "@/lib/locale/copy";
import { getLocale } from "@/lib/locale/server";

export const instant = false;

export default async function Page() {
  const locale = await getLocale();
  const t = getCopy(locale).auth;
  return (
    <AuthLayout
      title={t.signupTitle}
      description={t.signupDescription}
      locale={locale}
    >
      <AuthForm action={signup} signup locale={locale} />
      <p className="mt-6 text-sm text-slate-600">
        {t.signupPrompt}{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/login"
        >
          {t.signupLink}
        </Link>
      </p>
    </AuthLayout>
  );
}
