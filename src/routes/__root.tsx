import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logo from "../assets/mrf-logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/AppShell";
import { ModeProvider } from "@/lib/mode-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center hero-bg px-4">
      <div className="max-w-md text-center fade-up">
        <div className="font-display text-[8rem] leading-none text-flame">404</div>
        <h2 className="mt-2 text-xl font-semibold">Lance perdido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Essa página tentou um midrange impossível. Volte pra quadra principal.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md flame-bg px-5 py-2.5 text-sm font-display uppercase tracking-widest text-white shadow-md hover:opacity-95">
            Voltar pra arena
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center fade-up">
        <h1 className="font-display text-2xl uppercase tracking-widest text-flame">Time-out técnico</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado no nosso lado. Tente recarregar.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md flame-bg px-4 py-2 text-sm text-white">
            Tentar novamente
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface px-4 py-2 text-sm text-foreground hover:bg-surface-2">
            Voltar
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0A1628" },
      { title: "Midrange Frenzy — análise avançada de basquete NBA" },
      { name: "description", content: "Plataforma de análise de basquete: jogadores, times, composições históricas, comparador e glossário didático de métricas avançadas." },
      { property: "og:title", content: "Midrange Frenzy — análise avançada de basquete NBA" },
      { property: "og:description", content: "Plataforma de análise de basquete: jogadores, times, composições históricas, comparador e glossário didático de métricas avançadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Midrange Frenzy — análise avançada de basquete NBA" },
      { name: "twitter:description", content: "Plataforma de análise de basquete: jogadores, times, composições históricas, comparador e glossário didático de métricas avançadas." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/86e3b49f-421c-417a-a738-21860d05848e/id-preview-c87b2554--d4c94f42-e8e9-4c8d-9dcc-645d6c9d6ca3.lovable.app-1781806928593.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/86e3b49f-421c-417a-a738-21860d05848e/id-preview-c87b2554--d4c94f42-e8e9-4c8d-9dcc-645d6c9d6ca3.lovable.app-1781806928593.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: logo.url },
      { rel: "apple-touch-icon", href: logo.url },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </ModeProvider>
    </QueryClientProvider>
  );
}
