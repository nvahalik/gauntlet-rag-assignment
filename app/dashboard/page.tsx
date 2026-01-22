'use client'

import { useState } from 'react'
import { 
  FileText, 
  Search, 
  MessageCircle, 
  Upload,
} from 'lucide-react'
import DocumentUpload from '@/components/document-upload'
import DocumentList from '@/components/document-list'
import SearchInterface from '@/components/search-interface'
import ChatInterface from '@/components/chat-interface'

type TabType = 'upload' | 'search' | 'chat' | 'documents'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
    // Switch to documents tab after successful upload
    setTimeout(() => setActiveTab('documents'), 500)
  }

  const handleClearComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                RAG Document Search
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Documents
              </h2>
              <p className="text-gray-600">
                Upload your Markdown documents to start searching and chatting with your content.
              </p>
            </div>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Documents
              </h2>
              <p className="text-gray-600">
                View and manage your uploaded documents.
              </p>
            </div>
            <DocumentList refreshTrigger={refreshTrigger} onClearComplete={handleClearComplete} />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Search Documents
              </h2>
              <p className="text-gray-600">
                Search through your uploaded documents using semantic similarity.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <SearchInterface />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Chat with Documents
              </h2>
              <p className="text-gray-600">
                Ask questions and get AI-powered answers based on your documents.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg h-[600px]">
              <ChatInterface />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}