function handler(event) {
    var response = event.response;

    //console.log(request);
    console.log(response);

    // Extract the request from the CloudFront event
    console.log(response.uri);

    return response;
}