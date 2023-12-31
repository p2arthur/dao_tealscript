import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  // save data onchain using global state: Key value pair  public
  public registeredAsaId = GlobalStateKey<Asset>();
  public proposal = GlobalStateKey<string>();
  public votesTotal = GlobalStateKey<number>();
  public votesInFavorTotal = GlobalStateKey<number>();

  // define a proposal on creating an application
  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  //Mint DAO tokens to prevent a Sybil Attack - Prevent users to sell their DAO token after minting it
  bootstrap(): Asset {
    //Verify if the caller of this method is the app creator - Not needed here but it's a very common pattern
    verifyTxn(this.txn, { sender: this.app.creator });

    //We want this to be called only once - Assert that the GlobalStateKey for the registered asa does not exist
    assert(!this.registeredAsaId.exists);

    //If registered ASA doesn't exist execute - only once
    const registeredAsa = sendAssetCreation({ configAssetTotal: 1_000, configAssetFreeze: this.app.address });

    this.registeredAsaId.value = registeredAsa;
    return registeredAsa;
  }

  // register method gives the person the ASA and freezes it - We need to pass the registeredAssa to the params but we shouldn't use it, instead we should use the asset on the global state
  register(registeredAsa: Asset): void {
    //Guarantee that the app caller doesn't hold the asset - Can only register once
    assert(this.txn.sender.assetBalance(this.registeredAsaId.value) === 0);

    //Send a transfer to the app caller
    sendAssetTransfer({ xferAsset: this.registeredAsaId.value, assetReceiver: this.txn.sender, assetAmount: 1 });

    //Freeze the asset on the app caller account
    sendAssetFreeze({
      freezeAsset: this.registeredAsaId.value,
      freezeAssetAccount: this.txn.sender,
      freezeAssetFrozen: true,
    });
  }
  // make it easy for the voters to see what the proposal is
  //Enable caller to vote in favour or against a proposal
  vote(inFavor: boolean, registeredASA: Asset): void {
    assert(this.txn.sender.assetBalance(this.registeredAsaId.value) === 1);
    this.votesTotal.value = this.votesTotal.value + 1;
    if (inFavor) {
      this.votesInFavorTotal.value = this.votesInFavorTotal.value + 1;
    }
  }

  // get all votes of the proposal - And votes in favor
  getProposal(): string {
    return this.proposal.value;
  }

  getRegisteredAsa(): Asset {
    return this.registeredAsaId.value;
  }

  getVotes(): [number, number] {
    return [this.votesTotal.value, this.votesInFavorTotal.value];
  }
}
