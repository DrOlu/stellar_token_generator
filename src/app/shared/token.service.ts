import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  server;
  constructor(){
    this.init();
  }
  init(){
    if(environment.production){
      StellarSdk.Network.usePublicNetwork();
      this.server = new StellarSdk.Server(environment.Stellar.liveNetwork);
    }else{
      StellarSdk.Network.useTestNetwork();
      this.server = new StellarSdk.Server(environment.Stellar.testNetwork);
    }
  }

  // createToken(data) {
  //   console.log(data, StellarSdk);
  // }

  async createAsset(tokenData){
    console.log(tokenData);
    var issuerAcct:any = this.validateSeed(tokenData.issuerSecret);
    var distAcct:any = this.validateSeed(tokenData.distSecret);
    if (!issuerAcct) {
      console.log("Invalid Issuer Secret Key");
      return Promise.reject("Invalid Issuer Secret Key");
    }else{
      var asset = await this.generateAsset(tokenData.assetType, tokenData.assetCode, issuerAcct.publicKey());
    }
    if (!tokenData.amount || tokenData.amount <= 0 || Number.isNaN(tokenData.amount)) {
      console.log("Invalid Amount");
      return Promise.reject("Invalid Amount");
    }

    if (tokenData.issuerSecret == tokenData.distSecret) {
      console.log("Issuer and Distributor can not be the same");
      return Promise.reject("Issuer and Distributor can not be the same");
    }

    if (tokenData.distType) {
      if (!tokenData.distAmount || tokenData.distAmount <= 0 || Number.isNaN(tokenData.distAmount)) {
        console.log("Invalid Distribution Amount");
        return Promise.reject("Invalid Amount");
      }
      if (!tokenData.distPrice || tokenData.distPrice <= 0 || Number.isNaN(tokenData.distPrice)) {
        console.log("Invalid Distribution Price");
        return Promise.reject("Invalid Distribution Price");
      }
    }

    // override default server
    if (tokenData.networkType) {
      if (tokenData.networkType == 1) {
        StellarSdk.Network.useTestNetwork();
        this.server = new StellarSdk.Server(environment.Stellar.testNetwork);
      }

      if (tokenData.networkType == 2) {
        StellarSdk.Network.usePublicNetwork();
        this.server = new StellarSdk.Server(environment.Stellar.liveNetwork);
      }
    }
    // load issuer account
    return await this.server.loadAccount(issuerAcct.publicKey())
      .catch(StellarSdk.NotFoundError, function(error) {
        console.log('Issuer Account not active', error);
        // throw new Error('Invalid Account');
        return Promise.reject("Issuer Account not active")
      })
      .then((issuer) =>{
        // issuerAcct = issuer;
        console.log(distAcct, this.server, issuer);
        // Load dist. account on stellar
        return this.server.loadAccount(distAcct.publicKey());
      })
      .catch(StellarSdk.NotFoundError, (error) => {
        console.log('Distributing Account not active', error);
        // throw new Error('Invalid Account');
        return Promise.reject("Distributing Account not active")
      })
      .then((base)=>{
        // console.log(base);
        var transaction = new StellarSdk.TransactionBuilder(base);
        var operationObj = {} as any;
        var setFlags;

        if (tokenData.requireAuth) {
          setFlags += StellarSdk.AuthRequiredFlag;
        }

        if (tokenData.revokeAuth) {
          setFlags += StellarSdk.AuthRevocableFlag;
        }
        // set flag options
        if (setFlags > 0) {
          operationObj.setFlags = setFlags;
          operationObj.source = issuerAcct.publicKey();
          transaction.addOperation(StellarSdk.Operation.setOptions(operationObj));
        }

        // change trust
        operationObj = {};
        operationObj.asset = asset;
        operationObj.source = distAcct.publicKey();
        transaction.addOperation(StellarSdk.Operation.changeTrust(operationObj));

        // allow trust
        if (tokenData.requireAuth) {
          operationObj = {};
          operationObj.trustor = distAcct.publicKey();
          operationObj.assetCode = tokenData.assetCode;
          operationObj.authorize = true;
          operationObj.source = issuerAcct.publicKey();
          transaction.addOperation(StellarSdk.Operation.allowTrust(operationObj));
        }

        // send asset to dist
        operationObj = {};
        operationObj.destination = distAcct.publicKey();
        operationObj.asset = asset;
        operationObj.amount = tokenData.amount.toString();
        operationObj.source = issuerAcct.publicKey();
        transaction.addOperation(StellarSdk.Operation.payment(operationObj));

        // lockAccount
        if (tokenData.lockAccount) {
          operationObj = {};
          operationObj.masterWeight = 1;
          operationObj.lowThreshold = 1;
          operationObj.medThreshold = 2;
          operationObj.highThreshold = 3;
          operationObj.source = issuerAcct.publicKey();
          transaction.addOperation(StellarSdk.Operation.setOptions(operationObj));
        }

        // place offer on stellar DEX
        if (tokenData.distType) {
          operationObj = {};
          operationObj.selling = asset;
          operationObj.buying = StellarSdk.Asset.native();
          operationObj.amount = tokenData.distAmount.toString();
          operationObj.price = tokenData.distPrice;
          operationObj.source = distAcct.publicKey();
          transaction.addOperation(StellarSdk.Operation.manageOffer(operationObj));
        }

        // build and sign transaction
        var builtTx = transaction.build();
        builtTx.sign(StellarSdk.Keypair.fromSecret(issuerAcct.secret()));
        builtTx.sign(StellarSdk.Keypair.fromSecret(distAcct.secret()));

        //send build tx to server
        return this.server.submitTransaction(builtTx);
      })
      .then((result)=> {
        var res = {
          Results: result,
          Asset: tokenData.assetCode,
          Issuer: issuerAcct.publicKey(),
          Distributor: distAcct.publicKey(),
          message:'Asset created successfully'
        }
        return Promise.resolve(res)
      })
      .catch((error)=> {
        console.log(error);
        return Promise.reject(error)
        // throw new Error(error);
      })
      .catch((error)=>{
        console.error(error);
        return Promise.reject(error);
      });
  }

  validateSeed(seed){
    var tempKeyPair = false;
    try{
      tempKeyPair = StellarSdk.Keypair.fromSecret(seed);
    }
    catch(error){
      // console.log("Unable to generate keyPair");
      return false;
    }
    if (tempKeyPair) {
      return tempKeyPair;
    }
      return false;
  }

  generateAsset(type, code, issuer) {
    console.log("type, code, issuer", type, code, issuer);

    if (type === null || typeof(type) === 'undefined') {
      return false;
    }else if (type === 0) {
      return StellarSdk.Asset.native();
    }else{
      if (code === 'undefined' || typeof(code) === 'undefined') {
        // code = "";
        return false;
      }

      if (issuer === 'undefined' || typeof(issuer) === 'undefined') {
        // issuer = "";
        return false;
      }

      var asset = "";
      try{
        asset =  new StellarSdk.Asset(code, issuer);
        return asset;
      }
      catch(error){
        return false;
      }

    }
  }

  validatePaymentInput (destAcct, amount, memoText) {
    try{
      // check its a stellar address or account ID

      if (destAcct.indexOf('*') < 0) {
        // not stellar address
        if (!StellarSdk.StrKey.isValidEd25519PublicKey(destAcct)) {
          return Promise.resolve({status: false, content: {message: ['Invalid Destination Address']}});
        }
      }else{
        // stellar address
      }

      if (memoText.length > 28) {
        return {status: false, content: {message: ['memo can only have 28 characters']}};
      }

      if (isNaN(amount)) {
        return {status: false, content: {message: ['Please enter a valid amount']}};
      }

      return {status: true, content: {message: ['Input Validation successful']}};
    }
    catch(error){
      // To Do
      console.error("validatePaymentInput Error", error);
      return {status: false, content: {message: ['Input Validation failed']}};
    }
  }

  randomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
}