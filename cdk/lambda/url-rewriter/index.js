'use strict';
exports.handler = (event, context, callback) => {
    
    // Extract the request from the CloudFront event that is sent to Lambda@Edge 
    var request = event.Records[0].cf.request;

    // Extract the URI from the request
    var oldUrl = request.uri;


    // Verifies if url has trailing '/' adds if not
    var lastChar = oldUrl.substr(-1);
    if (lastChar != '/') {
        oldUrl = oldUrl + '/';  
    }


    // Match any '/' that occurs at the end of a URI. Replace it with a default index
    var newUrl = oldUrl.replace(/\/$/, '\/index.html');
    
    // Log the URI as received by CloudFront and the new URI to be used to fetch from origin
    console.log("Old URI: " + oldUrl);
    console.log("New URI: " + newUrl);
    
    // Replace the received URI with the URI that includes the index page
    request.uri = newUrl;
    
    // Return to CloudFront
    return callback(null, request);

};