'use strict';
exports.handler = (event, context, callback) => {
    
    // Extract the request from the CloudFront event that is sent to Lambda@Edge 
    var request = event.Records[0].cf.request;

    // Extract the URI from the request
    var oldUrl = request.uri;

    // If URL is referencing valid file extension then continue
    if (oldUrl.endsWith('.xml') ||
    oldUrl.endsWith('.css') ||
    oldUrl.endsWith('.js') || 
    oldUrl.endsWith('.html') ||
    oldUrl.endsWith('.png') ||
    oldUrl.endsWith('.jpg') ||
    oldUrl.endsWith('.jpeg') ||
    oldUrl.endsWith('.txt') ||
    oldUrl.endsWith('.json') ||
    oldUrl.endsWith('.ico') ||
    oldUrl.endsWith('.gif')
    ) {
        console.log('Valid file')
    } else {
    // Else wrangle URL to reference index.html
    // Verifies if url has trailing '/' adds if not
    oldUrl = oldUrl.replace(/\/?$/, '/');

    // Match any '/' that occurs at the end of a URI. Replace it with a default index
    var newUrl = oldUrl.replace(/\/$/, '\/index.html');
    }

    // Log the URI as received by CloudFront and the new URI to be used to fetch from origin
    console.log("Old URI: " + oldUrl);
    console.log("New URI: " + newUrl);
    
    // Replace the received URI with the URI that includes the index page
    request.uri = newUrl;
    
    // Return to CloudFront
    return callback(null, request);
};