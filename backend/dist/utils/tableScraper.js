var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import request from 'request';
import xray from 'x-ray';
import { tabletojson } from 'tabletojson';
const x = xray();
/**
 * Retrieve a web page and extract all tables from the HTML.
 * @param {string} url The URL of the page to retrieve.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of table data.
 */
export const get = (url) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        request.get(url, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            if (response.statusCode >= 400) {
                return reject(new Error('The website requested returned an error!'));
            }
            x(body, ['table@html'])((conversionError, tableHtmlList) => __awaiter(void 0, void 0, void 0, function* () {
                if (conversionError) {
                    return reject(conversionError);
                }
                const data = yield Promise.all(tableHtmlList.map((table) => {
                    // xray returns the html inside each table tag, and tabletojson
                    // expects a valid html table, so we need to re-wrap the table.
                    // Returning the first element in the converted array because
                    // we should only ever be parsing one table at a time within this map.
                    return tabletojson.convert('<table>' + table + '</table>')[0];
                }));
                resolve(data);
            }));
        });
    });
});
//# sourceMappingURL=tableScraper.js.map