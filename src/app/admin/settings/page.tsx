import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-4xl">Site copy</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Every word on this page is editable without touching code. Save, and
        your site updates straight away.
      </p>

      <div className="mt-8 max-w-3xl">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
