import { useState, useEffect, useRef } from 'react'
import { 
  QrCode, 
  Download, 
  Smartphone, 
  BarChart3, 
  , 
  CheckCircle, 
  , 
  AlertTriangle,
  RefreshCw,
  Copy,
  ,
  Eye,
  Share2,
  Printer,
  ,
  UserX,
  TrendingUp,
  ,
  ,
  ,
  Info
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  generateOrganizationQRCode,
  getQRCodeStatistics,
  getGrievanceAnalytics
} from '../../lib/supabase-enhanced'

const QRCodeDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [qrCode, setQrCode] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const qrRef = useRef()

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      const [statsResult, analyticsResult] = await Promise.all([
        getQRCodeStatistics(organizationId),
        getGrievanceAnalytics(organizationId, '30')
      ])

      if (statsResult.success) setStatistics(statsResult.data)
      if (analyticsResult.success) setAnalytics(analyticsResult.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQRCode = async () => {
    setGenerating(true)
    try {
      const result = await generateOrganizationQRCode(organizationId)
      if (result.success) {
        setQrCode(result.data.qrCode)
        setShowQRModal(true)
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      setError('Failed to generate QR code')
    } finally {
      setGenerating(false)
    }
  }

  const getQRCodeURL = () => {
    if (!qrCode) return ''
    const baseURL = window.location.origin
    return `${baseURL}/grievance/submit?qr=${qrCode}`
  }

  const handleCopyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(getQRCodeURL())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy QR code URL:', error)
    }
  }

  const handleDownloadQR = () => {
    // Generate QR code image and download
    const qrCodeDataURL = generateQRCodeImage(getQRCodeURL())
    const link = document.createElement('a')
    link.href = qrCodeDataURL
    link.download = `grievance-qr-code-${organizationId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateQRCodeImage = (text) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 300
    canvas.width = size
    canvas.height = size

    // Simple QR code placeholder (in real implementation, use a QR code library)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('QR Code', size / 2, size / 2)
    ctx.fillText(text, size / 2, size / 2 + 20)

    return canvas.toDataURL()
  }

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Grievance QR Code</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
            }
            .qr-container {
              text-align: center;
              margin: 20px 0;
            }
            .instructions {
              max-width: 400px;
              margin: 20px 0;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <h1>Submit a Grievance</h1>
          <div class="qr-container">
            <div style="width: 200px; height: 200px; border: 2px solid #ccc; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              QR Code<br/>${getQRCodeURL()}
            </div>
          </div>
          <div class="instructions">
            <h2>How to use:</h2>
            <ol>
              <li>Scan this QR code with your smartphone camera</li>
              <li>Follow the link to open the grievance submission form</li>
              <li>Fill out your concern or grievance</li>
              <li>Submit anonymously or with your contact information</li>
            </ol>
            <p><strong>Your voice matters. Report concerns safely and confidentially.</strong></p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Total QR Submissions
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {statistics.total_qr_submissions}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-blue-600 font-medium">
                +{statistics.submissions_this_week}
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                this week
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                This Month
              </p>
              <p className="text-3xl font-bold text-green-600">
                {statistics.submissions_this_month}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium">
                {Math.round((statistics.submissions_this_month / Math.max(statistics.total_qr_submissions, 1)) * 100)}%
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                of total
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Anonymous Submissions
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.anonymous_submissions}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserX className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm text-purple-600 font-medium">
                {Math.round((statistics.anonymous_submissions / Math.max(statistics.total_qr_submissions, 1)) * 100)}%
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                anonymous
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-gray-600 ${textClass}`}>
                Resolution Rate
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {statistics.completion_rate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className={`text-sm ${statistics.completion_rate >= 80 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                {statistics.completion_rate >= 80 ? 'Good' : 'Improving'}
              </span>
              <span className={`text-sm text-gray-600 ml-2 ${textClass}`}>
                performance
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderQRCodeSection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold text-gray-900 ${headerClass}`}>
            QR Code Management
          </h2>
          <p className={`text-gray-600 mt-1 ${textClass}`}>
            Generate and manage QR codes for grievance submission
          </p>
        </div>
        <button
          onClick={handleGenerateQRCode}
          disabled={generating}
          className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${textClass}`}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4" />
              <span>Generate QR Code</span>
            </>
          )}
        </button>
      </div>

      {qrCode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className={`font-medium text-gray-900 mb-4 ${textClass}`}>
              Current QR Code
            </h3>
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <p className={`text-sm text-gray-600 mb-4 ${textClass}`}>
                QR Code for Grievance Submission
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${textClass}`}
                >
                  <Eye className="h-4 w-4" />
                  <span>View QR Code</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadQR}
                    className={`flex items-center justify-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 ${textClass}`}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handlePrintQR}
                    className={`flex items-center justify-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 ${textClass}`}
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className={`font-medium text-gray-900 mb-4 ${textClass}`}>
              QR Code Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                  QR Code URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={getQRCodeURL()}
                    readOnly
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm ${textClass}`}
                  />
                  <button
                    onClick={handleCopyQRCode}
                    className={`px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${copySuccess ? 'bg-green-50 border-green-300' : ''}`}
                  >
                    {copySuccess ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-sm text-green-600 mt-1">URL copied to clipboard!</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
                  QR Code ID
                </label>
                <input
                  type="text"
                  value={qrCode}
                  readOnly
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm ${textClass}`}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className={`text-sm font-medium text-blue-900 ${textClass}`}>
                      How to use this QR Code
                    </h4>
                    <ul className={`text-sm text-blue-800 mt-2 space-y-1 ${textClass}`}>
                      <li>• Post QR codes in visible locations</li>
                      <li>• Workers scan with their smartphones</li>
                      <li>• Direct access to grievance submission form</li>
                      <li>• Anonymous and secure submissions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium text-gray-900 mb-2 ${headerClass}`}>
            No QR Code Generated
          </h3>
          <p className={`text-gray-500 mb-4 ${textClass}`}>
            Generate a QR code to enable mobile grievance submissions
          </p>
          <button
            onClick={handleGenerateQRCode}
            disabled={generating}
            className={`flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mx-auto ${textClass}`}
          >
            <QrCode className="h-5 w-5" />
            <span>Generate QR Code</span>
          </button>
        </div>
      )}
    </div>
  )

  const renderAnalytics = () => {
    if (!analytics) return null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Submissions by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.byCategory).map(([category, count]) => {
              const percentage = Math.round((count / analytics.totalGrievances) * 100) || 0
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className={`text-sm text-gray-600 ${textClass}`}>
                    {category.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
            Submissions by Priority
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.byPriority).map(([priority, count]) => {
              const percentage = Math.round((count / analytics.totalGrievances) * 100) || 0
              const colorClass = 
                priority === 'critical' ? 'bg-red-600' :
                priority === 'high' ? 'bg-orange-600' :
                priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className={`text-sm text-gray-600 ${textClass}`}>
                    {priority.toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colorClass} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const QRCodeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
            Grievance QR Code
          </h3>
          <button
            onClick={() => setShowQRModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="text-center">
          <div className="bg-gray-100 p-8 rounded-lg mb-4">
            <QrCode className="h-32 w-32 text-gray-600 mx-auto" />
            <p className={`text-sm text-gray-600 mt-2 ${textClass}`}>
              Scan to submit grievance
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleDownloadQR}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${textClass}`}
            >
              <Download className="h-4 w-4" />
              <span>Download QR Code</span>
            </button>
            
            <button
              onClick={handlePrintQR}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${textClass}`}
            >
              <Printer className="h-4 w-4" />
              <span>Print QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            QR Code Dashboard
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            Manage QR codes and monitor mobile grievance submissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadDashboardData}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${textClass}`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
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
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className={`text-red-800 ${textClass}`}>{error}</span>
          </div>
        </div>
      )}

      {renderHeader()}
      {renderStatistics()}
      {renderQRCodeSection()}
      {renderAnalytics()}

      {showQRModal && <QRCodeModal />}
    </div>
  )
}

export default QRCodeDashboard 