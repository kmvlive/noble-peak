"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VkLoginButtonProps {
  redirectUri: string;
  onLoading?: (loading: boolean) => void;
}

export function VkLoginButton({ redirectUri, onLoading }: VkLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("vk_state", state);
    sessionStorage.setItem("vk_redirect_uri", redirectUri);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_VK_CLIENT_ID || "",
      redirect_uri: redirectUri,
      state,
      scope: "email,phone",
      v: "5.131",
    });

    setLoading(true);
    onLoading?.(true);
    window.location.href = `https://id.vk.com/authorize?${params.toString()}`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleClick}
      disabled={loading}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="#0077FF"
      >
        <path d="M15.684 0H8.316C3.732 0 0 3.732 0 8.316v7.368C0 20.268 3.732 24 8.316 24h7.368C20.268 24 24 20.268 24 15.684V8.316C24 3.732 20.268 0 15.684 0zm3.516 16.848h-1.548c-.636 0-.828-.48-2.004-1.716-1.02-1.068-1.464-1.212-1.716-1.212-.348 0-.444.132-.444.516v1.272c0 .372-.18.576-1.068.576-1.572 0-3.312-.972-4.536-2.784-1.572-2.112-1.98-3.696-1.98-4.032 0-.192.084-.384.48-.384h1.548c.36 0 .492.18.636.612.708 2.052 1.896 3.852 2.388 3.852.18 0 .264-.096.264-.636v-2.304c0-1.068-.636-1.164-.636-1.548 0-.18.144-.36.36-.36h2.472c.3 0 .408.156.408.516v2.784c0 .3.132.408.228.408.18 0 .336-.108.528-.3.9-1.02 1.548-2.592 1.548-2.592.084-.192.252-.36.576-.36h1.548c.384 0 .48.204.384.516-.264.828-2.004 3.24-2.004 3.24-.156.264-.216.384 0 .648.156.24.672.66 1.02 1.068.588.684 1.056 1.26 1.176 1.656.12.396-.06.648-.456.648z" />
      </svg>
      Войти через ВКонтакте
    </Button>
  );
}
