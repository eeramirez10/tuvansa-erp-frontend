import { toast } from "sonner"

export type NotificationOptions = {
  description?: string
  duration?: number
  id?: string
}

const options = ({ description, duration, id }: NotificationOptions = {}) => ({
  ...(description ? { description } : {}),
  ...(duration ? { duration } : {}),
  ...(id ? { id } : {}),
})

export const notifications = {
  success(message: string, config?: NotificationOptions) {
    return toast.success(message, options(config))
  },
  error(message: string, config?: NotificationOptions) {
    return toast.error(message, options(config))
  },
  warning(message: string, config?: NotificationOptions) {
    return toast.warning(message, options(config))
  },
  info(message: string, config?: NotificationOptions) {
    return toast.info(message, options(config))
  },
  dismiss(id?: string | number) {
    toast.dismiss(id)
  },
}
