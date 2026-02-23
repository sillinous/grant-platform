import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
    'process.env': {}
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'zustand': ['zustand'],
          'discovery': [
            './src/components/Discovery.jsx',
            './src/components/RegionalPulse.jsx',
            './src/components/PolicySentinel.jsx',
            './src/components/SubGrantRadar.jsx',
            './src/components/SynergyEngine.jsx',
            './src/components/SurplusSentinel.jsx',
            './src/components/UnsolicitedProspector.jsx',
            './src/components/PRINavigator.jsx',
            './src/components/CSRAllianceMapper.jsx',
            './src/components/CyPresScout.jsx',
            './src/components/DAOMap.jsx',
            './src/components/InKindVault.jsx',
            './src/components/DAFSignal.jsx',
            './src/components/GivingCircleScout.jsx',
            './src/components/ChamberPulse.jsx',
            './src/components/CBALedger.jsx',
            './src/components/FaithFunder.jsx',
            './src/components/UniversalApplication.jsx',
            './src/components/Concierge.jsx',
            './src/components/PhilanthropyPulse.jsx',
            './src/components/FoundationScout990.jsx',
            './src/components/FamilyOfficeProspector.jsx',
            './src/components/GovContractRadar.jsx',
            './src/components/TaxCreditNavigator.jsx',
            './src/components/EarmarkScout.jsx',
          ],
          'writing': [
            './src/components/AIDrafter.jsx',
            './src/components/NarrativeScorer.jsx',
            './src/components/SectionLibrary.jsx',
            './src/components/RFPParser.jsx',
            './src/components/LetterGenerator.jsx',
          ],
          'intelligence': [
            './src/components/StrategicAdvisor.jsx',
            './src/components/PortfolioOptimizer.jsx',
            './src/components/ImpactPredictor.jsx',
            './src/components/FunderResearch.jsx',
            './src/components/WinLossAnalysis.jsx',
            './src/components/ScenarioModeler.jsx',
            './src/components/ImpactPortfolio.jsx',
            './src/components/FundingForecast.jsx',
            './src/components/FinancialProjector.jsx',
          ],
        }
      }
    }
  }
})
