# Scoring and backup resolution

Run the regression suite with `pnpm --filter backend test:scoring`.

Weekly nflverse scores retain their source keys. Before resolving lineups or
returning scores, the backend also exposes scores under existing roster keys
when a normalized name (including suffix and known nickname variants) matches
one source player with the same position and NFL team. Exact keys take priority;
ambiguous matches remain missing and produce the existing scoring warning.
This covers submitted lineups, resolved lineups, and current rosters without
renaming stored players. Cumulative scoring receives the original source data,
before roster aliases are added. Backup usage compares normalized identities so
an alias cannot make the same backup available twice.

Cumulative totals join name variants with the same position and NFL team when
their nonzero weekly scores do not conflict. This repairs records split by a
provider name change while retaining one existing display name and counting
each week's score once. Conflicting histories stay separate for review.

Scoring always starts from `finalizedLineup`, the submitted lineup. The result
is saved separately as `scoringLineup`, with a substitution record for each slot.
The scoring breakdown displays this result; lineup editing still uses the
submitted lineup.

A substitution requires a completed ESPN regular-season game in the requested
season/week, zero points, and an explicit zero games-played statistic. Missing
participation data is not evidence that a player did not play. Bye weeks have
no completed game and do not trigger automatic substitution.

The nflverse stats feed contains participants, not zero-game rows for every
inactive player. Each stats refresh also reads that season's weekly roster feed.
For the requested regular-season week only, unique players explicitly marked
inactive (`INA`), reserve (`RES`), or exempt (`EXE`) receive a zero-stat, `G: "0"`
record when no scoring row already exists for their normalized identity. Existing
stats take priority, and active, unknown, or ambiguous roster records do not
establish nonparticipation. Use the weekly roster, not the season's latest roster:
an inactive player may return the following week. Roster download/schema failures
abort the refresh before scoring results are saved. Empty scoring weeks remain
empty even if roster data exists. The combined data uses the existing five-minute
stats cache; a fresh pre-deploy cache can retain the previous data until expiry.

The regression suite includes source extracts from 2026 Week 6 for Love →
Allgeier, Moore → Coleman, and Mitchell → Waddle. See
`tests/fixtures/2026-week6/README.md` for sources and verification scope.

Backups are assigned in the existing lineup display order, then array order
within each position. A backup must be on the submitted bench, eligible for
the slot, have finite scoring data, and not already be starting or used.
If two starters need the same backup, the first gets it; the second retains
the starter and produces a warning. Kickers retain the same-NFL-team replacement
rule, subject to the completion and participation checks.

The scoring route calculates stats without saving them, then commits team
results, weekly player data, cumulative results, and league scoring status in
one Firestore transaction. Errors go through Express error handling. Reruns
replace the selected week's contribution to cumulative scores.

Game-status lookup failures abort scoring before results are saved. Previously
mutated lineups cannot be reconstructed by this change; commissioners must
restore their intended submitted lineup before recalculating affected weeks.

After a scoring transaction commits, each newly applied or changed substitution
emits one JSON log with `event: "backup_substitution_applied"`, `leagueId`,
`season`, `week`, `teamId`, `slot`, `starter`, and `backup`. Search Render logs
for that event or either player's name. Failed commits and transaction retries
do not emit substitution logs. An unchanged substitution is not logged again
when its points change or the scheduler reruns; previously saved substitutions
are not logged retroactively when this logging is deployed.

## Avoiding redundant outbound bandwidth

The scheduled scorer still checks every ten minutes. Each request calculates
scores and resolves current submitted lineups and completed-game substitutions.
Inside the transaction, it compares each team's resulting week, the weekly
player data, cumulative scores, and `lastScoredWeek` with their stored values.
Only changed documents are written; an identical rerun makes no score writes.
Comparisons ignore object key order and zero-valued penalties use canonical
zero. Cumulative totals always use original provider keys, before roster aliases.
Existing commissioner adjustments and other weeks remain intact.

All comparison reads occur before writes in the same transaction, so concurrent
scoring or lineup saves retry against current data. A settings change during
calculation still aborts the run. Missing outputs are regenerated normally;
there is no saved input fingerprint that could hide a lineup change, provider
correction, game completion, or missing output.

NFL stats retain their five-minute cache TTL and in-flight request sharing.
When a refresh returns identical stats, only `fetchedAt` is uploaded, using
the read snapshot's update-time precondition. Changed stats replace the cache;
empty weeks and failed downloads are not marked fresh. A conflicting cache
update fails the request and can be retried by the scheduler.

Authenticated scoring-service requests receive only `{ updated: boolean }`.
The existing scheduler only checks the HTTP status, so this takes effect with
the backend deployment and needs no Functions redeployment. Commissioner
requests still receive the full `{ teams, errors, data }` response, including
warnings on unchanged runs. Logs distinguish `updated` from `unchanged` runs.

This reduces outbound writes and scoring responses, not the number of scheduled
checks. Each run additionally reads the existing weekly scoring document to
compare it. Actual bandwidth savings should be measured in Render after deploy.
