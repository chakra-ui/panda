import { ErrorIcon, SuccessIcon } from '@/src/components/icons'
import { toast as toastStyles } from '@/styled-system/recipes'
import { Portal, Toast, createToaster } from '@ark-ui/react'

export type AppToastProviderProps = {
  children: React.ReactNode
}

export const [Toaster, toast] = createToaster({
  placement: 'top',
  render(toast) {
    return (
      <Toast.Root>
        <div data-part="icon" data-type={toast.type}>
          {icon[toast.type as 'success' | 'error']}
        </div>
        <div data-part="content">
          <Toast.Title>{toast.title}</Toast.Title>
          <Toast.Description>{toast.description}</Toast.Description>
        </div>
      </Toast.Root>
    )
  },
})

export const AppToastProvider = (props: AppToastProviderProps) => (
  <>
    <Portal>
      <Toaster className={toastStyles()} />
    </Portal>
    {props.children}
  </>
)

const icon = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
}
