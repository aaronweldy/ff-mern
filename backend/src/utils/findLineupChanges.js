"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLineupChanges = void 0;
// Finds the diff between the submitted lineups for a given team.
var findLineupChanges = function (prevWeekInfo, newWeekInfo) {
    var diff = [];
    var _loop_1 = function (i) {
        var prevWeeklyLineup = prevWeekInfo[i].finalizedLineup;
        var newWeeklyLineup = newWeekInfo[i].finalizedLineup;
        // Flatten the lineups & iterate over each position to find differences.
        Object.keys(prevWeeklyLineup).forEach(function (pos) {
            for (var j = 0; j < prevWeeklyLineup[pos].length; j++) {
                var prevPlayer = prevWeeklyLineup[pos][j];
                var newPlayer = newWeeklyLineup[pos][j];
                if (prevPlayer.fullName !== newPlayer.fullName) {
                    diff.push({
                        week: String(i),
                        newPlayer: newPlayer,
                        oldPlayer: prevPlayer,
                        position: pos,
                    });
                }
            }
        });
    };
    for (var i = 0; i < prevWeekInfo.length; i++) {
        _loop_1(i);
    }
    return diff;
};
exports.findLineupChanges = findLineupChanges;
