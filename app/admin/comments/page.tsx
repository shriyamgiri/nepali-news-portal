'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, XCircle, Trash2, Search, User } from 'lucide-react'

interface Comment {
  id: string
  article_id: string
  commenter_name: string
  commenter_email: string
  comment_text: string
  status: string
  created_at: string
  like_count: number
  articles?: {
    nepali_title: string
    original_title: string
  }
}

export default function CommentsModeration() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
  }, [filter])

  const loadComments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/comments')
      const data = await response.json()
      
      // Filter on client side for now
      let filtered = data.comments || []
      if (filter !== 'all') {
        filtered = filtered.filter((c: Comment) => c.status === filter)
      }
      
      setComments(filtered)
    } catch (error) {
      console.error('Error loading comments:', error)
      alert('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, commenterName: string) => {
    setProcessingId(id)
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      })

      if (!response.ok) throw new Error('Failed to approve comment')

      setComments(comments.map(c => 
        c.id === id ? { ...c, status: 'approved' } : c
      ))
      
      alert(`✅ Comment from ${commenterName} approved!`)
    } catch (error) {
      console.error('Error approving comment:', error)
      alert('❌ Failed to approve comment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string, commenterName: string) => {
    if (!confirm(`Reject comment from ${commenterName}?`)) return

    setProcessingId(id)
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      })

      if (!response.ok) throw new Error('Failed to reject comment')

      setComments(comments.map(c => 
        c.id === id ? { ...c, status: 'rejected' } : c
      ))
      
      alert(`❌ Comment from ${commenterName} rejected`)
    } catch (error) {
      console.error('Error rejecting comment:', error)
      alert('❌ Failed to reject comment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleBulkApprove = async () => {
    const pendingComments = comments.filter(c => c.status === 'pending')
    
    if (pendingComments.length === 0) {
      alert('No pending comments to approve')
      return
    }

    if (!confirm(`Approve all ${pendingComments.length} pending comments?`)) return

    try {
      for (const comment of pendingComments) {
        await fetch('/api/admin/comments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: comment.id, status: 'approved' }),
        })
      }

      loadComments()
      alert(`✅ ${pendingComments.length} comments approved!`)
    } catch (error) {
      console.error('Error bulk approving:', error)
      alert('❌ Failed to approve all comments')
    }
  }

  const filteredComments = comments.filter(comment =>
    comment.commenter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.comment_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comment.articles?.nepali_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingCount = comments.filter(c => c.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comments Moderation</h1>
          <p className="text-gray-600 mt-1">
            Review and moderate user comments • {pendingCount} pending
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            Approve All Pending
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comments...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No comments found</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'No comments match your search.' 
              : filter === 'pending'
              ? 'No pending comments to review.'
              : `No ${filter} comments.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div 
              key={comment.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{comment.commenter_name}</h3>
                      <p className="text-sm text-gray-500">{comment.commenter_email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    comment.status === 'approved' ? 'bg-green-100 text-green-800' :
                    comment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    comment.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {comment.status.toUpperCase()}
                  </span>
                </div>

                {/* Article Reference */}
                {comment.articles && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 font-medium">Comment on article:</p>
                    <p className="text-sm text-blue-900 nepali-text mt-1">
                      {comment.articles.nepali_title || comment.articles.original_title}
                    </p>
                  </div>
                )}

                {/* Comment Text */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-800 nepali-text leading-relaxed">
                    {comment.comment_text}
                  </p>
                </div>

                {/* Actions */}
                {comment.status === 'pending' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(comment.id, comment.commenter_name)}
                      disabled={processingId === comment.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(comment.id, comment.commenter_name)}
                      disabled={processingId === comment.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {comment.status === 'approved' && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>This comment is published on the website</span>
                  </div>
                )}

                {comment.status === 'rejected' && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>This comment was rejected and is not visible</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}