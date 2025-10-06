import { toast } from "@/hooks/use-toast"

export const notifications = {
  success: (title: string, description?: string) => {
    toast({
      variant: "success",
      title,
      description,
    })
  },

  error: (title: string, description?: string) => {
    toast({
      variant: "destructive",
      title,
      description,
    })
  },

  warning: (title: string, description?: string) => {
    toast({
      variant: "warning",
      title,
      description,
    })
  },

  info: (title: string, description?: string) => {
    toast({
      variant: "default",
      title,
      description,
    })
  },

  // Common notification patterns
  eventCreated: () => {
    notifications.success("Event Created", "Photo event has been created successfully!")
  },

  eventUpdated: () => {
    notifications.success("Event Updated", "Photo event has been updated successfully!")
  },

  eventDeleted: () => {
    notifications.success("Event Deleted", "Photo event has been deleted successfully!")
  },

  photoUploaded: (count: number) => {
    notifications.success(
      "Photos Uploaded", 
      `${count} photo${count > 1 ? 's' : ''} uploaded successfully!`
    )
  },

  photoDeleted: (count: number) => {
    notifications.success(
      "Photos Deleted", 
      `${count} photo${count > 1 ? 's' : ''} deleted successfully!`
    )
  },

  galleryCreated: () => {
    notifications.success("Gallery Created", "Photo gallery has been created successfully!")
  },

  galleryUpdated: () => {
    notifications.success("Gallery Updated", "Photo gallery has been updated successfully!")
  },

  galleryDeleted: () => {
    notifications.success("Gallery Deleted", "Photo gallery has been deleted successfully!")
  },

  memberRegistered: () => {
    notifications.success("Member Registered", "New member has been registered successfully!")
  },

  memberUpdated: () => {
    notifications.success("Member Updated", "Member information has been updated successfully!")
  },

  memberDeleted: () => {
    notifications.success("Member Deleted", "Member has been deleted successfully!")
  },

  permissionUpdated: () => {
    notifications.success("Permissions Updated", "User permissions have been updated successfully!")
  },

  settingsSaved: () => {
    notifications.success("Settings Saved", "Your settings have been saved successfully!")
  },

  loginSuccess: () => {
    notifications.success("Login Successful", "Welcome back!")
  },

  logoutSuccess: () => {
    notifications.success("Logged Out", "You have been logged out successfully!")
  },

  // Error patterns
  networkError: () => {
    notifications.error("Network Error", "Please check your internet connection and try again.")
  },

  serverError: () => {
    notifications.error("Server Error", "Something went wrong. Please try again later.")
  },

  validationError: (message: string) => {
    notifications.error("Validation Error", message)
  },

  unauthorized: () => {
    notifications.error("Unauthorized", "You don't have permission to perform this action.")
  },

  notFound: (item: string) => {
    notifications.error("Not Found", `${item} could not be found.`)
  },

  // Warning patterns
  unsavedChanges: () => {
    notifications.warning("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?")
  },

  confirmDelete: (item: string) => {
    notifications.warning("Confirm Delete", `Are you sure you want to delete this ${item}?`)
  },

  // Info patterns
  loading: (action: string) => {
    notifications.info("Loading", `Please wait while we ${action}...`)
  },

  noData: (item: string) => {
    notifications.info("No Data", `No ${item} found.`)
  },

  comingSoon: (feature: string) => {
    notifications.info("Coming Soon", `${feature} will be available soon!`)
  }
}
