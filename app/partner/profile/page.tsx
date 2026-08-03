import { PartnerProfileForm } from "@/components/partner-profile-form";
import { PartnerLegalForm } from "@/components/partner-legal-form";

export default function PartnerProfilePage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Мой профиль</h1>
      <PartnerProfileForm />
      <div className="my-8 border-t" />
      <PartnerLegalForm />
    </div>
  );
}
