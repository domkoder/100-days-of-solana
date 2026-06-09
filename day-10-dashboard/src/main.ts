import {
	createSolanaRpc,
	devnet,
	address,
	type UnixTimestamp,
	type Commitment,
	type TransactionError,
	type Signature,
	type Slot,
} from '@solana/kit'

const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'))
const addressInput = document.getElementById('addressInput') as HTMLInputElement
const fetchBtn = document.getElementById('fetchBtn')! as HTMLButtonElement
const resultsDiv = document.getElementById('results') as HTMLElement
const errorDiv = document.getElementById('error') as HTMLElement
const loadingDiv = document.getElementById('loading')! as HTMLElement

// Ensure required elements exist at runtime so TypeScript can narrow the types
if (!fetchBtn) throw new Error('Missing element: fetchBtn')
if (!addressInput) throw new Error('Missing element: addressInput')
if (!resultsDiv) throw new Error('Missing element: results')
if (!errorDiv) throw new Error('Missing element: error')
if (!loadingDiv) throw new Error('Missing element: loading')

function setLoading(isLoading: boolean) {
	fetchBtn.disabled = isLoading
	loadingDiv.textContent = isLoading ? 'Fetching...' : ''
}

function validateAddressInput(value: string): boolean {
	try {
		// address() will throw for bad addresses in @solana/kit; use it to validate
		address(value)
		return true
	} catch {
		return false
	}
}

type TxSig = Readonly<{
	blockTime: UnixTimestamp | null
	confirmationStatus: Commitment | null
	err: TransactionError | null
	memo: string | null
	signature: Signature
	slot: Slot
}>

function renderTx(tx: TxSig): string {
	const time = tx.blockTime
		? new Date(Number(tx.blockTime) * 1000).toLocaleString()
		: 'unknown'
	const statusClass = tx.err ? 'status failed' : 'status'
	const statusText = tx.err ? 'Failed' : 'Success'
	return `
	<div class="tx">
	  <div><strong>Signature:</strong> ${tx.signature}</div>
	  <div><strong>Slot:</strong> ${tx.slot}</div>
	  <div><strong>Time:</strong> ${time}</div>
	  <div class="${statusClass}"><strong>Status:</strong> ${statusText}</div>
	</div>
  `
}

fetchBtn.addEventListener('click', async () => {
	errorDiv.textContent = ''
	resultsDiv.innerHTML = ''

	// validate early
	const raw = addressInput.value.trim()
	if (!validateAddressInput(raw)) {
		errorDiv.textContent = 'Please enter a valid Solana address.'
		return
	}

	setLoading(true)

	try {
		const targetAddress = address(raw)
		const [{ value: balanceInLamports }, signatures] = await Promise.all([
			rpc.getBalance(targetAddress).send(),
			rpc.getSignaturesForAddress(targetAddress, { limit: 5 }).send(),
		])
		const balanceInSol = Number(balanceInLamports) / 1_000_000_000

		let html = `<div class="balance">${balanceInSol} SOL</div><h3>Recent transactions</h3>`
		if (signatures.length === 0) {
			html += `<p>No transactions found for this address.</p>`
		} else {
			for (const tx of signatures) {
				html += renderTx(tx)
			}
		}

		resultsDiv.innerHTML = html
	} catch (err) {
		// Narrow the unknown error to an Error if possible, otherwise stringify it
		if (err instanceof Error) {
			errorDiv.textContent = `Error: ${err.message}`
		} else {
			errorDiv.textContent = `Error: ${String(err)}`
		}
	} finally {
		setLoading(false)
	}
})
