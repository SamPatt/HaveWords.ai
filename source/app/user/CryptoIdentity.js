"use strict";

/* 
    CryptoIdentity

    - generate and serialize/deserialize a key pair
    - sign a byteArray (using private key)
    - verify a byteArray (for a given public key)
    - provide a serialized version of the public key
      - example format: "SIjVYqrmAIP7E-H5uU-djOB94D6VHU7oe_7k0Jr9p3w@-xL0nZbla8imRgu0TGZjsl9nhQPvAvFKQnsYfML7sVw"

*/

(class CryptoIdentity extends Base {
  initPrototypeSlots() {
    this.newSlot("keyPair", null);
    this.newSlot("algorithm", {
      name: "ECDSA",
      namedCurve: "P-256",
      hash: { name: "SHA-256" },
    });
    this.newSlot("serializatonFormat", "jwk");
    //this.newSlot("keyUsages", ["encrypt", "decrypt", "sign", "verify"]);
    this.newSlot("keyUsages", ["sign", "verify"]);
    this.newSlot("extractable", true);
    this.newSlot("serializedPublicKey", null);
    this.newSlot("asJson", null);
  }

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  async asyncUpdate() {
    await this.asyncUpdateAsJson();
    await this.asyncUpdateSerializedPublicKey();
  }

  async asyncSetKeyPair(keyPair) {
    this._keyPair = keyPair;
    await this.asyncUpdate();
    return this;
  }

  async asyncUpdateSerializedPublicKey() {
    this.setSerializedPublicKey(await this.calcPublicKeyAsString());
    return this;
  }

  async calcPublicKeyAsString() {
    const json = await window.crypto.subtle.exportKey(
      this.serializatonFormat(),
      this.keyPair().publicKey
    );
    // not sure what's safe as a seperator
    const string = json.x + " " + json.y;
    const encoded = string.stringToBase32Hex()
    return encoded;
  }

  async asyncGenerate() {
    // Generate a public/private key pair using the RSASSA-PKCS1-v1_5 algorithm
    const keyPair = await window.crypto.subtle.generateKey(
      this.algorithm(),
      this.extractable(),
      this.keyUsages()
    );
    await this.asyncSetKeyPair(keyPair);
    this.debugLog(
      "generated pubkey string: ",
      await this.calcPublicKeyAsString()
    );
    return this;
  }

  async asyncUpdateAsJson() {
    const publicKey = await window.crypto.subtle.exportKey(
      this.serializatonFormat(),
      this.keyPair().publicKey
    );

    const privateKey = await window.crypto.subtle.exportKey(
      this.serializatonFormat(),
      this.keyPair().privateKey
    );

    const json = {
      serializatonFormat: this.serializatonFormat(),
      publicKey: publicKey,
      privateKey: privateKey,
      algorithm: this.algorithm(),
      keyUsages: this.keyUsages(),
      extractable: this.extractable(),
    };
    this.setAsJson(json);
  }

  static async asyncNewFromJson(json) {
    const cid = CryptoIdentity.clone();
    await cid.asyncFromJson(json);
    return cid;
  }

  async asyncFromJson(json) {
    this.setSerializatonFormat(json.serializatonFormat);
    this.setAlgorithm(json.algorithm);
    this.setExtractable(json.extractable);
    this.setKeyUsages(json.keyUsages);
    let keyPair;

    try {
      const publicKey = await window.crypto.subtle.importKey(
        json.serializatonFormat,
        json.publicKey,
        json.algorithm,
        json.extractable,
        ["verify"]
      );

      const privateKey = await window.crypto.subtle.importKey(
        json.serializatonFormat,
        json.privateKey,
        json.algorithm,
        json.extractable,
        ["sign"]
      );

      keyPair = { 
        publicKey: publicKey, 
        privateKey: privateKey 
      };
  
    } catch (e) {
      console.warn(e);
      debugger;
    }
    await this.asyncSetKeyPair(keyPair);
    return this;
  }

  static async asyncSelfTest() {
    const cid1 = CryptoIdentity.clone();

    await cid1.asyncGenerate();
    console.log("generated pubkey:", cid1.serializedPublicKey());

    const json = cid1.asJson();
    console.log("serialized:", json);

    const cid2 = await CryptoIdentity.clone().asyncFromJson(json);
    console.log("unserialized pubkey:", cid2.serializedPublicKey());
    debugger;
  }

  /*
  async signatureForByteArray(byteArray) {
    const signature = await window.crypto.subtle.sign(
      this.algorithm(),
      keyPair.privateKey,
      byteArray
    );
    return signature;
    //return new Uint8Array(signature);
  }

  async validateSignatureForPubKeyOnByteArray(publicKey, signature, byteArray) {
    const isValid = await window.crypto.subtle.verify(
      this.algorithm(),
      publicKey,
      signature,
      byteArray
    );
    return isValid;
  }
*/
}).initThisClass();

//CryptoIdentity.asyncSelfTest();
