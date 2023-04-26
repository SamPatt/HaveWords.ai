"use strict";

/* 

    helpers

    utility methods and functions

*/

String.prototype.convertToParagraphs = function () {
  // Split the text into paragraphs using double newline characters
  const paragraphs = this.split(/\n{2,}/g);

  // Wrap each paragraph in a <p> tag
  const html = paragraphs
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return html;
};

String.prototype.isValidJSON = function () {
  try {
    const parsedJSON = JSON.parse(this);
    return true;
  } catch (error) {
    return false;
  }
};

String.prototype.removeWhitespace = function () {
  try {
    const parsedJSON = JSON.parse(this);
    const cleanedJSONString = JSON.stringify(parsedJSON);
    return cleanedJSONString;
  } catch (error) {
    console.error("Error while removing whitespace from JSON:", error);
    return jsonString;
  }
};
