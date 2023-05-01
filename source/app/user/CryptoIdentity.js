"use strict";

/* 
    CryptoIdentity

*/

(class CryptoIdentity extends Base {
  initPrototypeSlots() {
    this.newSlot("publicKey", null);
    this.newSlot("privateKey", null);
    this.newSlot("algorithm", "RSASSA-PKCS1-v1_5");
    this.newSlot("hash", "SHA-256");
    this.newSlot("serializatonFormat", "jwk");
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  async generateKeyPair() {
    // Generate a public/private key pair using the RSASSA-PKCS1-v1_5 algorithm
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: this.algorithm(),
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: { name: "SHA-256" },
      },
      true,
      ["sign", "verify"]
    );
    this.setPublicKey(keyPair.publicKey);
    this.setPublicKey(keyPair.privateKey);
    //console.log("generated pubkey: ", LocalUser.shared().publicKey().base64encoded())
    return this;
  }

  async signatureForByteArray(byteArray) {
    const signature = await window.crypto.subtle.sign(
      { name: this.algorithm() },
      keyPair.privateKey,
      byteArray
    );
    return signature;
    //return new Uint8Array(signature);
  }

  async validateSignatureForPubKeyOnByteArray(publicKey, signature, byteArray) {
    const isValid = await window.crypto.subtle.verify(
      { name: this.algorithm() },
      publicKey,
      signature,
      byteArray
    );
    return isValid;
  }

  static selfTest() {
    //const byteArray = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]); // "Hello World" in ASCII
  }

  async serializedKey(key, format = "jwk") {
    const serializedKey = await window.crypto.subtle.exportKey(format, key);
    return serializedKey;
  }

  async unserializedKey(
    serializedKey,
    algorithm,
    keyUsages,
    format = "jwk"
  ) {
    const key = await window.crypto.subtle.importKey(
      format,
      serializedKey,
      algorithm,
      true,
      keyUsages
    );
    return key;
  }

  static async test() {
    // Serialize the public key
    const serializedPublicKey = await serializeCryptoKey(keyPair.publicKey);

    console.log("Serialized Public Key:", serializedPublicKey);

    // Unserialize the public key
    const unserializedPublicKey = await unserializeCryptoKey(
      serializedPublicKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" },
      },
      ["verify"]
    );

    console.log("Unserialized Public Key:", unserializedPublicKey);
  }
}.initThisClass());