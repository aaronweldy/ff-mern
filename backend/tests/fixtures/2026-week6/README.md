# 2026 Week 6 source data

CSV rows and selected original columns extracted from these nflverse releases
on October 20, 2026 (America/Los_Angeles):

- Stats: https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv
- Weekly rosters: https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_2026.csv
- Completed-game scores: https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv

`stats.csv` contains the three backups and Calvin Ridley (a participating player
with zero points). `rosters.csv` contains those players, the three inactive
starters, James Conner (reserve), and Justin Watson (active, absent from the stats
feed). `games.csv` contains all 14 regular-season Week 6 games.

`weeklyParticipation.regression.ts` passes these rows through parsing, roster
enrichment, the real scoring engine, and backup resolution. All three requested
backups fail before enrichment and succeed afterward. The tests also cover
unfinished games, wrong season/week/game type, ambiguous identities, existing
participation, failed roster downloads, malformed CSVs, unchanged submitted
lineups, and repeatable reruns.

Expected replacement points under this repository's default PPR settings:

| Starter | Backup | Points |
| --- | --- | ---: |
| Jeremiyah Love | Tyler Allgeier | 5.8 |
| DJ Moore | Keon Coleman | 13.9 |
| Adonai Mitchell | Jaylen Waddle | 6.4 |

The repository awards **4 points per receiving touchdown** in its default PPR
settings; nflverse's published PPR uses 6. This explains Coleman's 13.9 versus
15.9 in the provider's PPR column. League-specific settings may differ.

These are real NFL source rows with the user's requested backup assignments
reconstructed locally. They are not an export of submitted fantasy lineups, so
they do not establish whether a backup was actually benched, already starting,
or shared with another starter in the stored league. No production scores are
modified by these tests.
