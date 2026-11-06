// Static path served from /public - works on Vercel, Lovable, or any host
// without depending on the internal /__l5e/... proxy.
const LOGO_URL = "/mrf-logo.png";

/**
 * Logo wordmark renderizado como máscara CSS: a cor vem do token
 * `--logo-fg`, então o logo se adapta ao tema (branco no escuro,
 * navy no claro) em vez de sumir em fundos claros.
 */
export function Logo({ className = "", alt = "Midrange Frenzy" }: { className?: string; alt?: string }) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-block shrink-0 ${className}`}
      style={{
        aspectRatio: "1 / 1",
        backgroundColor: "var(--logo-fg)",
        maskImage: `url(${LOGO_URL})`,
        WebkitMaskImage: `url(${LOGO_URL})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
