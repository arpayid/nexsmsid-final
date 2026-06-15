"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileWidget = {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

export type TurnstileHandle = {
  /** Reset widget and wait for a fresh single-use token (null when Turnstile is disabled). */
  requestToken: () => Promise<string | null>;
};

type TurnstileFieldProps = {
  onToken?: (token: string) => void;
};

export const TurnstileField = forwardRef<TurnstileHandle, TurnstileFieldProps>(function TurnstileField({ onToken }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const latestTokenRef = useRef<string | null>(null);
  const pendingTokenRef = useRef<((token: string | null) => void) | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleToken = useCallback(
    (token: string) => {
      latestTokenRef.current = token;
      onToken?.(token);
      pendingTokenRef.current?.(token);
      pendingTokenRef.current = null;
    },
    [onToken],
  );

  useImperativeHandle(
    ref,
    () => ({
      requestToken: () => {
        if (!siteKey) return Promise.resolve(null);
        if (!window.turnstile || !widgetIdRef.current) {
          return Promise.resolve(latestTokenRef.current);
        }
        return new Promise<string | null>((resolve) => {
          pendingTokenRef.current = resolve;
          window.turnstile!.reset(widgetIdRef.current!);
        });
      },
    }),
    [siteKey],
  );

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile || !siteKey) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleToken,
      });
    }

    if (window.turnstile) {
      renderWidget();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.remove();
    };
  }, [handleToken, siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="min-h-[65px]" />;
});
