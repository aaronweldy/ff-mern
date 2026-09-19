
### Highest projected lineup

Quick Set uses Sleeper's keyless weekly projection feed (`api.sleeper.app`),
with standard fantasy points (`pts_std`, matching the previous standard-scoring
FantasyPros behavior). It does not apply custom league scoring settings. The
projection endpoint is undocumented and may change independently of Sleeper's
public API.

Projections are cached for 15 minutes with a provider/version marker; old
FantasyPros caches are automatically replaced. Concurrent requests for the same
week share a fetch. Only numeric weekly projections count toward coverage;
ADP-only records are excluded. Player matching normalizes punctuation and name
suffixes and includes position to avoid cross-position collisions.

Players without projections stay on the bench. If projected players cannot fill
all starting slots, the action returns an error without saving a partial lineup.
Regular positions are filled before flex positions. Failed or incomplete feeds
return a visible error and do not overwrite the submitted lineup.
