/**

Assuming a send/onReceive message passing API, we can use nonce and Promise to build an RPC.

This can be outside of the core.

Actually, it probably makes sense to merge the two...

WebView JavaScript:

    var server = new WebViewRPCServer(ReactWebView,{
      plus(a,b) {
        return a+b;
      },

      multiply(c,d) {
        return c*d;
      },
    });

ReactNative JavaScript:

    var client = new WebViewRPCClient($webview);

    client.call("plus",[2,3]).then(result => {
      console.log(result);
      // => 5
    });

    client.call("multiply",[2,3]).then(result => {
      console.log(result);
      // => 6
    });

    // timeout... probably useful if the otherside makes network request.

    client.call("multiply",[2,3],1000).then(result => {
      console.log(result);
      // => 6
    }).catch(err => {

    });

    // In ReactNative

    componentDidMount() {
      this.rpc = new WebViewRPC($webview);

      client.call("plus",[2,3]).then(result => {
        console.log(result);
        // => 5
      });
    }

    // In WebView

    this.rpc = new WebViewRPC(ReactNativeWebView,{
      plus(a,b) {
        return a+b;
      },

      multiply(c,d) {
        return c*d;
      },
    });
*/

const WebViewRPCMessageType = {
  // @param payload {type, nonce, result, error}
  WebViewRPCResponse: "WebViewRPCResponse",

  // @param payload {type, nonce, method, args}
  WebViewRPCRequest: "WebViewRPCRequest",
}

class ReactNativeWebViewRPC {
  constructor(obj,handler=undefined) {
    this._send = obj.send.bind(obj);
    // this._onReceive = obj.onReceive.bind(obj);

    this._nonce = 0;

    this._callResolvers = {};
    this._callRejecters = {};

    this._handler = handler;
  }

  // @param payload {type, nonce, method, args}
  _handleRequest(payload) {
    const {nonce,method,args} = payload;

    if(this._handler == null) {
      // TODO should return error?
      return {
        nonce,
        result: null,
        error: `RPC service not available`
      }
    }

    let fn = this._handler[method];
    if(fn == null) {
      // TODO should return error?
      return {
        nonce,
        result: null,
        error: `RPC method not available: ${method}`
      }
    }

    let error, result;

    try {
      result = fn.apply(this._handler,args);
    } catch(e) {
      error = e;
    }

    return {
      type: WebViewRPCMessageType.WebViewRPCResponse,
      nonce,
      result,
      error,
    }
  }

  // @param payload {type, nonce, result, error}
  _handleResponse(payload) {
    const {nonce,result,error} = payload;

    let resolve = this._callResolvers[nonce];
    delete this._callResolvers[nonce];

    let rejecto = this._callRejecters[nonce];
    delete this._callRejecters[nonce];

    if(error) {
      reject(error);
      return;
    }

    resolve(result);
  }

  call(method,args) {
    return new Promise((resolve,reject) => {
      let nonce = this._nonce;
      this._callResolvers[nonce] = resolve;
      this._callRejecters[nonce] = reject;

      this._send({
        type: WebViewRPCMessageType.WebViewRPCRequest,
        nonce,
        method,
        args,
      });

      this._nonce++;
    });
  }

  onReceive(payload) {
    if(payload.type === WebViewRPCMessageType.WebViewRPCRequest) {
      const responsePayload = this._handleRequest(payload)
      this._send(responsePayload)
      return;
    }

    if(payload.type === WebViewRPCMessageType.WebViewRPCResponse) {
      this._handleResponse(payload);
      return;
    }
  }
}

export default ReactNativeWebViewRPC;