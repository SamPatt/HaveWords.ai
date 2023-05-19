"use strict";

/* 
    ImageCropper

*/

(class ImageCropper extends Base {
  initPrototypeSlots() {
    this.newSlot("imageUrl", null);
    this.newSlot("boundsAsRatios", { x: 0, y: 0, w: 0.5, h: 0.5 }); //x, y, w, h
  }

  //loads the image at imageUrl, crops it using boundsAsRatios and then returns a dataURL with the cropped image
  async asyncCrop() {
    const bounds = this.boundsAsRatios();

    assert(this.imageUrl());
    assert(bounds != undefined);
    assert(bounds != null);
    assert(bounds.x >= 0);
    assert(bounds.x < 1);
    assert(bounds.y >= 0);
    assert(bounds.y < 1);
    assert(bounds.w > 0);
    assert(bounds.w <= 1);
    assert(bounds.h > 0);
    assert(bounds.h <= 1);
    
    const inputImage = new Image();
    inputImage.setAttribute('crossorigin', 'anonymous');

    const inputImageUrl = this.imageUrl();
    await new Promise((resolve, reject) => {
        inputImage.onload = () => resolve(inputImage);
        inputImage.onerror = reject;
        inputImage.src = inputImageUrl;
    });

    const canvas = document.createElement('canvas');
    const renderWidth = bounds.w*inputImage.width;
    const renderHeight = bounds.h*inputImage.height;
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    
    const context = canvas.getContext("2d");
    
    context.drawImage(inputImage, bounds.x*inputImage.width, bounds.y*inputImage.height, renderWidth, renderHeight, 0, 0, renderWidth, renderHeight);

    return canvas.toDataURL();
  }
}.initThisClass());

