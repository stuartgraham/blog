function handler(event) {
    var response = event.response;
    var request = event.request;

    console.log(request);
    console.log(response);

    // Extract the request from the CloudFront event
    console.log(request.uri);

    return response;
}