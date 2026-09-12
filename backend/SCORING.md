# Scoring and backup resolution

Run the regression suite with `pnpm --filter backend test:scoring`.

Scoring always starts from `finalizedLineup`, the submitted lineup. The result
is saved separately as `scoringLineup`, with a substitution record for each slot.
The scoring breakdown displays this result; lineup editing still uses the
submitted lineup.

A substitution requires a completed ESPN regular-season game in the requested
season/week, zero points, and an explicit zero games-played statistic. Missing
participation data is not evidence that a player did not play. Bye weeks have
no completed game and do not trigger automatic substitution.

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
