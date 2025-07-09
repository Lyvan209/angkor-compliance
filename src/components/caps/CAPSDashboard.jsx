import { useState } from 'react'
import { 
  Target, 
  TrendingUp, 
  Users, 
  ,
  Plus,
  BarChart3,
  CheckCircle,
  ,
  AlertTriangle
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import CAPSManager from './CAPSManager'
import CAPForm from './CAPForm'

const CAPSDashboard = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCAP, setSelectedCAP] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateCAP = () => {
    setSelectedCAP(null)
    setShowCreateForm(true)
  }

  const handleEditCAP = (cap) => {
    setSelectedCAP(cap)
    setShowCreateForm(true)
  }

  const handleSaveCAP = (capData) => {
    setShowCreateForm(false)
    setSelectedCAP(null)
    // Trigger refresh of the manager component
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCancelForm = () => {
    setShowCreateForm(false)
    setSelectedCAP(null)
  }

  const renderHeader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${headerClass}`}>
            Action Management
          </h1>
          <p className={`text-gray-600 ${textClass}`}>
            SMART Corrective Action Plans (CAPs) with AI-powered root cause analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              Phase 4
            </div>
            <div className={`text-sm text-gray-600 ${textClass}`}>
              Action Management
            </div>
          </div>
          <button
            onClick={handleCreateCAP}
            className={`flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${textClass}`}
          >
            <Plus className="h-5 w-5" />
            <span>Create SMART CAP</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">
              SMART Framework
            </p>
            <p className="text-2xl font-bold">
              Enabled
            </p>
          </div>
          <div className="h-12 w-12 bg-blue-400 rounded-lg flex items-center justify-center">
            <Target className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-blue-100 text-sm">
            Specific • Measurable • Achievable • Relevant • Time-bound
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">
              Root Cause Analysis
            </p>
            <p className="text-2xl font-bold">
              AI-Powered
            </p>
          </div>
          <div className="h-12 w-12 bg-green-400 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-green-100 text-sm">
            Intelligent issue diagnosis and prevention
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">
              Progress Tracking
            </p>
            <p className="text-2xl font-bold">
              Real-time
            </p>
          </div>
          <div className="h-12 w-12 bg-purple-400 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-purple-100 text-sm">
            Live progress monitoring and updates
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium">
              Team Collaboration
            </p>
            <p className="text-2xl font-bold">
              Enhanced
            </p>
          </div>
          <div className="h-12 w-12 bg-orange-400 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-orange-100 text-sm">
            Assignment workflows and notifications
          </div>
        </div>
      </div>
    </div>
  )

  const renderFeatureHighlights = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${headerClass}`}>
        Phase 4 Features
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <h4 className={`font-semibold text-gray-900 mb-2 ${textClass}`}>
            SMART CAPs Foundation
          </h4>
          <p className={`text-sm text-gray-600 ${textClass}`}>
            Structured Corrective Action Plans following SMART criteria for maximum effectiveness
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Completed
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <h4 className={`font-semibold text-gray-900 mb-2 ${textClass}`}>
            AI Root Cause Analysis
          </h4>
          <p className={`text-sm text-gray-600 ${textClass}`}>
            Intelligent diagnosis of compliance issues with predictive insights and recommendations
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              🔄 In Progress
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h4 className={`font-semibold text-gray-900 mb-2 ${textClass}`}>
            Progress Tracking Workflows
          </h4>
          <p className={`text-sm text-gray-600 ${textClass}`}>
            Automated assignment, monitoring, and progress tracking with real-time updates
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              ⏳ Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      {renderHeader()}
      {renderQuickStats()}
      {renderFeatureHighlights()}
      
      <CAPSManager 
        user={user}
        organizationId={organizationId}
        onCreateCAP={handleCreateCAP}
        onEditCAP={handleEditCAP}
        refreshTrigger={refreshTrigger}
      />

      {showCreateForm && (
        <CAPForm
          cap={selectedCAP}
          onSave={handleSaveCAP}
          onCancel={handleCancelForm}
          organizationId={organizationId}
          user={user}
        />
      )}
    </div>
  )
}

export default CAPSDashboard 