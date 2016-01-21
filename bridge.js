// inspired by: https://github.com/alinz/react-native-webview-bridge/blob/master/ios/RCTWebViewBridge.m

window.ReactNativeWebViewMessageQueue = [];

const SCHEMA = 'react-webview-messages';

const sendQueue = window.ReactNativeWebViewMessageQueue;

function signalNative() {
  // will signal only for the first message.
  if(sendQueue.length != 1) {
    return;
  }

  window.location = SCHEMA + '://flush/' + new Date().getTime();
}

var ReactNativeWebView = {
  /**
  * @param json [string]
  */
  _receiveMessage: function(json) {
    var event = new Event(SCHEMA);

    try {
      event.payload = JSON.parse(json);
    } catch(e) {
      return;
    }

    // TODO: Does it run the event handlers asynchronously?
    // TODO: Does calling it with setImmediate help?
    window.dispatchEvent(event)
  },


  _flushMessages: function(opts={}) {

    // If there are no handlers, just throw away the messages.
    if(opts.discard === true) {
      sendQueue.length = 0;
      return "";
    }

    var messages = JSON.stringify(sendQueue) || "[]";
    // Reset qeuue without clearing memory
    sendQueue.length = 0;
    return messages;
  },

  /**
  *
  * @param message [JSON Object]
  */
  send: function(message) {
    sendQueue.push(message);
    signalNative();
  },

  onReceive: function(fn) {
    window.addEventListener(SCHEMA,(e) => {
      fn(e.payload);
    });
  }
};

window.ReactNativeWebView = ReactNativeWebView;

export default ReactNativeWebView;
