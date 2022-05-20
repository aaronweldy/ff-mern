import { useParams } from "react-router-dom";
import { useTeams } from "../../../hooks/query/useTeams";
import { useTradesForUser } from "../../../hooks/query/useTradesForUser";
import { MdCompareArrows } from "react-icons/md";
import "./style.css";
import { InlineTeamTile } from "../../shared/InlineTeamTile";
import { useTradeMutations } from "../../../hooks/query/useTradeMutations";
import { toast } from "react-toastify";
import { UseMutationResult } from "react-query";

const toastPromise = <T extends UseMutationResult<void, Error, string>>(
  query: T,
  tradeId: string,
  pendingMessage: string,
  successMessage: string,
  errorMessage: string
) => {
  toast.promise(query.mutateAsync(tradeId), {
    pending: {
      render: pendingMessage,
      position: toast.POSITION.TOP_CENTER,
    },
    success: {
      render: successMessage,
      position: toast.POSITION.TOP_CENTER,
    },
    error: {
      render: errorMessage,
      position: toast.POSITION.TOP_CENTER,
    },
  });
};

export const ViewTrades = () => {
  const { id } = useParams() as { id: string };
  const tradesForUser = useTradesForUser();
  const { query: teamsQuery } = useTeams(id);
  const { cancelQuery, rejectQuery, acceptQuery } = useTradeMutations(id);
  return (
    <div className="mt-3 trade-container">
      {tradesForUser.isSuccess && teamsQuery.isSuccess ? (
        tradesForUser.data.trades.map((trade) => (
          <div key={trade.id} className={`trade-row ${trade.status}`}>
            <MdCompareArrows className="trade-icon mr-3" />
            {trade.teamsInvolved.map((teamId, idx) => {
              return (
                <div className="team-trade-info" key={teamId}>
                  <div className="team-name">
                    {
                      teamsQuery.data?.teams.find(
                        (t) => t.id === trade.teamsInvolved[idx]
                      )?.name
                    }{" "}
                    receives...
                  </div>
                  {trade.players
                    .filter((player) => player.toTeam === teamId)
                    .map((player) => (
                      <div className="player-row" key={player.player.fullName}>
                        <div className="player-name-row">
                          {player.player.fullName}
                          <span className="position-text">
                            {player.player.position}
                          </span>
                        </div>
                        <div className="ml-3 mt-2">
                          <InlineTeamTile team={player.player.team} />
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}
            {(trade.status === "pending" || trade.status === "countered") && (
              <div className="d-flex flex-column ml-auto">
                {tradesForUser.data.userProposed[trade.id] ? (
                  <button
                    onClick={() =>
                      toastPromise(
                        cancelQuery,
                        trade.id,
                        "Cancelling trade...",
                        "Successfully cancelled trade!",
                        "Failed to cancel trade"
                      )
                    }
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                ) : (
                  <div className="button-row">
                    <button
                      onClick={() =>
                        toastPromise(
                          acceptQuery,
                          trade.id,
                          "Accepting trade...",
                          "Successfully accepted trade!",
                          "Failed to accept trade"
                        )
                      }
                      className="accept-button"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        toastPromise(
                          rejectQuery,
                          trade.id,
                          "Rejecting trade...",
                          "Successfully rejected trade!",
                          "Failed to reject trade"
                        )
                      }
                      className="reject-button w-100"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="spinning-loader" />
      )}
    </div>
  );
};
