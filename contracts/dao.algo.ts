import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  // save data onchain using global state: Key value pair
  public proposal = GlobalStateKey<string>();
  public votesTotal = GlobalStateKey<number>();
  public votesInFavorTotal = GlobalStateKey<number>();

  // define a proposal on creating an application
  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  //Mint DAO tokens to prevent a Sybil Attack - Prevent users to sell their DAO token after minting it
  bootstrap(): Asset {
    const registeredAsa = sendAssetCreation({ configAssetTotal: 1_000, configAssetFreeze: this.app.address });
    return registeredAsa;
  }

  //Enable caller to vote in favour or against a proposal
  vote(inFavor: boolean): void {
    this.votesTotal.value = this.votesTotal.value + 1;
    if (inFavor) {
      this.votesInFavorTotal.value = this.votesInFavorTotal.value + 1;
    }
  }

  // make it easy for the voters to see what the proposal is
  getProposal(): string {
    return this.proposal.value;
  }

  // get all votes of the proposal - And votes in favor
  getVotes(): [number, number] {
    return [this.votesTotal.value, this.votesInFavorTotal.value];
  }
}
