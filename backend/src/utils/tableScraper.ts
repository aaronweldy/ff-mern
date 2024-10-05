import request from 'request';
import xray from 'x-ray';
import { tabletojson } from 'tabletojson';
const x = xray();
/**
 * Retrieve a web page and extract all tables from the HTML.
 * @param {string} url The URL of the page to retrieve.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of table data.
 */
export const get = async (url: string): Promise<Array<any>> => {
    return new Promise<Array<any>>((resolve, reject) => {
        request.get(url, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            if (response.statusCode >= 400) {
                return reject(new Error('The website requested returned an error!'));
            }
            x(body, ['table@html'])(async (conversionError, tableHtmlList) => {
                if (conversionError) {
                    return reject(conversionError);
                }
                const data = await Promise.all(tableHtmlList.map((table: string) => {
                    // xray returns the html inside each table tag, and tabletojson
                    // expects a valid html table, so we need to re-wrap the table.
                    // Returning the first element in the converted array because
                    // we should only ever be parsing one table at a time within this map.
                    return tabletojson.convert('<table>' + table + '</table>')[0];
                }));
                resolve(data);
            });
        });
    });
};
