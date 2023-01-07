function handler(event) {
    var request = event.request;
    var response = event.response;

    console.log(request);
    console.log(response);

    // Extract the request from the CloudFront event
    var request = event.Records[0].cf.request;

    // Extract the URI from the request
    var sentUri = request.uri;
    console.log(sentUri);


    return response;
}