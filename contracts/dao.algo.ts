import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  // save data onchain using global state: Key value pair
  public proposal = GlobalStateKey<string>();

  // define a proposal on creating an application
  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  // make it easy for the voters to see what the proposal is
  getProposal(): string {
    return this.proposal.value;
  }
}
