import request from "request";
import Xray from 'x-ray';
import { Tabletojson as tabletojson } from 'tabletojson';
export const get = (url) => {
    return new Promise(function (resolve, reject) {
        request.get(url, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            if (response.statusCode >= 400) {
                return reject(new Error('The website requested returned an error!'));
            }
            Xray()(body, ['table@html'])((conversionError, tableHtmlList) => {
                if (conversionError) {
                    return reject(conversionError);
                }
                resolve(tableHtmlList.map((table) => {
                    // xray returns the html inside each table tag, and tabletojson
                    // expects a valid html table, so we need to re-wrap the table.
                    // Returning the first element in the converted array because
                    // we should only ever be parsing one table at a time within this map.
                    return tabletojson.convert('<table>' + table + '</table>')[0];
                }));
            });
        });
    });
};
//# sourceMappingURL=tableScraper.js.map