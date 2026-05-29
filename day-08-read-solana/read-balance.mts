import { createSolanaRpc, devnet, address } from '@solana/kit'

// Connect to devnet (Solana's test network)
const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'))

const targetAddress = address('GTnQqxarv2E1YyDuSG2YbFKpzrrwJq4ZNjN5B3hhQKZh')

const { value: balanceInLamports } = await rpc.getBalance(targetAddress).send()

const balanceInSol = Number(balanceInLamports) / 1_000_000_000

console.log(`Address: ${targetAddress}`)
console.log(`Balance: ${balanceInSol}`)
