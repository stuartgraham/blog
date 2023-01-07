function handler(event) {
    var response = event.response;
    var request = event.request;

    console.log(request);
    console.log(response);

    // Extract the request from the CloudFront event
    console.log(request.uri);

    var uri = request.uri;

    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }

    return request;
}