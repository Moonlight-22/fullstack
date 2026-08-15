import { useCallback, useEffect, useState } from 'react'
import { Heart, Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { postApi } from '../services/api.js'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function CommunityFeed({ user, onSuccess, onError }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [posting, setPosting] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentLoading, setCommentLoading] = useState({})

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await postApi.list({ per_page: 30 })
      setPosts(res.data.items || [])
    } catch (err) {
      onError?.(err.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [onError])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const createPost = async (event) => {
    event.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    try {
      await postApi.create({ content: content.trim(), image })
      setContent('')
      setImage(null)
      onSuccess?.('Post published!')
      loadPosts()
    } catch (err) {
      onError?.(err.message || 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId) => {
    try {
      const res = await postApi.toggleLike(postId)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked_by_viewer: res.data.liked, likes_count: res.data.likes_count }
            : p,
        ),
      )
    } catch (err) {
      onError?.(err.message || 'Failed to like post')
    }
  }

  const loadComments = async (postId) => {
    setCommentLoading((s) => ({ ...s, [postId]: true }))
    try {
      const res = await postApi.comments(postId)
      setCommentsByPost((s) => ({ ...s, [postId]: res.data.items || [] }))
    } catch (err) {
      onError?.(err.message || 'Failed to load comments')
    } finally {
      setCommentLoading((s) => ({ ...s, [postId]: false }))
    }
  }

  const toggleComments = async (postId) => {
    const open = !expandedComments[postId]
    setExpandedComments((s) => ({ ...s, [postId]: open }))
    if (open && !commentsByPost[postId]) {
      await loadComments(postId)
    }
  }

  const submitComment = async (postId) => {
    const text = (commentDrafts[postId] || '').trim()
    if (!text) return
    try {
      const res = await postApi.addComment(postId, text)
      setCommentsByPost((s) => ({
        ...s,
        [postId]: [...(s[postId] || []), res.data],
      }))
      setCommentDrafts((s) => ({ ...s, [postId]: '' }))
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)),
      )
    } catch (err) {
      onError?.(err.message || 'Failed to add comment')
    }
  }

  const deletePost = async (postId) => {
    try {
      await postApi.remove(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      onSuccess?.('Post deleted')
    } catch (err) {
      onError?.(err.message || 'Failed to delete post')
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="section-number">/ Community</p>
        <h2 className="heading-xl mt-2">Feed</h2>
        <p className="body-muted mt-2">Share updates, tips, or work highlights with clients and workers.</p>
      </div>

      <form onSubmit={createPost} className="card-editorial space-y-4">
        <div className="flex items-center gap-3">
          {user?.profile_image_url ? (
            <img src={user.profile_image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full surface-muted text-muted text-sm font-semibold">
              {user?.name?.[0] || '?'}
            </div>
          )}
          <p className="text-sm font-semibold text-app">{user?.name}</p>
        </div>
        <textarea
          rows="3"
          className="input-field resize-none"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="btn-outline cursor-pointer">
            Add photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </label>
          {image ? <span className="text-xs text-muted">{image.name}</span> : null}
          <button type="submit" disabled={posting || !content.trim()} className="btn-gold">
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Post
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-accent" size={28} /></div>
      ) : posts.length === 0 ? (
        <div className="card-editorial text-sm text-muted">No posts yet. Be the first to share something!</div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="card-editorial">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {post.user?.profile_image_url ? (
                  <img src={post.user.profile_image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full surface-muted text-muted text-sm font-semibold">
                    {post.user?.name?.[0] || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-app">{post.user?.name}</p>
                  <p className="text-xs text-muted capitalize">{post.user?.role} · {timeAgo(post.created_at)}</p>
                </div>
              </div>
              {post.user?.id === user?.id ? (
                <button type="button" onClick={() => deletePost(post.id)} className="btn-ghost p-1" aria-label="Delete post">
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-app">{post.content}</p>
            {post.image_url ? (
              <img src={post.image_url} alt="" className="mt-4 max-h-96 w-full rounded-xl object-cover" />
            ) : null}

            <div className="divider-h my-4" />

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-2 text-sm font-medium ${post.liked_by_viewer ? 'text-accent' : 'text-muted'}`}
              >
                <Heart size={16} fill={post.liked_by_viewer ? 'currentColor' : 'none'} />
                {post.likes_count || 0}
              </button>
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-2 text-sm font-medium text-muted"
              >
                <MessageCircle size={16} />
                {post.comments_count || 0}
              </button>
            </div>

            {expandedComments[post.id] ? (
              <div className="mt-4 space-y-3 rounded-xl surface-muted p-4">
                {commentLoading[post.id] ? (
                  <Loader2 className="mx-auto animate-spin text-accent" size={18} />
                ) : (
                  (commentsByPost[post.id] || []).map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <span className="font-semibold text-app">{comment.user?.name}</span>
                      <span className="text-muted"> · {timeAgo(comment.created_at)}</span>
                      <p className="mt-1 text-app">{comment.content}</p>
                    </div>
                  ))
                )}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    className="input-field !mt-0 flex-1"
                    placeholder="Write a comment..."
                    value={commentDrafts[post.id] || ''}
                    onChange={(e) => setCommentDrafts((s) => ({ ...s, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        submitComment(post.id)
                      }
                    }}
                  />
                  <button type="button" onClick={() => submitComment(post.id)} className="btn-gold">Send</button>
                </div>
              </div>
            ) : null}
          </article>
        ))
      )}
    </section>
  )
}
