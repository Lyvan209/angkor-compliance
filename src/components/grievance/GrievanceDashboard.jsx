import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import Grievance from './Grievance'
import QRSubmissionPortal from './QRSubmissionPortal'
import QRCodeDashboard from './QRCodeDashboard'
import CommitteeWorkflow from './CommitteeWorkflow'

const GrievanceDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [activeView, setActiveView] = useState('management') // 'management', 'qr-dashboard', 'qr-portal', 'committee-workflow'
  const [qrCode, setQrCode] = useState(null)

  const handleQRSubmission = (qrCode) => {
    setQrCode(qrCode)
    setActiveView('qr-portal')
  }

  const handleQRSubmissionComplete = () => {
    setActiveView('management')
    setQrCode(null)
  }

  const handleCloseQRPortal = () => {
    setActiveView('management')
    setQrCode(null)
  }

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveView('management')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'management'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grievance Management
          </button>
          <button
            onClick={() => setActiveView('qr-dashboard')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'qr-dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            QR Code Dashboard
          </button>
          <button
            onClick={() => setActiveView('committee-workflow')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'committee-workflow'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Committee Workflow
          </button>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            Phase 5
          </div>
          <div className={`text-sm text-gray-600 ${textClass}`}>
            Communication
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'management':
        return (
          <Grievance
            user={user}
            organizationId={organizationId}
          />
        )
      case 'qr-dashboard':
        return (
          <QRCodeDashboard
            user={user}
            organizationId={organizationId}
          />
        )
      case 'qr-portal':
        return (
          <QRSubmissionPortal
            qrCode={qrCode}
            onSubmissionComplete={handleQRSubmissionComplete}
            onClose={handleCloseQRPortal}
          />
        )
      case 'committee-workflow':
        return (
          <CommitteeWorkflow
            user={user}
            organizationId={organizationId}
          />
        )
      default:
        return (
          <Grievance
            user={user}
            organizationId={organizationId}
          />
        )
    }
  }

  // Special handling for QR portal view (full screen)
  if (activeView === 'qr-portal') {
    return renderContent()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  )
}

export default GrievanceDashboard 