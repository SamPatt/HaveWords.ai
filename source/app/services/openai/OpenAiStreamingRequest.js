"use strict";

/* 
    OpenAiStreamingRequest

*/

(class OpenAiStreamingRequest extends OpenAiRequest {
  initPrototypeSlots() {
    this.newSlot("client", null);
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  setBodyJson(json) {
    this.setBody(JSON.stringify(json));
    return this;
  }

  requestOptions() {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey()}`,
      },
      body: this.body(),
    };
  }

  async asyncSend() {
    this.assertValid();

    const requestOptions = this.requestOptions();
    let data = undefined;

    this.debugLog(
      " send request apiUrl:" + this.apiUrl() + "options: \n",
      requestOptions
    );
    
    const response = await fetch(this.apiUrl(), requestOptions);
    data = await response.json();
    /*
    } catch (error) {
      this.reportError(error)
    }
    */
    return data;
  }

  client() {
    if (!this._client) {
      this._client = new openai.Client({
        api_key: this.apiKey(),
      });
    }
    return this._client;
  }
}).initThisClass();

async function fetchData() {
  try {
    const response = await fetch('https://your-url.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'value'
      })
    });

    const reader = response.body.getReader();
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({done, value}) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          })
          .catch(error => {
            console.error(error);
            controller.error(error);
          });
        }
        push();
      }
    });

    const streamResponse = new Response(stream, { headers: { "Content-Type": "text/html" } });
    const result = await streamResponse.text();
    console.log(result);
  } catch(error) {
    console.error(error);
  }
}

//fetchData();