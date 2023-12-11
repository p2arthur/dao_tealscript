import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  registeredAsa = GlobalStateKey<Asset>();

  //Set parameters to be used when calling methods
  proposal = GlobalStateKey<string>();
  votesTotal = GlobalStateKey<number>();
  votesInFavor = GlobalStateKey<number>();

  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  public getProposal(): string {
    return this.proposal.value;
  }

  //Change this method to allow the user if they're in favor or not
  public addVote(inFavor: boolean): void {
    if (inFavor) {
      this.votesInFavor.value = this.votesInFavor.value + 1;
    }
    this.votesTotal.value = this.votesTotal.value + 1;
  }

  //return total votes and votes in favor
  public getVotes(): [number, number] {
    return [this.votesInFavor.value, this.votesTotal.value];
  }

  public getRegisteredAsa(): Asset {
    return this.registeredAsa.value;
  }

  //mint DAO token
  public bootstrap(): Asset {
    //Verify if the person calling this contract is the creator
    verifyTxn(this.txn, { sender: this.app.creator });
    //Check if the there isn't an asset already created
    assert(!this.registeredAsa.exists);
    const registeredAsa = sendAssetCreation({ configAssetTotal: 1_000, configAssetFreeze: this.app.address });

    this.registeredAsa.value = registeredAsa;
    return registeredAsa;
  }
}
