import { SinglePosition, StoredPlayerInformation, DatabasePlayer } from "@ff-mern/ff-types";

export const getStatBreakdown = (position: SinglePosition, playerData: StoredPlayerInformation): string => {
    if (!playerData || !playerData.statistics) return "";

    const stats: DatabasePlayer = playerData.statistics;
    const breakdown: string[] = [];
    switch (position) {
        case "QB":
            breakdown.push(`${stats.CMP || '0'} CMP/${stats.ATT || '0'} ATT`);
            breakdown.push(`${stats.YDS || '0'} PaYd`);
            breakdown.push(`${stats.TD || '0'} PaTD`);
            breakdown.push(`${stats.INT || '0'} Int`);
            breakdown.push(`${stats.ATT_2 || '0'} Car`);
            breakdown.push(`${stats.YDS_2 || '0'} RuYd`);
            breakdown.push(`${stats.TD_2 || '0'} RuTD`);
            break;
        case "RB":
            breakdown.push(`${stats.ATT || '0'} Att`);
            breakdown.push(`${stats.YDS || '0'} RuYd`);
            breakdown.push(`${stats.TD || '0'} RuTD`);
            breakdown.push(`${stats.REC || '0'} Rec/${stats.TGT || '0'} Tgt`);
            breakdown.push(`${stats.YDS_2 || '0'} Rec Yd`);
            breakdown.push(`${stats.TD_2 || '0'} Rec TD`);
            break;
        case "WR":
        case "TE":
            breakdown.push(`${stats.REC || '0'} Rec/${stats.TGT || '0'} Tgt`);
            breakdown.push(`${stats.YDS || '0'} Rec Yd`);
            breakdown.push(`${stats.TD || '0'} Rec TD`);
            breakdown.push(`${stats.ATT_2 || '0'} RuAtt`);
            breakdown.push(`${stats.YDS_2 || '0'} RuYd`);
            breakdown.push(`${stats.TD_2 || '0'} RuTD`);
            break;
        case "K":
            const fgMade = parseInt(stats.FG || '0');
            const fgAttempts = parseInt(stats.FGA || '0');
            breakdown.push(`${fgMade}/${fgAttempts} FG`);
            breakdown.push(`${stats.XPT || '0'} XP`);
            break;
    }

    return breakdown.join(", ");
};