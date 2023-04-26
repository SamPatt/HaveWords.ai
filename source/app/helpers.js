"use strict";

/* 

    helpers

    utility methods and functions

*/

String.prototype.convertToParagraphs = function () {
    
  // Split the text into paragraphs using double newline characters
  const paragraphs = this.split(/\n{2,}/g);

  // Wrap each paragraph in a <p> tag
  const html = paragraphs.map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join("");

  return html;
};
