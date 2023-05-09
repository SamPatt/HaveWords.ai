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

Object.defineSlot(String.prototype, "isValidJSON", function() {
  try {
    const parsedJSON = JSON.parse(this);
    return true;
  } catch (error) {
    return false;
  }
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
