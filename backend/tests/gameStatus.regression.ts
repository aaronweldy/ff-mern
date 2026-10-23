import { test } from "node:test";
import assert from "node:assert/strict";
import { createCompletedTeamsFetcher } from "../src/utils/scoringResolution.js";

const scoreboard = (year = 2026, week = 6, completed = true) => ({
  season: { year, type: 2 },
  week: { number: week },
  events: [
    {
      competitions: [
        {
          status: { type: { completed } },
          competitors: [
            { team: { abbreviation: "DET" } },
            { team: { abbreviation: "WAS" } },
          ],
        },
      ],
    },
  ],
});

const fixture = (respond: (call: number) => Response | Promise<Response>) => {
  let timestamp = 0;
  const requests: { url: string; signal: AbortSignal | null | undefined }[] =
    [];
  const delays: number[] = [];
  const warnings: Record<string, unknown>[] = [];
  const load = createCompletedTeamsFetcher({
    fetch: async (url, options) => {
      requests.push({ url: String(url), signal: options?.signal });
      return respond(requests.length);
    },
    now: () => timestamp,
    sleep: async (delay) => {
      delays.push(delay);
    },
    warn: (warning) => {
      warnings.push(warning);
    },
  });
  return {
    load,
    requests,
    delays,
    warnings,
    advance: (milliseconds: number) => {
      timestamp += milliseconds;
    },
  };
};

test("concurrent leagues share one lookup and receive independently mutable sets", async () => {
  const { load, requests } = fixture(() => Response.json(scoreboard()));
  const [first, second, third] = await Promise.all([
    load(2026, 6),
    load(2026, 6),
    load(2026, 6),
  ]);
  assert.equal(requests.length, 1);
  assert.ok(requests[0].signal instanceof AbortSignal);
  assert.match(requests[0].url, /dates=2026&seasontype=2&week=6/);
  assert.deepEqual([...first], ["DET", "WSH"]);
  first.clear();
  second.add("GB");
  assert.deepEqual([...third], ["DET", "WSH"]);
  assert.deepEqual([...(await load(2026, 6))], ["DET", "WSH"]);
  assert.equal(requests.length, 1);
});

test("the five-minute cache refreshes newly completed games at expiry", async () => {
  const { load, requests, advance } = fixture((call) =>
    Response.json(scoreboard(2026, 6, call > 1))
  );
  assert.equal((await load(2026, 6)).size, 0);
  advance(299_999);
  assert.equal((await load(2026, 6)).size, 0);
  assert.equal(requests.length, 1);
  advance(1);
  assert.deepEqual([...(await load(2026, 6))], ["DET", "WSH"]);
  assert.equal(requests.length, 2);
});

test("cache keys separate seasons and weeks", async () => {
  const { load, requests } = fixture((call) =>
    Response.json(
      call === 1
        ? scoreboard()
        : call === 2
        ? scoreboard(2026, 7)
        : scoreboard(2025, 6)
    )
  );
  await load(2026, 6);
  await load(2026, 7);
  await load(2025, 6);
  await load(2026, 6);
  assert.equal(requests.length, 3);
});

test("403 retries are shared across leagues and log useful rejection details", async () => {
  const { load, requests, delays, warnings } = fixture((call) =>
    call < 3
      ? new Response("Forbidden", {
          status: 403,
          statusText: "Forbidden",
          headers: {
            "content-type": "text/html",
            server: "CloudFront",
            "x-amz-cf-id": "request-123",
            "retry-after": "1",
            "set-cookie": "must-not-appear",
          },
        })
      : Response.json(scoreboard())
  );
  const results = await Promise.all([load(2026, 6), load(2026, 6)]);
  assert.equal(requests.length, 3);
  assert.deepEqual(delays, [250, 500]);
  assert.deepEqual(
    results.map((teams) => [...teams]),
    [
      ["DET", "WSH"],
      ["DET", "WSH"],
    ]
  );
  assert.equal(warnings.length, 2);
  assert.equal(warnings[0].retrying, true);
  const logged = JSON.stringify(warnings);
  assert.match(logged, /Forbidden/);
  assert.match(logged, /request-123/);
  assert.match(logged, /CloudFront/);
  assert.doesNotMatch(logged, /must-not-appear|set-cookie/);
});

test("429, server errors and network failures retry within the same bound", async () => {
  for (const status of [429, 503, "network", "timeout"] as const) {
    const { load, requests, delays } = fixture((call) => {
      if (call > 1) return Response.json(scoreboard());
      if (status === "network") throw new TypeError("fetch failed");
      if (status === "timeout") throw new DOMException("aborted", "AbortError");
      return new Response(null, { status });
    });
    assert.equal((await load(2026, 6)).size, 2);
    assert.equal(requests.length, 2);
    assert.deepEqual(delays, [250]);
  }
});

test("permanent HTTP failures fail immediately", async () => {
  const { load, requests, delays, warnings } = fixture(
    () => new Response(null, { status: 404 })
  );
  await assert.rejects(load(2026, 6), /week 6 after 1 attempt\(s\).*404/);
  assert.equal(requests.length, 1);
  assert.deepEqual(delays, []);
  assert.equal(warnings[0].retrying, false);
});

test("exhausted retries reject every caller, are not cached, and allow later recovery", async () => {
  const { load, requests, warnings } = fixture((call) =>
    call <= 3
      ? new Response(null, { status: 403 })
      : Response.json(scoreboard())
  );
  const results = await Promise.allSettled([load(2026, 6), load(2026, 6)]);
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(requests.length, 3);
  assert.equal(warnings[2].retrying, false);
  assert.match(
    String((results[0] as PromiseRejectedResult).reason),
    /after 3 attempt/
  );
  assert.equal((await load(2026, 6)).size, 2);
  assert.equal(requests.length, 4);
});

test("expired completion data is never served when its refresh fails", async () => {
  const { load, requests, advance } = fixture((call) =>
    call === 1
      ? Response.json(scoreboard())
      : new Response(null, { status: 403 })
  );
  await load(2026, 6);
  advance(300_000);
  await assert.rejects(load(2026, 6), /Game status unavailable/);
  assert.equal(requests.length, 4);
});

test("wrong-season, wrong-week, postseason and malformed scoreboards are never cached", async () => {
  const postseason = scoreboard();
  postseason.season.type = 3;
  for (const board of [
    scoreboard(2025),
    scoreboard(2026, 7),
    postseason,
    {},
    null,
  ]) {
    const { load, requests } = fixture((call) =>
      Response.json(call === 1 ? board : scoreboard())
    );
    await assert.rejects(load(2026, 6), /Invalid game status scoreboard/);
    assert.equal((await load(2026, 6)).size, 2);
    assert.equal(requests.length, 2);
  }
});
