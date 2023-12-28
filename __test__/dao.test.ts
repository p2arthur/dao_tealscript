import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { DaoClient } from '../contracts/clients/DaoClient';
import { algos, getOrCreateKmdWalletAccount, microAlgos } from '@algorandfoundation/algokit-utils';
import algosdk, { Kmd } from 'algosdk';

const fixture = algorandFixture();

let appClient: DaoClient;

describe('TealscriptDemo', () => {
  beforeEach(fixture.beforeEach);
  const proposal = 'Send 500 $COOP to the wecoop developers';
  let sender: algosdk.Account;
  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount, kmd } = fixture.context;

    //Create a new account and fund it with 100 algos - second time it wont create a new account
    sender = await getOrCreateKmdWalletAccount({ name: 'tealscript-dao-sender', fundWith: algos(100) }, algod, kmd);

    appClient = new DaoClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({ proposal });
  });

  test('getProposal', async () => {
    const proposalFromMethod = await appClient.getProposal({});
    expect(proposalFromMethod.return?.valueOf()).toBe(proposal);
  });
});
