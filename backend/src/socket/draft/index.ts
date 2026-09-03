import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DraftState,
  DraftPick,
  getCurrentPickInfo,
  ChatMessage,
  League,
  TeamRoster,
  DraftPhase,
  RosteredPlayer,
  Position,
} from "@ff-mern/ff-types";
import { DecodedIdToken } from "firebase-admin/auth";
import { Server, Socket } from "socket.io";
import { auth, db } from "../../config/firebase-config.js";
import {
  addPlayerToTeam,
  buildPlayersByTeam,
  linearizeSelections,
  rebuildPlayersAndSelections,
} from "./utils.js";

/**
 * Draft socket persistence model.
 *
 * - `activeDrafts` / `activeRooms` / `connectedUsers` are an in-memory cache
 *   only. Firestore `drafts/{draftId}` (+ subcollections `selections` and
 *   `availablePlayers`) is the source of truth.
 * - `join room` loads from Firestore via `rebuildPlayersAndSelections(room)`
 *   whenever the room is not already cached, so a server restart (or a room
 *   that was never preloaded) recovers state instead of failing.
 * - `draftPick` / `undoLastPick` / `autoPick` / `updateDraftPhase` apply the
 *   in-memory mutation first and then persist through a Firestore
 *   `runTransaction` that touches `drafts/{id}` + `selections/{pick}` +
 *   `availablePlayers/{fullName}` atomically. The transaction re-reads the
 *   stored `currentPick`/`phase` and aborts on mismatch, so two concurrent
 *   picks for the same slot cannot both commit (one fails and triggers a
 *   reload + resync). Per-room promise queues (`enqueueRoomWrite`) serialize
 *   writes from this process; transactions serialize writes across processes.
 * - `syncToDb` / `flushRoomToDb` / `flushAllDrafts` are best-effort fallbacks
 *   invoked on `leave room` (when the room becomes empty), on `disconnect`,
 *   and on `SIGINT`/`SIGTERM`/`beforeExit`. They use a `WriteBatch` (no reads,
 *   last-writer-wins) so they never throw inside teardown paths; transactional
 *   handlers remain the authoritative write path during normal operation.
 */

type ServerState = {
  league: League;
  draftState: DraftState;
  chatMessages: ChatMessage[];
  playersByTeam: Record<string, TeamRoster>;
};

type ServerType = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type SocketType = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type UserRoomData = object;
const connectedUsers: Record<string, DecodedIdToken> = {};
const activeRooms: Record<string, Record<string, UserRoomData>> = {};
export const activeDrafts: Record<string, ServerState> = {};

/** Per-room promise chain so async Firestore writes from one process run serially. */
const roomWriteQueues: Record<string, Promise<void>> = {};

const enqueueRoomWrite = (room: string, task: () => Promise<void>) => {
  const prev = roomWriteQueues[room] || Promise.resolve();
  const next = prev
    .catch(() => {
      // A previous write failed; keep the chain alive.
    })
    .then(task);
  // Store a settled chain so later writers are not blocked by unhandled rejections.
  roomWriteQueues[room] = next.catch(() => {
    // Swallowed here; the caller still observes the original rejection via `next`.
  });
  return next;
};

/** Canonical Firestore doc id for a room (room key doubles as draft id). */
const resolveDraftId = (room: string): string => {
  const cached = activeDrafts[room];
  return cached?.draftState?.settings?.draftId || room;
};

/** Load draft state from Firestore and populate the in-memory cache. */
export const loadDraftRoom = async (room: string): Promise<ServerState> => {
  const { draftState, availablePlayers, selections, league } =
    await rebuildPlayersAndSelections(room);
  draftState.availablePlayers = availablePlayers;
  draftState.selections = selections;
  const state: ServerState = {
    league,
    chatMessages: activeDrafts[room]?.chatMessages || [],
    playersByTeam: buildPlayersByTeam(
      league.lineupSettings,
      draftState.settings.draftOrder,
      linearizeSelections(draftState.selections)
    ),
    draftState: { ...draftState, availablePlayers, selections },
  };
  activeDrafts[room] = state;
  return state;
};

/**
 * Atomically persist one pick: update the header (`currentPick`/`phase`),
 * write `selections/{pick}`, and remove the player from `availablePlayers`.
 * Aborts (throws) when the stored `currentPick` no longer matches, which
 * signals a concurrent pick won the race.
 */
const persistPickTransaction = async (
  draftId: string,
  selection: DraftPick,
  nextPick: number,
  nextPhase?: DraftPhase
): Promise<void> => {
  const draftRef = db.collection("drafts").doc(draftId);
  await db.runTransaction(async (t) => {
    const snap = await t.get(draftRef);
    if (!snap.exists) {
      throw new Error(`Draft ${draftId} does not exist`);
    }
    const stored = snap.data() as DraftState;
    if (
      typeof stored.currentPick === "number" &&
      stored.currentPick !== selection.pick
    ) {
      throw new Error(
        `Draft pick race: stored currentPick=${stored.currentPick} but attempted pick=${selection.pick}`
      );
    }
    const selectionRef = draftRef
      .collection("selections")
      .doc(selection.pick.toString());
    t.set(selectionRef, selection);
    if (selection.player) {
      t.delete(
        draftRef.collection("availablePlayers").doc(selection.player.fullName)
      );
    }
    // Header update: advance the cursor (and optionally the phase on completion).
    // Spread-free update keeps unrelated header fields intact.
    const headerUpdate: Partial<DraftState> = { currentPick: nextPick };
    if (nextPhase) {
      headerUpdate.phase = nextPhase;
    }
    t.update(draftRef, headerUpdate);
  });
};

/** Atomically persist a phase change on the draft header. */
const persistPhaseTransaction = async (
  draftId: string,
  phase: DraftPhase
): Promise<void> => {
  const draftRef = db.collection("drafts").doc(draftId);
  await db.runTransaction(async (t) => {
    const snap = await t.get(draftRef);
    if (!snap.exists) {
      throw new Error(`Draft ${draftId} does not exist`);
    }
    t.update(draftRef, { phase });
  });
};

/**
 * Best-effort full-state flush (header + selections + available players
 * re-adds are NOT reconciled here; header + the single `draftPick` write are
 * covered). Used only as a fallback on disconnect/process exit — the
 * transactional paths above are authoritative during normal operation.
 */
export const flushRoomToDb = async (
  room: string,
  draftPick?: DraftPick
): Promise<void> => {
  const state = activeDrafts[room];
  if (!state) {
    return;
  }
  const draftId = resolveDraftId(room);
  const draftRef = db.collection("drafts").doc(draftId);
  const batch = db.batch();
  if (draftPick) {
    batch.set(
      draftRef.collection("selections").doc(draftPick.pick.toString()),
      draftPick,
      { merge: true }
    );
    if (draftPick.player) {
      batch.delete(
        draftRef.collection("availablePlayers").doc(draftPick.player.fullName)
      );
    }
  }
  const { availablePlayers, selections, ...rest } = state.draftState;
  void availablePlayers;
  void selections;
  batch.set(draftRef, rest, { merge: true });
  await batch.commit();
};

/** Best-effort flush of every cached draft (process teardown path). */
export const flushAllDrafts = async (): Promise<void> => {
  await Promise.allSettled(
    Object.keys(activeDrafts).map((room) => flushRoomToDb(room))
  );
};

let persistenceHooksRegistered = false;
/** Flush in-memory drafts on process teardown. Best-effort: logs, never throws. */
export const registerPersistenceHooks = () => {
  if (persistenceHooksRegistered) {
    return;
  }
  persistenceHooksRegistered = true;
  const flush = (signal: string) => {
    console.info(`Received ${signal}; flushing draft state to Firestore...`);
    flushAllDrafts()
      .then(() => console.info("Draft state flush complete"))
      .catch((e) => console.error("Draft state flush failed", e));
  };
  process.once("SIGINT", () => flush("SIGINT"));
  process.once("SIGTERM", () => flush("SIGTERM"));
  process.once("beforeExit", () => flush("beforeExit"));
};

export class DraftSocket {
  io: ServerType;
  socket: SocketType;
  uid: string;
  league: League;

  constructor(socket: SocketType, io: ServerType, user: DecodedIdToken) {
    this.io = io;
    this.socket = socket;
    this.uid = user.uid;
    socket.on("disconnect", () => void this.onDisconnect());
    socket.on("join room", (room) => void this.onJoinRoom(room));
    socket.on("leave room", (room) => this.onLeaveRoom(room));
    socket.on("draftPick", (pick, room) => void this.onDraftPick(pick, room));
    socket.on("sendMessage", (message, room) =>
      this.onChatMessage(message, room)
    );
    socket.on("updateDraftPhase", (phase, room) =>
      void this.onUpdateDraftPhase(phase, room)
    );
    socket.on("undoLastPick", (room) => void this.onUndoPick(room));
    socket.on("autoPick", (room) => void this.onAutoPick(room));
  }

  /**
   * Legacy entry point kept for compatibility; now a best-effort batched
   * fallback. Prefer the transactional `persist*` helpers on live paths.
   */
  async syncToDb(roomId: string, draftPick?: DraftPick): Promise<void> {
    try {
      await flushRoomToDb(roomId, draftPick);
    } catch (e) {
      console.error(`syncToDb fallback failed for room ${roomId}`, e);
    }
  }

  async onDisconnect() {
    const rooms = Object.entries(activeRooms)
      .filter(([, users]) => users[this.uid])
      .map(([room]) => room);
    rooms.forEach((room) => this.onLeaveRoom(room));
    delete connectedUsers[this.uid];
    // Fallback: rooms that just became empty may hold picks not yet
    // transactionally committed (e.g. server killed mid-write); flush them.
    await Promise.allSettled(rooms.map((room) => flushRoomToDb(room)));
  }

  async onJoinRoom(room: string) {
    this.socket.join(room);
    if (!activeRooms[room]) {
      activeRooms[room] = {};
    }
    // Reload from Firestore whenever the room is not cached (e.g. after a
    // server restart or when another instance created the draft).
    let state = activeDrafts[room];
    if (!state) {
      try {
        state = await loadDraftRoom(room);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    activeRooms[room][this.uid] = {};
    console.info("user", connectedUsers[this.uid]?.email, "joined room", room);
    this.socket.emit("sync", activeDrafts[room].draftState, {
      playersByTeam: activeDrafts[room].playersByTeam,
    });
    if (activeDrafts[room].league.commissioners.includes(this.uid)) {
      this.socket.emit("isCommissioner");
    }
  }

  onLeaveRoom(room: string) {
    this.socket.leave(room);
    if (activeRooms[room]) {
      delete activeRooms[room][this.uid];
      console.info(
        "user",
        connectedUsers[this.uid]?.email,
        "left room",
        room
      );
      // Fallback: last user out — flush so a restart loses nothing.
      if (Object.keys(activeRooms[room]).length === 0) {
        void flushRoomToDb(room).catch((e) =>
          console.error(`flush on leave failed for room ${room}`, e)
        );
      }
    }
  }

  async onDraftPick(selection: DraftPick, room: string, autoPick?: boolean) {
    console.log("room", room, "received pick", selection);
    let state = activeDrafts[room];
    if (!state) {
      try {
        state = await loadDraftRoom(room);
      } catch (e) {
        console.error(`draftPick for unknown room ${room}`, e);
        return;
      }
    }
    // Validate against the in-memory cursor before mutating.
    const expectedPick = state.draftState.currentPick;
    if (selection.pick !== expectedPick) {
      console.error(
        `Stale pick: got ${selection.pick} but currentPick=${expectedPick}. Reloading.`
      );
      try {
        const fresh = await loadDraftRoom(room);
        this.socket.emit("sync", fresh.draftState, {
          playersByTeam: fresh.playersByTeam,
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    if (!selection.player) {
      console.error("draftPick without a player");
      return;
    }
    const { round, pickInRound } = getCurrentPickInfo(state.draftState);
    const existing = state.draftState.selections[round]?.[pickInRound];
    if (existing?.player) {
      console.error(`Pick ${selection.pick} already filled; reloading.`);
      try {
        const fresh = await loadDraftRoom(room);
        this.socket.emit("sync", fresh.draftState, {
          playersByTeam: fresh.playersByTeam,
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    const availableIdx = state.draftState.availablePlayers.findIndex(
      (p) => p.sanitizedName === selection.player.sanitizedName
    );
    if (availableIdx === -1) {
      console.error(
        `Player ${selection.player.fullName} no longer available; reloading.`
      );
      try {
        const fresh = await loadDraftRoom(room);
        this.socket.emit("sync", fresh.draftState, {
          playersByTeam: fresh.playersByTeam,
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    state.draftState.selections[round][pickInRound] = selection;
    state.draftState.availablePlayers.splice(availableIdx, 1);
    addPlayerToTeam(state.playersByTeam, selection);
    state.draftState.currentPick += 1;
    const nextPick = state.draftState.currentPick;
    const commissionerSelection = this.uid !== selection.selectedBy.owner;
    const pickMessage: ChatMessage = {
      sender: "system",
      message: `Pick ${selection.pick}: ${
        commissionerSelection ? "Commissioner" : ""
      } ${connectedUsers[this.uid]?.email} ${autoPick ? "auto" : ""}selects ${
        selection.player.fullName
      }, ${selection.player.position}, ${selection.player.team}`,
      timestamp: new Date().toISOString(),
      type: "draft",
    };
    const totalPicks =
      state.draftState.settings.draftOrder.length *
      state.draftState.settings.numRounds;
    const isComplete = nextPick >= totalPicks;
    const draftId = resolveDraftId(room);
    try {
      await enqueueRoomWrite(room, () =>
        persistPickTransaction(
          draftId,
          selection,
          nextPick,
          isComplete ? "postdraft" : undefined
        )
      );
    } catch (e) {
      console.error(`Pick ${selection.pick} lost a Firestore race`, e);
      // Roll back the optimistic in-memory mutation by reloading truth.
      try {
        const fresh = await loadDraftRoom(room);
        this.io.to(room).emit("sync", fresh.draftState, {
          message: {
            sender: "system",
            message: `Pick ${selection.pick} conflicted with a concurrent pick; state reloaded.`,
            timestamp: new Date().toISOString(),
            type: "draft",
          },
          playersByTeam: fresh.playersByTeam,
        });
      } catch (reloadError) {
        console.error(reloadError);
      }
      return;
    }
    if (isComplete) {
      this.onEndDraft(room, selection);
      return;
    }
    this.io.to(room).emit("sync", state.draftState, {
      message: pickMessage,
      draftPick: selection,
      playersByTeam: state.playersByTeam,
    });
  }

  onChatMessage(message: string, room: string) {
    console.log("room", room, "received message", message);
    const newMessage: ChatMessage = {
      sender: connectedUsers[this.uid]?.email,
      message,
      timestamp: new Date().toISOString(),
      type: "chat",
    };
    this.io.to(room).emit("newMessage", newMessage);
  }

  async onUpdateDraftPhase(phase: DraftPhase, room: string) {
    console.log("room", room, "updated to phase", phase);
    let state = activeDrafts[room];
    if (!state) {
      try {
        state = await loadDraftRoom(room);
      } catch (e) {
        console.error(`updateDraftPhase for unknown room ${room}`, e);
        return;
      }
    }
    state.draftState.phase = phase;
    const draftId = resolveDraftId(room);
    try {
      await enqueueRoomWrite(room, () =>
        persistPhaseTransaction(draftId, phase)
      );
    } catch (e) {
      console.error(`Phase update for room ${room} failed`, e);
      try {
        const fresh = await loadDraftRoom(room);
        this.io.to(room).emit("sync", fresh.draftState, {
          playersByTeam: fresh.playersByTeam,
        });
      } catch (reloadError) {
        console.error(reloadError);
      }
      return;
    }
    this.io.to(room).emit("sync", state.draftState, {
      message: {
        sender: "system",
        message: `Draft phase updated to ${phase}`,
        timestamp: new Date().toISOString(),
        type: "draft",
      },
    });
  }

  async onUndoPick(room: string) {
    console.log("room", room, "undid pick");
    let state = activeDrafts[room];
    if (!state) {
      try {
        state = await loadDraftRoom(room);
      } catch (e) {
        console.error(`undoLastPick for unknown room ${room}`, e);
        return;
      }
    }
    if (!state || state.draftState.currentPick === 0) {
      console.error("Pick undone in non-saved state");
      return;
    }
    const restoredPick = state.draftState.currentPick - 1;
    const { round, pickInRound } = getCurrentPickInfo(
      state.draftState,
      restoredPick
    );
    const lastSelection = state.draftState.selections[round]?.[pickInRound];
    if (!lastSelection?.player) {
      console.error("Nothing to undo at", round, pickInRound);
      return;
    }
    const removedPlayer = lastSelection.player;
    const undonePick: DraftPick = { ...lastSelection, player: null };
    // Optimistic in-memory undo.
    state.draftState.availablePlayers.push(removedPlayer);
    state.draftState.selections[round][pickInRound] = undonePick;
    state.draftState.currentPick = restoredPick;
    state.playersByTeam = buildPlayersByTeam(
      state.league.lineupSettings,
      state.draftState.settings.draftOrder,
      linearizeSelections(state.draftState.selections)
    );
    const draftId = resolveDraftId(room);
    try {
      await enqueueRoomWrite(room, async () => {
        const draftRef = db.collection("drafts").doc(draftId);
        await db.runTransaction(async (t) => {
          const snap = await t.get(draftRef);
          if (!snap.exists) {
            throw new Error(`Draft ${draftId} does not exist`);
          }
          const stored = snap.data() as DraftState;
          if (
            typeof stored.currentPick === "number" &&
            stored.currentPick !== restoredPick + 1
          ) {
            throw new Error(
              `Undo race: stored currentPick=${stored.currentPick} but expected ${
                restoredPick + 1
              }`
            );
          }
          t.set(
            draftRef.collection("selections").doc(undonePick.pick.toString()),
            undonePick
          );
          t.set(
            draftRef.collection("availablePlayers").doc(removedPlayer.fullName),
            removedPlayer
          );
          t.update(draftRef, { currentPick: restoredPick });
        });
      });
    } catch (e) {
      console.error(`Undo for room ${room} lost a Firestore race`, e);
      try {
        const fresh = await loadDraftRoom(room);
        this.io.to(room).emit("sync", fresh.draftState, {
          playersByTeam: fresh.playersByTeam,
        });
      } catch (reloadError) {
        console.error(reloadError);
      }
      return;
    }
    const undoMessage: ChatMessage = {
      sender: "system",
      message: `Commissioner ${
        connectedUsers[this.uid]?.email
      } undid Round ${round}, Pick ${pickInRound}`,
      timestamp: new Date().toISOString(),
      type: "draft",
    };
    this.io.to(room).emit("sync", state.draftState, {
      message: undoMessage,
      playersByTeam: state.playersByTeam,
    });
  }

  async onAutoPick(room: string) {
    let state = activeDrafts[room];
    if (!state) {
      try {
        state = await loadDraftRoom(room);
      } catch (e) {
        console.error(`autoPick for unknown room ${room}`, e);
        return;
      }
    }
    if (!state) {
      console.error("Autopick in non-live draft");
      return;
    }
    const { round, pickInRound } = getCurrentPickInfo(state.draftState);
    const selection = state.draftState.selections[round]?.[pickInRound];
    if (!selection) {
      console.error("Autopick found no pending selection");
      return;
    }
    if (selection.player) {
      console.error("Autopick on an already-filled pick; reloading.");
      try {
        const fresh = await loadDraftRoom(room);
        this.io.to(room).emit("sync", fresh.draftState, {
          playersByTeam: fresh.playersByTeam,
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    if (state.draftState.availablePlayers.length === 0) {
      console.error("Autopick with no available players");
      return;
    }
    // Copy so concurrent autoPicks validate against distinct player choices
    // inside onDraftPick (which re-checks availability + runs a transaction).
    const autoSelection: DraftPick = {
      ...selection,
      player: state.draftState.availablePlayers[0],
    };
    console.log("room", room, "autopicked", autoSelection);
    await this.onDraftPick(autoSelection, room, true);
  }

  onEndDraft(room: string, lastPick: DraftPick) {
    console.log("room", room, "ended draft");
    const state = activeDrafts[room];
    if (!state) {
      console.error("End draft in non-live draft");
      return;
    }
    state.draftState.phase = "postdraft";
    const playersByTeam = buildPlayersByTeam(
      state.league.lineupSettings,
      state.draftState.settings.draftOrder,
      linearizeSelections(state.draftState.selections)
    );
    Object.entries(playersByTeam).forEach(([team, lineup]) => {
      const linearizedLineup: RosteredPlayer[] = [];
      for (const pos of Object.keys(lineup)) {
        for (const player of lineup[pos as Position]) {
          if (player.team !== "None") {
            const playerToAdd = JSON.parse(
              JSON.stringify(
                new RosteredPlayer(
                  player.fullName,
                  player.team,
                  player.position
                )
              )
            );
            linearizedLineup.push(playerToAdd);
          }
        }
      }
      db.collection("teams")
        .doc(team)
        .update({ rosteredPlayers: linearizedLineup });
    });
    void this.syncToDb(room, lastPick);
    this.io.to(room).emit("sync", state.draftState, {
      message: {
        sender: "system",
        message: `Draft complete!`,
        timestamp: new Date().toISOString(),
        type: "draft",
      },
      draftPick: lastPick,
    });
  }
}

export const initSocket = async (io: ServerType) => {
  registerPersistenceHooks();
  io.use((socket: SocketType, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    auth
      .verifyIdToken(token)
      .then((decodedIdToken: DecodedIdToken) => {
        connectedUsers[decodedIdToken.uid] = decodedIdToken;
        socket.data.user = decodedIdToken;
        next();
      })
      .catch((error: Error) => {
        next(error);
      });
  });
  db.collection("drafts")
    .where("phase", "==", "live")
    .get()
    .then((liveDrafts) => {
      liveDrafts.forEach(async (doc) => {
        try {
          await loadDraftRoom(doc.id);
        } catch (e) {
          console.error(`Failed to preload live draft ${doc.id}`, e);
        }
      });
    })
    .catch((e) => {
      console.warn(
        "Skipping live-draft preload: Firestore unavailable (missing SERVICE_ACCOUNT?).",
        e instanceof Error ? e.message : e
      );
    });
  io.on("connection", (socket) => {
    connectedUsers[socket.data.user.uid] = socket.data.user;
    new DraftSocket(socket, io, socket.data.user);
  });
};
