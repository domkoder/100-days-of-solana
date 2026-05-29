import { createSolanaRpc, devnet, address } from '@solana/kit'

// Connect to devnet (Solana's test network)
const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'))

const targetAddress = address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')

const { value: balanceInLamports } = await rpc.getBalance(targetAddress).send()

const balanceInSol = Number(balanceInLamports) / 1_000_000_000

console.log(`Address: ${targetAddress}`)
console.log(`Balance: ${balanceInSol}`)
