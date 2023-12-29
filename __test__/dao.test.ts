import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { DaoClient } from '../contracts/clients/DaoClient';
import { algos, getKmdWalletAccount, getOrCreateKmdWalletAccount, microAlgos } from '@algorandfoundation/algokit-utils';
import algosdk, { Kmd } from 'algosdk';
import exp from 'constants';

const fixture = algorandFixture();

let appClient: DaoClient;

describe('TealscriptDemo', () => {
  beforeEach(fixture.beforeEach);
  const proposal = 'Send 500 $COOP to the wecoop developers';
  let sender: algosdk.Account;
  let registeredAsa: BigInt;
  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount, kmd } = fixture.context;

    //Get a new account to involve more wallets than just the test account - Get from our KMD - ~algokit console -> ~goal account list

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

  test('bootstrap (negative)', async () => {
    await appClient.appClient.fundAppAccount(microAlgos(200_000));

    try {
      //default fee per txn is 0.001 ALGO or 1_000 uAlgo - We want the caller to pay the fee
      //bootstrap sends 1 innertxn, so 2 txns total
      //thus fee needs to be 2_000 uAlgo
      //This won't pass cause our contract only allows the creator of the contract to call this method
      await expect(
        appClient.bootstrap({}, { sender: sender, sendParams: { fee: microAlgos(2_000) } })
      ).rejects.toThrow();
      console.log(registeredAsa);
    } catch (error) {
      console.error(error);

      throw error;
    }
  });

  test('bootstrap (positive)', async () => {
    await appClient.appClient.fundAppAccount(microAlgos(200_000));

    try {
      //default fee per txn is 0.001 ALGO or 1_000 uAlgo - We want the caller to pay the fee
      //bootstrap sends 1 innertxn, so 2 txns total
      //thus fee needs to be 2_000 uAlgo
      const bootstrapResult = await appClient.bootstrap({}, { sendParams: { fee: microAlgos(2_000) } });

      registeredAsa = bootstrapResult.return!.valueOf();
      console.log(registeredAsa);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  test('getProposal', async () => {
    const proposalFromMethod = await appClient.getProposal({});
    expect(proposalFromMethod.return?.valueOf()).toBe(proposal);
  });

  test('getRegisteredASA', async () => {
    const registeredAsa = await appClient.getRegisteredAsa({});
    expect(registeredAsa.return?.valueOf()).toBe(registeredAsa.return);
  });

  test('vote & getVotes', async () => {
    await appClient.vote({ inFavor: true });
    const votes = await appClient.getVotes({});

    expect(votes.return?.valueOf()).toEqual([BigInt(1), BigInt(1)]);

    await appClient.vote({ inFavor: false });
    const votesAfter = await appClient.getVotes({});

    expect(votesAfter.return?.valueOf()).toEqual([BigInt(2), BigInt(1)]);
  });
});
