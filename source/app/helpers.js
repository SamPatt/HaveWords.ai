"use strict";

/* 

    helpers

    utility methods and functions

*/

// --- String ---

Object.defineSlot(String.prototype, "capitalized", function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
});

Object.defineSlot(String.prototype, "convertToParagraphs", function() {
  // Split the text into paragraphs using double newline characters
  const paragraphs = this.split(/\n{2,}/g);

  // Wrap each paragraph in a <p> tag
  const html = paragraphs
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return html;
});

Object.defineSlot(String.prototype, "after", function(s) {
  const i = this.indexOf(s);
  if (i === -1) {
    return "";
  }
  return this.substr(i + s.length);
});

Object.defineSlot(String.prototype, "isValidJSON", function() {
  try {
    const parsedJSON = JSON.parse(this);
    return true;
  } catch (error) {
    return false;
  }
});

Object.defineSlot(String.prototype, "isValidXml", function() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(this, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  return errorNode ? false : true;
});

Object.defineSlot(String.prototype, "removeWhitespace", function() {
  try {
    const parsedJSON = JSON.parse(this);
    const cleanedJSONString = JSON.stringify(parsedJSON);
    return cleanedJSONString;
  } catch (error) {
    console.error("Error while removing whitespace from JSON:", error);
    return jsonString;
  }
});

Object.defineSlot(String.prototype, "copyToClipboard", function() {
  // not the right place for this method, but ok for now
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(this);
  }
  return Promise.reject("The Clipboard API is not available.");
});

Object.defineSlot(String.prototype, "isHexadecimal", function() {
  const regexp = /^[0-9a-fA-F]+$/;
  return regexp.test(this);
});

Object.defineSlot(String.prototype, "removedHtmlTags", function() {
  return this.replace(/<[^>]*>/g, '');
});

// Base32Hex character set

Object.defineSlot(String.prototype, "stringToBase32Hex", function() {
  const base32HexChars = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  let output = '';
  for (let i = 0; i < this.length; i++) {
    const charCode = this.charCodeAt(i);
    const index1 = (charCode >> 4) & 0x0f; // Get the first 4 bits
    const index2 = charCode & 0x0f; // Get the last 4 bits
    output += base32HexChars[index1] + base32HexChars[index2];
  }
  return output;
});

Object.defineSlot(String.prototype, "base32HexToString", function() {
  const base32HexChars = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  let output = '';
  for (let i = 0; i < this.length; i += 2) {
    const index1 = base32HexChars.indexOf(this[i]);
    const index2 = base32HexChars.indexOf(this[i + 1]);
    const charCode = (index1 << 4) + index2;
    output += String.fromCharCode(charCode);
  }
  return output;
});

// HTML word wrapping

/*
function Element_asJson(element) {
  const nodes = Array.from(element.childNodes);
  const json = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.nodeType === Node.TEXT_NODE) {
      json.push(node.textContent);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      json.push({ type: node.className, children: Element_asJson(node) });
    } else {
      json.push(null);
    }
  }
  return json;
}
*/

function Element_wrapWordsWithSpanClassName(element, className) {
  const nodes = Array.from(element.childNodes);

  for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
          const span = document.createElement('span');
          span.className = className;
          //span.nodeValue = node.nodeValue;
          span.textContent = node.textContent;
          //debugger;
          element.replaceChild(span, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
          Element_wrapWordsWithSpanClassName(node, className);
      }
  }
}

Object.defineSlot(String.prototype, "wrapHtmlWordsWithSpanClass", function(className) {
  const s = "<!DOCTYPE html><head><body>" + this + "</body></html>"
  //console.log("wrapHtmlWordsWithSpanClass [[" + s + "]]");
  const parser = new DOMParser();
  const doc = parser.parseFromString(s, 'text/html');
  //console.log("wrapping doc: ", JSON.stringify(Element_asJson(doc), 2, 2));
  Element_wrapWordsWithSpanClassName(doc.body, className);
  //console.log("after doc: ",  JSON.stringify(Element_asJson(doc), 2, 2));
  return doc.body.innerHTML;
});

// --- Map ---

/*
Object.defineSlot(Map.prototype, "map", function(f) {
  return this.valuesArray().map(f)
});
*/

Object.defineSlot(Map.prototype, "valuesArray", function() {
  return Array.from(this.values())
});

Object.defineSlot(Map.prototype, "keysArray", function() {
  return Array.from(this.keys())
});


Object.defineSlot(Map.prototype, "forEachKV", function(f) {
  this.forEach((v, k) => { 
    f(k, v);
   })
});

// --- Uint8Array ---

Object.defineSlot(Uint8Array.prototype, "base64encoded", function() {
  // Convert the byte array to a string with Latin-1 encoding
  const latin1String = new TextDecoder('iso-8859-1').decode(this);
  // Encode the Latin-1 string to a base64 string
  const base64String = btoa(latin1String);
  return base64String;
});

// --- Blob ---

Object.defineSlot(Blob.prototype, "asyncToDataUrl", function() {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function () {
        const base64data = reader.result;
        resolve(base64data);
    }
    reader.onerror = reject;
    reader.readAsDataURL(this);
  });
});

Object.defineSlot(Blob, "asyncFromDataUrl", async function(dataUrlString) {
  const response = await fetch(dataUrlString);
  return await response.blob();
});


// --- HTML validation ----------------------------------------

Object.defineSlot(String.prototype, "isValidHtml", function() {
  return simpleValidateHtmlStr(this) === true;
});


function simpleValidateHtmlStr(htmlStr, strictBoolean) {
  if(typeof htmlStr!=="string")
    return false;

  let validateHtmlTag=new RegExp("<[a-z]+(\s+|\"[^\"]*\"\s?|'[^']*'\s?|[^'\">])*>","igm"),
    sdom=document.createElement('div'),
    noSrcNoAmpHtmlStr=htmlStr
      .replace(/ src=/," svhs___src=")
      .replace(/&amp;/igm,"#svhs#amp##"),
    noSrcNoAmpIgnoreScriptContentHtmlStr=noSrcNoAmpHtmlStr
      .replace(/\n\r?/igm,"#svhs#nl##") // temporarily remove line breaks
      .replace(/(<script[^>]*>)(.*?)(<\/script>)/igm,"$1$3")
      .replace(/#svhs#nl##/igm,"\n\r"),  // re-add line breaks
    htmlTags=noSrcNoAmpIgnoreScriptContentHtmlStr.match(/<[a-z]+[^>]*>/igm),
    htmlTagsCount=htmlTags? htmlTags.length:0,
    tagsAreValid,resHtmlStr;

  //console.log(noSrcNoAmpHtmlStr,noSrcNoAmpIgnoreScriptContentHtmlStr,htmlTags);

  if(!strictBoolean) {
    // ignore <br/> conversions
    noSrcNoAmpHtmlStr=noSrcNoAmpHtmlStr.replace(/<br\s*\/>/,"<br>")
  }

  if(htmlTagsCount) {
    tagsAreValid=htmlTags.reduce(function(isValid,tagStr) {
      return isValid&&tagStr.match(validateHtmlTag);
    },true);

    if(!tagsAreValid) {
      return false;
    }
  }


  try {
    sdom.innerHTML=noSrcNoAmpHtmlStr;
  } catch(err) {
    return false;
  }

  if(sdom.querySelectorAll("*").length!==htmlTagsCount) {
    return false;
  }

  resHtmlStr=sdom.innerHTML.replace(/&amp;/igm,"&"); // undo '&' encoding

  if(!strictBoolean) {
    // ignore empty attribute normalizations
    resHtmlStr=resHtmlStr.replace(/=""/,"")
  }

  // compare html strings while ignoring case, quote-changes, trailing spaces
  let
    simpleIn=noSrcNoAmpHtmlStr.replace(/["']/igm,"").replace(/\s+/igm," ").toLowerCase().trim(),
    simpleOut=resHtmlStr.replace(/["']/igm,"").replace(/\s+/igm," ").toLowerCase().trim();
  if(simpleIn===simpleOut)
    return true;

  //console.log(simpleIn,simpleOut);

  return resHtmlStr.replace(/ svhs___src=/igm," src=").replace(/#svhs#amp##/,"&amp;");
}