function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
    if ((request.method === 'GET' || request.method === 'HEAD') &&
        uri !== '/api' && uri.indexOf('/api/') !== 0 &&
        lastSegment.indexOf('.') === -1) {
        request.uri = '/index.html';
    }
    return request;
}
