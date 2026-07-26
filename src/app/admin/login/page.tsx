import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/auth";
import Logo from "@/components/Logo";
import SparkleField from "@/components/SparkleField";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await isSignedIn()) redirect("/admin");

  return (
    <div className="light-shaft relative grid min-h-screen place-items-center overflow-hidden px-6 py-16">
      <SparkleField count={24} />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card-plinth rounded-[1.75rem] p-8">
          <h1 className="text-center text-2xl">The Kitchen</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
            Sign in to manage menus, orders, gatherings and reviews.
          </p>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Your password lives in the <code>ADMIN_PASSWORD</code> environment
          variable. Change it before you go live.
        </p>
      </div>
    </div>
  );
}
