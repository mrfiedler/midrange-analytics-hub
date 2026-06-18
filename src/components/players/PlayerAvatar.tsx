import { useState } from "react";

interface Props {
  id: number;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "size-10 text-xs",
  md: "size-14 text-sm",
  lg: "size-20 text-lg",
} as const;

/**
 * Tries the NBA CDN headshot using the balldontlie id (will usually 404 —
 * balldontlie IDs don't match NBA's player_id catalog). On error falls back
 * to a clean initials avatar with the brand gradient.
 */
export function PlayerAvatar({ id, firstName, lastName, size = "sm" }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const cls = `${SIZES[size]} rounded-full grid place-items-center shrink-0 overflow-hidden`;

  if (failed) {
    return (
      <div className={`${cls} flame-bg text-white font-display`}>{initials}</div>
    );
  }

  return (
    <div className={`${cls} bg-surface-2`}>
      <img
        src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`}
        alt={`${firstName} ${lastName}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </div>
  );
}
