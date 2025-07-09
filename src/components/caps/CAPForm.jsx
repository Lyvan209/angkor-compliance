import { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Plus,
  Trash2,
  ,
  ,
  AlertTriangle,
  Target,
  BarChart3,
  CheckSquare,
  Clock,
  FileText,
  Star
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTranslations } from '../../translations'
import { useLanguageStyles } from '../../hooks/useLanguageStyles'
import { 
  createCAP,
  updateCAP,
  getUsers,
  analyzeRootCause,
  createCAPAction
} from '../../lib/supabase-enhanced'

const CAPForm = ({ cap, onSave, onCancel, organizationId, user }) => {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { textClass, headerClass } = useLanguageStyles()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
    due_date: '',
    related_issue_id: '',
    specific_objective: '',
    measurable_criteria: '',
    achievable_plan: '',
    relevant_justification: '',
    time_bound_deadline: '',
    estimated_cost: '',
    resources_required: '',
    success_metrics: '',
    review_frequency: 'weekly'
  })
  
  const [actions, setActions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showRootCauseAnalysis, setShowRootCauseAnalysis] = useState(false)
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState(null)
  const [activeTab, setActiveTab] = useState('basic') // 'basic', 'smart', 'actions', 'analysis'

  useEffect(() => {
    loadUsers()
    if (cap) {
      setFormData({
        title: cap.title || '',
        description: cap.description || '',
        priority: cap.priority || 'medium',
        assignee_id: cap.assignee_id || '',
        due_date: cap.due_date ? cap.due_date.split('T')[0] : '',
        related_issue_id: cap.related_issue_id || '',
        specific_objective: cap.specific_objective || '',
        measurable_criteria: cap.measurable_criteria || '',
        achievable_plan: cap.achievable_plan || '',
        relevant_justification: cap.relevant_justification || '',
        time_bound_deadline: cap.time_bound_deadline || '',
        estimated_cost: cap.estimated_cost || '',
        resources_required: cap.resources_required || '',
        success_metrics: cap.success_metrics || '',
        review_frequency: cap.review_frequency || 'weekly'
      })
    }
  }, [cap])

  const loadUsers = async () => {
    try {
      const result = await getUsers(organizationId)
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Basic validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    }
    
    // SMART criteria validation
    if (!formData.specific_objective.trim()) {
      newErrors.specific_objective = 'Specific objective is required for SMART CAP'
    }
    if (!formData.measurable_criteria.trim()) {
      newErrors.measurable_criteria = 'Measurable criteria is required for SMART CAP'
    }
    if (!formData.achievable_plan.trim()) {
      newErrors.achievable_plan = 'Achievable plan is required for SMART CAP'
    }
    if (!formData.relevant_justification.trim()) {
      newErrors.relevant_justification = 'Relevant justification is required for SMART CAP'
    }
    if (!formData.time_bound_deadline.trim()) {
      newErrors.time_bound_deadline = 'Time-bound deadline is required for SMART CAP'
    }
    
    // Date validation
    if (formData.due_date && new Date(formData.due_date) <= new Date()) {
      newErrors.due_date = 'Due date must be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const capData = {
        ...formData,
        organization_id: organizationId,
        created_by: cap ? cap.created_by : user.id,
        updated_by: user.id
      }

      let result
      if (cap) {
        result = await updateCAP(cap.id, capData)
      } else {
        result = await createCAP(capData)
      }

      if (result.success) {
        // Create associated actions
        for (const action of actions) {
          if (action.title && !action.id) {
            await createCAPAction({
              cap_id: result.data.id,
              title: action.title,
              description: action.description,
              assignee_id: action.assignee_id,
              due_date: action.due_date,
              sequence_order: action.sequence_order
            })
          }
        }

        onSave(result.data)
      }
    } catch (error) {
      console.error('Failed to save CAP:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRootCauseAnalysis = async () => {
    if (!formData.related_issue_id) {
      return
    }

    setLoading(true)
    try {
      const result = await analyzeRootCause(formData.related_issue_id, organizationId)
      if (result.success) {
        setRootCauseAnalysis(result.data)
        setShowRootCauseAnalysis(true)
        
        // Auto-populate recommended actions
        const recommendedActions = result.data.recommended_actions.map((action, index) => ({
          id: `temp_${index}`,
          title: action,
          description: `Recommended action based on root cause analysis`,
          assignee_id: '',
          due_date: '',
          sequence_order: index + 1,
          status: 'pending'
        }))
        
        setActions(prev => [...prev, ...recommendedActions])
      }
    } catch (error) {
      console.error('Root cause analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAction = () => {
    const newAction = {
      id: `temp_${Date.now()}`,
      title: '',
      description: '',
      assignee_id: '',
      due_date: '',
      sequence_order: actions.length + 1,
      status: 'pending'
    }
    setActions(prev => [...prev, newAction])
  }

  const updateAction = (index, field, value) => {
    setActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ))
  }

  const removeAction = (index) => {
    setActions(prev => prev.filter((_, i) => i !== index))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-300 bg-white'
    }
  }

  const renderTabs = () => (
    <div className="mb-6">
      <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'basic', label: 'Basic Info', icon: FileText },
          { id: 'smart', label: 'SMART Criteria', icon: Star },
          { id: 'actions', label: 'Actions', icon: CheckSquare },
          { id: 'analysis', label: 'Root Cause', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } ${textClass}`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            CAP Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
            placeholder="Enter a clear, descriptive title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Priority *
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${getPriorityColor(formData.priority)} ${textClass}`}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          } ${textClass}`}
          placeholder="Provide a detailed description of the corrective action plan"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Assigned To
          </label>
          <select
            value={formData.assignee_id}
            onChange={(e) => handleInputChange('assignee_id', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="">Select assignee</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name} - {user.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Due Date *
          </label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => handleInputChange('due_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.due_date ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
          />
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Estimated Cost
          </label>
          <input
            type="number"
            value={formData.estimated_cost}
            onChange={(e) => handleInputChange('estimated_cost', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Review Frequency
          </label>
          <select
            value={formData.review_frequency}
            onChange={(e) => handleInputChange('review_frequency', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
          Resources Required
        </label>
        <textarea
          value={formData.resources_required}
          onChange={(e) => handleInputChange('resources_required', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
          placeholder="List the resources, personnel, or equipment needed"
        />
      </div>
    </div>
  )

  const renderSMARTCriteria = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className={`text-lg font-semibold text-blue-900 mb-2 ${headerClass}`}>
          SMART Criteria Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-800">Specific</div>
            <div className="text-blue-700">Clear, well-defined objective</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Measurable</div>
            <div className="text-blue-700">Quantifiable success criteria</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Achievable</div>
            <div className="text-blue-700">Realistic and attainable</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Relevant</div>
            <div className="text-blue-700">Aligned with goals</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Time-bound</div>
            <div className="text-blue-700">Clear deadline</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            <Target className="inline h-4 w-4 mr-2" />
            Specific Objective *
          </label>
          <textarea
            value={formData.specific_objective}
            onChange={(e) => handleInputChange('specific_objective', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.specific_objective ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
            placeholder="What exactly will be accomplished? Be specific and clear."
          />
          {errors.specific_objective && (
            <p className="mt-1 text-sm text-red-600">{errors.specific_objective}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            <BarChart3 className="inline h-4 w-4 mr-2" />
            Measurable Criteria *
          </label>
          <textarea
            value={formData.measurable_criteria}
            onChange={(e) => handleInputChange('measurable_criteria', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.measurable_criteria ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
            placeholder="How will success be measured? Include specific metrics and KPIs."
          />
          {errors.measurable_criteria && (
            <p className="mt-1 text-sm text-red-600">{errors.measurable_criteria}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            <CheckSquare className="inline h-4 w-4 mr-2" />
            Achievable Plan *
          </label>
          <textarea
            value={formData.achievable_plan}
            onChange={(e) => handleInputChange('achievable_plan', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.achievable_plan ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
            placeholder="How will this be achieved? Is it realistic with available resources?"
          />
          {errors.achievable_plan && (
            <p className="mt-1 text-sm text-red-600">{errors.achievable_plan}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            <Star className="inline h-4 w-4 mr-2" />
            Relevant Justification *
          </label>
          <textarea
            value={formData.relevant_justification}
            onChange={(e) => handleInputChange('relevant_justification', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.relevant_justification ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
            placeholder="Why is this important? How does it align with organizational goals?"
          />
          {errors.relevant_justification && (
            <p className="mt-1 text-sm text-red-600">{errors.relevant_justification}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            <Clock className="inline h-4 w-4 mr-2" />
            Time-bound Deadline *
          </label>
          <textarea
            value={formData.time_bound_deadline}
            onChange={(e) => handleInputChange('time_bound_deadline', e.target.value)}
            rows={2}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.time_bound_deadline ? 'border-red-500' : 'border-gray-300'
            } ${textClass}`}
            placeholder="When will this be completed? Include specific deadlines and milestones."
          />
          {errors.time_bound_deadline && (
            <p className="mt-1 text-sm text-red-600">{errors.time_bound_deadline}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${textClass}`}>
            Success Metrics
          </label>
          <textarea
            value={formData.success_metrics}
            onChange={(e) => handleInputChange('success_metrics', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
            placeholder="Define how success will be measured and evaluated"
          />
        </div>
      </div>
    </div>
  )

  const renderActions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Action Items
        </h3>
        <button
          type="button"
          onClick={addAction}
          className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${textClass}`}
        >
          <Plus className="h-4 w-4" />
          <span>Add Action</span>
        </button>
      </div>

      <div className="space-y-4">
        {actions.map((action, index) => (
          <div key={action.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium text-gray-700 ${textClass}`}>
                Action {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeAction(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={action.title}
                  onChange={(e) => updateAction(index, 'title', e.target.value)}
                  placeholder="Action title"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                />
              </div>
              
              <div className="md:col-span-2">
                <textarea
                  value={action.description}
                  onChange={(e) => updateAction(index, 'description', e.target.value)}
                  placeholder="Action description"
                  rows={2}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                />
              </div>
              
              <div>
                <select
                  value={action.assignee_id}
                  onChange={(e) => updateAction(index, 'assignee_id', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                >
                  <option value="">Select assignee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <input
                  type="date"
                  value={action.due_date}
                  onChange={(e) => updateAction(index, 'due_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${textClass}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {actions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className={`mb-4 ${textClass}`}>No actions added yet</p>
          <button
            type="button"
            onClick={addAction}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto ${textClass}`}
          >
            <Plus className="h-4 w-4" />
            <span>Add First Action</span>
          </button>
        </div>
      )}
    </div>
  )

  const renderRootCauseAnalysis = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold text-gray-900 ${headerClass}`}>
          Root Cause Analysis
        </h3>
        <button
          type="button"
          onClick={handleRootCauseAnalysis}
          disabled={!formData.related_issue_id || loading}
          className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 ${textClass}`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analyze Root Cause</span>
        </button>
      </div>

      {!formData.related_issue_id && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className={`text-yellow-800 ${textClass}`}>
              Select a related compliance issue to enable root cause analysis
            </span>
          </div>
        </div>
      )}

      {rootCauseAnalysis && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className={`font-semibold text-gray-900 mb-3 ${textClass}`}>
              Primary Cause
            </h4>
            <p className={`text-gray-700 ${textClass}`}>
              {rootCauseAnalysis.primary_cause}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className={`font-semibold text-gray-900 mb-3 ${textClass}`}>
              Contributing Factors
            </h4>
            <ul className="space-y-2">
              {rootCauseAnalysis.contributing_factors.map((factor, index) => (
                <li key={index} className={`text-gray-700 ${textClass}`}>
                  • {factor}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className={`font-semibold text-gray-900 mb-3 ${textClass}`}>
              Risk Assessment
            </h4>
            <div className="flex items-center space-x-4 mb-3">
              <span className={`px-3 py-1 text-sm rounded-full ${
                rootCauseAnalysis.risk_assessment.level === 'high' ? 'bg-red-100 text-red-800' :
                rootCauseAnalysis.risk_assessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {rootCauseAnalysis.risk_assessment.level.toUpperCase()} RISK
              </span>
              <span className={`text-sm text-gray-600 ${textClass}`}>
                Mitigation urgency: {rootCauseAnalysis.risk_assessment.mitigation_urgency.replace('_', ' ')}
              </span>
            </div>
            <ul className="space-y-1">
              {rootCauseAnalysis.risk_assessment.factors.map((factor, index) => (
                <li key={index} className={`text-sm text-gray-600 ${textClass}`}>
                  • {factor}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className={`font-semibold text-gray-900 mb-3 ${textClass}`}>
              Prevention Measures
            </h4>
            <ul className="space-y-2">
              {rootCauseAnalysis.prevention_measures.map((measure, index) => (
                <li key={index} className={`text-gray-700 ${textClass}`}>
                  • {measure}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold text-gray-900 ${headerClass}`}>
              {cap ? 'Edit CAP' : 'Create New SMART CAP'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {renderTabs()}
          
          <div className="space-y-6">
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'smart' && renderSMARTCriteria()}
            {activeTab === 'actions' && renderActions()}
            {activeTab === 'analysis' && renderRootCauseAnalysis()}
          </div>

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 ${textClass}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${textClass}`}
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : (cap ? 'Update CAP' : 'Create CAP')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CAPForm 