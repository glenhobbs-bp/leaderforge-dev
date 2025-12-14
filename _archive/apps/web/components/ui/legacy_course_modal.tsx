import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"
import { Video } from 'lucide-react'
import { useVideoProgress } from '../../app/hooks/useVideoProgress'

interface CourseModalProps {
  isOpen: boolean
  onClose: () => void
  course: {
    id: string
    name: string
    date: string
    instructor: string
    videoUrl?: string
    videoLink?: string
  }
  nextTrainingDate: string | null
  onVideoComplete?: () => void
  userId?: string
}

// Simple Button component
function Button({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  className?: string
}) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  }
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1.5 text-sm"
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function CourseModal({ isOpen, onClose, course, nextTrainingDate, onVideoComplete, userId }: CourseModalProps) {
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Video progress tracking
  const {
    progress,
    updateProgress,
    markCompleted,
    isCompleted,
    progressPercentage
  } = useVideoProgress({
    userId: userId || '',
    contentId: course.id,
    duration: videoDuration
  })

  useEffect(() => {
    const fetchVideoUrlAndCheckCompletion = async () => {
      if (course?.id) {
        try {
          setLoading(true)
          console.log('Opening modal for course:', {
            courseId: course.id,
            courseName: course.name,
            existingVideoUrl: course.videoUrl,
            existingVideoLink: course.videoLink
          })

          // Fetch content from Tribe API
          const response = await fetch(`/api/tribe/content/${course.id}`)
          const contentData = await response.json()

          console.log('Modal content response:', {
            contentData,
            status: response.status,
            hasVideoUrl: !!contentData.videoUrl,
            hasFeaturedImage: !!contentData.featuredImage
          })

          if (!contentData.videoUrl) {
            console.error('No video URL found in content data')
          }

          // Set video and featured image URLs
          setVideoUrl(contentData.videoUrl ? `https://cdn.tribesocial.io/${contentData.videoUrl}` : null)
          setFeaturedImage(contentData.featuredImage ? `https://edge.tribesocial.io/${contentData.featuredImage}` : null)

        } catch (error) {
          console.error('Error in modal:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchVideoUrlAndCheckCompletion()
  }, [course])

  console.log('Modal render state:', {
    loading,
    hasVideoUrl: !!videoUrl,
    videoUrl,
    isCompleted: videoCompleted
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">{course.name}</DialogTitle>
          <DialogDescription className="text-gray-600">
            <strong>
              {videoCompleted ? "Review the training video and your completion status." : "Watch the training video and mark it as completed when you're done."}
            </strong>
            {nextTrainingDate && (
              <p className="text-sm text-gray-500 mt-2">
                Next training available: {nextTrainingDate}
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="aspect-video">
            {videoUrl ? (
              <div className="w-full h-full bg-black flex flex-col items-center justify-center rounded-xl overflow-hidden">
                {videoUrl.includes('iframe') ? (
                  <div dangerouslySetInnerHTML={{ __html: videoUrl }} className="w-full h-full" />
                ) : (
                  <video
                    className="w-full h-full rounded-xl vjs-tech"
                    controls
                    preload="none"
                    playsInline
                    tabIndex={-1}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center rounded-xl">
                {featuredImage ? (
                  <img
                    src={featuredImage}
                    alt={course.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <Video className="h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No video available</p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 bg-white">
            <div className="text-sm text-gray-500">
              {loading ? 'Loading...' : videoCompleted ? 'Completed' : 'Not completed'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="px-3 py-1.5"
              >
                Close
              </Button>
              {videoUrl && !videoCompleted && (
                <Button
                  size="sm"
                  onClick={() => {
                    setVideoCompleted(true);
                    onVideoComplete?.();
                  }}
                  className="px-3 py-1.5 bg-[var(--context-primary,#3b82f6)] hover:bg-[var(--context-primary-hover,#2563eb)] text-white"
                >
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}