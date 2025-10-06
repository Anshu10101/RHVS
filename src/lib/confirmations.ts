import { useConfirmation } from '@/hooks/use-confirmation'

export const useConfirmations = () => {
  const confirmation = useConfirmation()

  return {
    ...confirmation,
    
    // Event confirmations
    confirmDeleteEvent: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Delete Event',
          description: 'Are you sure you want to delete this event? This will also delete all associated photos.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    confirmDeletePhoto: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Delete Photo',
          description: 'Are you sure you want to delete this photo? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    confirmDeletePhotos: (count: number, onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Delete Photos',
          description: `Are you sure you want to delete ${count} photo${count > 1 ? 's' : ''}? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    confirmDeleteGallery: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Delete Gallery',
          description: 'Are you sure you want to delete this gallery? This will also delete all photos in the gallery.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    // Member confirmations
    confirmDeleteMember: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Delete Member',
          description: 'Are you sure you want to delete this member? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    confirmApproveMember: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Approve Member',
          description: 'Are you sure you want to approve this member registration?',
          confirmText: 'Approve',
          cancelText: 'Cancel'
        },
        onConfirm
      )
    },

    confirmRejectMember: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Reject Member',
          description: 'Are you sure you want to reject this member registration?',
          confirmText: 'Reject',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    // General confirmations
    confirmAction: (title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'default') => {
      confirmation.confirm(
        {
          title,
          description,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant
        },
        onConfirm
      )
    },

    confirmUnsavedChanges: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Unsaved Changes',
          description: 'You have unsaved changes. Are you sure you want to leave?',
          confirmText: 'Leave',
          cancelText: 'Stay',
          variant: 'destructive'
        },
        onConfirm
      )
    },

    confirmLogout: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Logout',
          description: 'Are you sure you want to logout?',
          confirmText: 'Logout',
          cancelText: 'Cancel'
        },
        onConfirm
      )
    },

    confirmReset: (onConfirm: () => void) => {
      confirmation.confirm(
        {
          title: 'Reset Settings',
          description: 'Are you sure you want to reset all settings to default? This action cannot be undone.',
          confirmText: 'Reset',
          cancelText: 'Cancel',
          variant: 'destructive'
        },
        onConfirm
      )
    }
  }
}
