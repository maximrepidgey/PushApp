/* Fetch */

/**
 * @function doFetchRequest
 * @param {String} method The method of the Fetch request. One of: "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
 * @param {String} url The url of the API to call, optionally with parameters.
 * @param {Object} headers The Associative Array containing the Request Headers. It must be undefined if there are no headers.
 * @param {String} body The body String to be sent to the server. It must be undefined if there is no body.
 * @returns {Promise} which receives the HTTP response.
 */
async function doFetchRequest(method, url, headers, body) {
    try {
        if (checkMethodAndBody(method, body)) {
            return await fetch(url, {
                method: method,
                headers: headers,
                body: body
            });
            return result;
        } else {
            throw Error;
        }
    } catch (err) {
        throw err;
    }
}

/** @function doJSONRequest
 * @param {String} method The method of the Fetch request. One of: "GET", "POST", "PUT", "DELETE".
 * @param {String} url The url of the API to call, optionally with parameters.
 * @param {Object} headers The Associative Array containing the Request Headers. It must be undefined if there are no headers.
 * @param {Object} body The object to be sent as JSON body to the server. It must be undefined if there is no body.
 * @returns {Promise} which receives directly the object parsed from the response JSON.
 */
async function doJSONRequest(method, url, headers, body) {
    try {
        if (checkMethodHeadersAndBody(headers, method, body)) {
            headers["Accept"] = "application/json";
            headers["Content-Type"] = "application/json";

            let result = await doFetchRequest(method, url, headers, JSON.stringify(body));
            return result.json();
        } else {
            throw Error;
        }
    } catch (err) {
        throw err;
    }
}

// async function doFetch(method, url, headers, body) {
//   const result = await doFetchRequest(method, url, headers, JSON.stringify(body));
//   return result.json();
// }

function checkMethodAndBody(method, body) {
    switch (method) {
        case "GET":
        case "DELETE":
        case "OPTIONS":
        case "HEAD":
            return typeof body == "undefined";
        case "POST":
        case "PATCH":
        case "PUT":
            return typeof body == "string";
        default:
            return false;
    }
}

function checkMethodHeadersAndBody(headers, method, body) {
    if ((headers["Content-Type"] && headers["Content-Type"] !== "application/json") || (headers["Accept"] && headers["Accept"] !== "application/json")) {
        return false;
    }
    if (typeof body != "undefined" && typeof body != "object" && !Array.isArray(body)) {
        return false;
    }
    return true;
}
