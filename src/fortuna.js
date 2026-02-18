import { LS, uid } from "./globals";

/**
 * Fortuna Integration Service
 * Bridges personal/small business fintech data into the Grant Platform.
 */

const MOCK_FORTUNA_DATA = {
    accounts: [
        { id: "acc_1", name: "Business Checking", balance: 45200.50, currency: "USD", institution: "Fortuna Digital" },
        { id: "acc_2", name: "Operating Reserve", balance: 125000.00, currency: "USD", institution: "Fortuna Digital" }
    ],
    transactions: [
        { id: "tx_1", date: new Date().toISOString(), amount: -1200.00, merchant: "AWS Cloud", category: "Technology", grantReady: true },
        { id: "tx_2", date: new Date().toISOString(), amount: -250.00, merchant: "Staples", category: "Supplies", grantReady: true },
        { id: "tx_3", date: new Date().toISOString(), amount: 15000.00, merchant: "Client Payment", category: "Revenue", grantReady: false },
        { id: "tx_4", date: new Date().toISOString(), amount: -3500.00, merchant: "Downtown Office", category: "Rent", grantReady: true }
    ],
    health: {
        score: 85,
        runway: "14 months",
        revenue_growth: "+12%",
        burn_rate: 8500,
        liquidity_ratio: 2.1
    }
};

export const FortunaAPI = {
    isLinked() {
        return !!LS.get("fortuna_link");
    },

    async linkAccount(credentials) {
        // Simulate OAUTH flow
        return new Promise((resolve) => {
            setTimeout(() => {
                const linkData = {
                    linkedAt: new Date().toISOString(),
                    userId: "user_f789",
                    token: uid()
                };
                LS.set("fortuna_link", linkData);
                resolve({ success: true, data: linkData });
            }, 1500);
        });
    },

    async unlink() {
        LS.del("fortuna_link");
        return { success: true };
    },

    async getAccounts() {
        if (!this.isLinked()) return [];
        return MOCK_FORTUNA_DATA.accounts;
    },

    async getTransactions(filter = {}) {
        if (!this.isLinked()) return [];
        return MOCK_FORTUNA_DATA.transactions;
    },

    async getFinancialHealth() {
        if (!this.isLinked()) return null;
        return MOCK_FORTUNA_DATA.health;
    },

    /**
     * Maps Fortuna transactions to Grant Platform CBA/Budget categories
     */
    async syncToLedger() {
        if (!this.isLinked()) return { synced: 0 };
        const txs = MOCK_FORTUNA_DATA.transactions.filter(t => t.grantReady);
        // In a real app, this would push data to the local ledger or database
        return { synced: txs.length, transactions: txs };
    }
};
