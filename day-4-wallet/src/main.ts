import { createSolanaRpc, devnet } from '@solana/kit'
import type { Address } from '@solana/kit'
import { getWallets } from '@wallet-standard/app'

const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'))
const walletListDiv = document.getElementById(
	'wallet-list',
) as HTMLDivElement | null
const connectedDiv = document.getElementById(
	'connected',
) as HTMLDivElement | null
const statusDiv = document.getElementById('status') as HTMLDivElement | null
const errorDiv = document.getElementById('error') as HTMLDivElement | null

let connectedWallet: any | null = null

function isSolanaWallet(wallet: any): boolean {
	return !!wallet?.chains?.some((chain: string) => chain.startsWith('solana:'))
}

function renderWalletList(wallets: readonly any[]): void {
	const solanaWallets = wallets.filter(isSolanaWallet)

	if (solanaWallets.length == 0) {
		if (walletListDiv) {
			walletListDiv.innerHTML = `
		<div class="no-wallets">
		  No Solana wallets found.<br>
		  Install <a href="https://phantom.app" target="_blank">Phantom</a>
		  or another Solana wallet to continue.
		</div>
	  `
		}

		if (statusDiv) statusDiv.textContent = ''
		return
	}

	if (statusDiv)
		statusDiv.textContent = `Found ${solanaWallets.length} wallet(s):`
	if (walletListDiv) walletListDiv.innerHTML = ''

	for (const wallet of solanaWallets) {
		const btn = document.createElement('button') as HTMLButtonElement
		btn.className = 'wallet-btn'
		const icon: string | undefined = wallet.icon
		btn.innerHTML = icon
			? `<img src="${icon}" alt="" /> ${wallet.name}`
			: wallet.name
		btn.addEventListener('click', () => connectWallet(wallet))
		if (walletListDiv) walletListDiv.appendChild(btn)
	}
}

async function connectWallet(wallet: any): Promise<void> {
	if (errorDiv) errorDiv.textContent = ''
	const connectFeature = wallet.features['standard:connect']
	if (!connectFeature) {
		if (errorDiv)
			errorDiv.textContent = "This wallet doesn't support connecting."
		return
	}

	try {
		if (statusDiv) statusDiv.textContent = 'Requesting connection...'
		const { accounts } = await connectFeature.connect()

		if (accounts.length === 0) {
			if (errorDiv)
				errorDiv.textContent =
					'No accounts returned. Did you reject the request?'
			if (statusDiv) statusDiv.textContent = ''
			return
		}

		const account: any = accounts[0]
		const address: string = account.address

		const addr = address as unknown as Address
		const { value: balanceInLamports } = await rpc.getBalance(addr).send()
		const balanceInSol = (Number(balanceInLamports) / 1_000_000_000).toFixed(9)

		if (walletListDiv) walletListDiv.style.display = 'none'
		if (statusDiv) statusDiv.textContent = ''
		if (connectedDiv) {
			connectedDiv.style.display = 'block'
			connectedDiv.innerHTML = `
	  <h3>Connected to ${wallet.name}</h3>
	  <div class="address">${address}</div>
	  <div class="balance">${balanceInSol} SOL</div>
	  <button class="disconnect-btn" id="disconnectBtn">Disconnect</button>`
		}

		const disconnectBtn = document.getElementById(
			'disconnectBtn',
		) as HTMLButtonElement | null
		if (disconnectBtn)
			disconnectBtn.addEventListener('click', () => disconnectWallet(wallet))
	} catch (err: any) {
		if (errorDiv)
			errorDiv.textContent = `Connection failed: ${err?.message ?? String(err)}`
		if (statusDiv) statusDiv.textContent = ''
	}
}

async function disconnectWallet(wallet: any): Promise<void> {
	const disconnectFeature = wallet.features['standard:disconnect']
	if (disconnectFeature) {
		await disconnectFeature.disconnect()
	}
	connectedWallet = null
	if (connectedDiv) connectedDiv.style.display = 'none'
	if (walletListDiv) walletListDiv.style.display = 'block'
	if (statusDiv)
		statusDiv.textContent = 'Disconnected. Choose a wallet to reconnect:'
}

const { get, on } = getWallets()
renderWalletList(get())
on('register', () => {
	if (!connectedWallet) {
		renderWalletList(get())
	}
})
