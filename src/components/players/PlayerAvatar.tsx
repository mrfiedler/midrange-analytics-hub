import { useState } from "react";

interface Props {
  id?: number;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  sm: "size-10 text-xs",
  md: "size-14 text-sm",
  lg: "size-20 text-lg",
  xl: "size-28 text-3xl",
} as const;

/**
 * NBA CDN headshots are keyed by NBA's internal player_id, which does NOT
 * match balldontlie's id. Maintain a name→NBA id map for the most-searched
 * players; everyone else falls back to a clean initials avatar so we never
 * show a broken image.
 */
export const NBA_ID_MAP: Record<string, number> = {
  "nikola jokic": 203999,
  "nikola jokić": 203999,
  "luka doncic": 1629029,
  "luka dončić": 1629029,
  "shai gilgeous-alexander": 1628983,
  "giannis antetokounmpo": 203507,
  "jayson tatum": 1628369,
  "stephen curry": 201939,
  "lebron james": 2544,
  "anthony edwards": 1630162,
  "victor wembanyama": 1641705,
  "jalen brunson": 1628973,
  "kevin durant": 201142,
  "joel embiid": 203954,
  "damian lillard": 203081,
  "devin booker": 1626164,
  "tyrese haliburton": 1630169,
  "donovan mitchell": 1628378,
  "anthony davis": 203076,
  "jimmy butler": 202710,
  "kawhi leonard": 202695,
  "paul george": 202331,
  "james harden": 201935,
  "russell westbrook": 201566,
  "chris paul": 101108,
  "klay thompson": 202691,
  "draymond green": 203110,
  "bam adebayo": 1628389,
  "trae young": 1629027,
  "ja morant": 1629630,
  "zion williamson": 1629627,
  "lamelo ball": 1630163,
  "scottie barnes": 1630567,
  "evan mobley": 1630596,
  "paolo banchero": 1631094,
  "chet holmgren": 1631096,
  "franz wagner": 1630532,
  "alperen sengun": 1630578,
  "domantas sabonis": 1627734,
  "de'aaron fox": 1628368,
  "deaaron fox": 1628368,
  "pascal siakam": 1627783,
  "rudy gobert": 203497,
  "karl-anthony towns": 1626157,
  "karl anthony towns": 1626157,
  "julius randle": 203944,
  "kyrie irving": 202681,
};

export function lookupNbaId(firstName: string, lastName: string): number | null {
  const key = `${firstName} ${lastName}`.toLowerCase().trim();
  return NBA_ID_MAP[key] ?? null;
}

export function PlayerAvatar({ id: _id, firstName, lastName, size = "sm" }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const nbaId = lookupNbaId(firstName, lastName);
  const cls = `${SIZES[size]} rounded-full grid place-items-center shrink-0 overflow-hidden`;

  // Source: NBA CDN when we have a name-mapped NBA id, otherwise initials.
  // We do NOT use the incoming `id` as an ESPN CDN key here: it's a
  // balldontlie id, which does NOT match ESPN's id space.
  const src = nbaId && !failed
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`
    : null;

  if (!src) {
    return <div className={`${cls} flame-bg text-white font-display`}>{initials}</div>;
  }

  return (
    <div className={`${cls} bg-surface-2`}>
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </div>
  );
}

