import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { DaoClient } from '../contracts/clients/DaoClient';
import { algos, getOrCreateKmdWalletAccount, microAlgos } from '@algorandfoundation/algokit-utils';
import algosdk, { Kmd } from 'algosdk';

const fixture = algorandFixture();

let appClient: DaoClient;
let registeredAsa: bigint;

describe('TealscriptDemo', () => {
  beforeEach(fixture.beforeEach);
  const proposal = 'This is a proposal!';
  const assetId = 1379;
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
    proposalFromMethod.return?.valueOf();
    expect(proposalFromMethod.return?.valueOf()).toBe(proposal);
  });

  test('castVote', async () => {
    await appClient.addVote({ inFavor: true });
    const votes = await appClient.getVotes({});
    await appClient.addVote({ inFavor: false });
    const votes2 = await appClient.getVotes({});

    expect(votes2.return?.valueOf()).toEqual([BigInt(1), BigInt(2)]);
  });

  test('bootstrap', async () => {
    await appClient.appClient.fundAppAccount(microAlgos(200000));

    const bootstrapResult = await appClient.bootstrap(
      {},
      {
        sendParams: {
          fee: microAlgos(2_000),
        },
      }
    );
    registeredAsa = bootstrapResult.return!.valueOf();
    console.log('registeredAsa', registeredAsa);
  });

  //Testing if the caller is not the contract creator
  test('bootstrap negative', async () => {
    await appClient.appClient.fundAppAccount(microAlgos(200000));

    expect(
      appClient.bootstrap(
        {},
        {
          sender,
          sendParams: {
            fee: microAlgos(2_000),
          },
        }
      )
    ).rejects.toThrow();
  });

  test('getRegisteredAsa', async () => {
    const registeredASAFromMethod = await appClient.getRegisteredAsa({});
    registeredASAFromMethod.return?.valueOf();
    expect(registeredASAFromMethod.return?.valueOf()).toBe(registeredAsa);
  });
});
