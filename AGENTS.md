<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Derive game leaders exclusively from the event box score through `game-leaders.ts`, never summary leader averages, because ESPN includes season leaders before tip-off.

- Use sidebar semantic tokens for navigation chrome and independent search tokens for mixed themes; mobile headers place search on a full-width second row to preserve usable control widths.
