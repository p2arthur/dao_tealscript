import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  // define a proposal
  // make it easy for the voters to see what the proposal is

  getProposal(): string {
    return 'This is a proposal';
  }
}
