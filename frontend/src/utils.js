import league from "../../backend/src/model/league";

export async function userIsCommissioner(leagueId, userId) {
    const url = `/api/v1/leagues/${leagueId}/`;
    const data = await fetch(url);
    const json = await data.json();
    return json.commissioners.includes(userId);
}