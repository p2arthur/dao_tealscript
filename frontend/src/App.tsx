import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { PROVIDER_ID, ProvidersArray, WalletProvider, useInitializeProviders, useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

import DaoCreateApplication from './components/DaoCreateApplication'
import { DaoClient } from './contracts/DaoClient'
import * as algokit from '@algorandfoundation/algokit-utils'
import DaoRegister from './components/DaoRegister'
import DaoVote from './components/DaoVote'

let providersArray: ProvidersArray
if (import.meta.env.VITE_ALGOD_NETWORK === '') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  providersArray = [
    {
      id: PROVIDER_ID.KMD,
      clientOptions: {
        wallet: kmdConfig.wallet,
        password: kmdConfig.password,
        host: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  providersArray = [
    { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
    { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
    { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    { id: PROVIDER_ID.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [proposal, setProposal] = useState<string>('')
  const [votesTotal, setVotesTotal] = useState<number>(0)
  const [votesInFavorTotal, setVotesInFavorTotal] = useState<number>(0)
  const [registeredASA, setRegisteredASA] = useState<number>(0)
  const { activeAddress } = useWallet()
  const [appId, setAppId] = useState<number>(0)
  const [registered, setRegistered] = useState<boolean>(false)

  const resetState = () => {
    setRegisteredASA(0)
    setVotesTotal(0)
    setVotesInFavorTotal(0)
  }

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()

  const algodClient = algokit.getAlgoClient({ server: algodConfig.server, port: algodConfig.port, token: algodConfig.token })

  const typedClient = new DaoClient({ resolveBy: 'id', id: appId }, algodClient)

  const walletProviders = useInitializeProviders({
    providers: providersArray,
    nodeConfig: {
      network: algodConfig.network,
      nodeServer: algodConfig.server,
      nodePort: String(algodConfig.port),
      nodeToken: String(algodConfig.token),
    },
    algosdkStatic: algosdk,
  })

  //Everytime app id changes
  //Get corresponding proposal
  const getGlobalState = async () => {
    try {
      const state = await typedClient.getGlobalState()
      const { proposal, registeredAsaId, votesTotal, votesInFavorTotal } = state

      try {
        //determine if the user is holding the DAO ASA
        const assetInfo = await algodClient.accountAssetInformation(activeAddress!, registeredAsaId?.asNumber()!).do()

        setRegistered(assetInfo['asset-holding'].amount === 1)
      } catch (error) {
        console.warn(error)
        setRegistered(false)
      }

      setProposal(proposal?.asString()!)
      setRegisteredASA(registeredAsaId?.asNumber() || 0)
      setVotesInFavorTotal(votesInFavorTotal?.asNumber()! || 0)
      setVotesTotal(votesTotal?.asNumber()! || 0)
    } catch (error) {
      console.warn(error)
      setProposal('Invalid App ID')
      resetState()
    }
  }

  useEffect(() => {
    if (appId === 0) {
      setProposal('Create a new DAO')
      resetState()
    } else {
      getGlobalState()
    }
  }, [appId])

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider value={walletProviders}>
        <div className="hero min-h-screen bg-teal-400">
          <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
            <div className="max-w-md">
              <h1 className="text-4xl">
                Welcome to <div className="font-bold">The DAO</div>
              </h1>
              <p className="py-6">This is the DAO page for the Algorand TEALSCRIPT bootcamp</p>
              <div className="grid">
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>
                <div className="divider" />
                <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
                {activeAddress && appId === 0 && (
                  <div>
                    <DaoCreateApplication
                      buttonClass="btn m-2"
                      buttonLoadingNode={<span className="loading loading-spinner" />}
                      buttonNode="Create DAO"
                      typedClient={typedClient}
                      setAppID={setAppId}
                    />
                    <div className="divider" />
                  </div>
                )}{' '}
                <h1 className="font-bold m-2">DAO App ID</h1>
                <input
                  value={appId}
                  type="number"
                  className="input input-bordered"
                  onChange={(e) => {
                    setAppId(Number(e.target.value || 0))
                    resetState()
                  }}
                />
                <div className="divider" />
                <h1 className="font-bold m-2">Proposition</h1>
                <textarea className="textarea textarea-bordered m-2" value={proposal} />
                <h2 className="font-bold">Current votes</h2>
                <div className="flex gap-10 justify-center">
                  <span>In favor: {votesInFavorTotal}</span>
                  <span>Against: {votesTotal - votesInFavorTotal}</span>
                </div>
                <div className="divider" />
                <div className="flex flex-col gap-10 justify-center">
                  {activeAddress && appId !== 0 && !registered && (
                    <div>
                      <DaoRegister
                        buttonClass="btn m-2"
                        buttonLoadingNode={<span className="loading loading-spinner" />}
                        buttonNode="register to vote"
                        typedClient={typedClient}
                        registeredAsa={registeredASA}
                        algod={algodClient}
                        getState={getGlobalState}
                      />
                    </div>
                  )}{' '}
                  {activeAddress && appId !== 0 && registered && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <DaoVote
                          buttonClass="btn m-2"
                          buttonLoadingNode={<span className="loading loading-spinner" />}
                          buttonNode="vote in favor"
                          typedClient={typedClient}
                          inFavor={true}
                          registeredASA={registeredASA}
                          getState={getGlobalState}
                        />
                        <DaoVote
                          buttonClass="btn m-2"
                          buttonLoadingNode={<span className="loading loading-spinner" />}
                          buttonNode="vote against"
                          typedClient={typedClient}
                          inFavor={false}
                          registeredASA={registeredASA}
                          getState={getGlobalState}
                        />
                      </div>
                    </div>
                  )}{' '}
                </div>
              </div>
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
