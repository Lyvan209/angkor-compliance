import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import GrievanceManager from './GrievanceManager'
import GrievanceForm from './GrievanceForm'
import GrievanceDetails from './GrievanceDetails'

const Grievance = ({ user, organizationId }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [currentView, setCurrentView] = useState('manager') // 'manager', 'form', 'details'
  const [selectedGrievance, setSelectedGrievance] = useState(null)
  const [editingGrievance, setEditingGrievance] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateGrievance = () => {
    setEditingGrievance(null)
    setCurrentView('form')
  }

  const handleEditGrievance = (grievance) => {
    setEditingGrievance(grievance)
    setCurrentView('form')
  }

  const handleViewGrievance = (grievance) => {
    setSelectedGrievance(grievance)
    setCurrentView('details')
  }

  const handleFormSubmit = (grievanceData) => {
    setCurrentView('manager')
    setEditingGrievance(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFormClose = () => {
    setCurrentView('manager')
    setEditingGrievance(null)
  }

  const handleDetailsClose = () => {
    setCurrentView('manager')
    setSelectedGrievance(null)
  }

  const handleDetailsUpdate = (grievanceData) => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (currentView === 'form') {
    return (
      <GrievanceForm
        user={user}
        organizationId={organizationId}
        editingGrievance={editingGrievance}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
      />
    )
  }

  if (currentView === 'details' && selectedGrievance) {
    return (
      <GrievanceDetails
        grievanceId={selectedGrievance.id}
        user={user}
        onClose={handleDetailsClose}
        onUpdate={handleDetailsUpdate}
      />
    )
  }

  return (
    <GrievanceManager
      user={user}
      organizationId={organizationId}
      onCreateGrievance={handleCreateGrievance}
      onEditGrievance={handleEditGrievance}
      onViewGrievance={handleViewGrievance}
      refreshTrigger={refreshTrigger}
    />
  )
}

export default Grievance 