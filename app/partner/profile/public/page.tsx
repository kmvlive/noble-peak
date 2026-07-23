import { PartnerPublicProfileEditor } from "@/components/partner-public-profile-editor";

export default function PartnerPublicProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Публичный профиль
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Настройте публичную страницу, которую увидят клиенты. Укажите адрес
        страницы (slug) и она будет доступна по ссылке /partners/ваш-slug.
      </p>
      <PartnerPublicProfileEditor />
    </div>
  );
}
