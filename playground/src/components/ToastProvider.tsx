import { ErrorIcon, SuccessIcon } from '@/src/components/icons'
import { toast as toastStyles } from '@/styled-system/recipes'
import { Portal } from '@ark-ui/react/portal'
import { Toast, Toaster, createToaster } from '@ark-ui/react/toast'

export type AppToastProviderProps = {
  children: React.ReactNode
}

export const toaster = createToaster({
  placement: 'top',
})

export const AppToastProvider = (props: AppToastProviderProps) => (
  <>
    <Portal>
      <Toaster toaster={toaster} className={toastStyles()}>
        {function render(toast) {
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
        }}
      </Toaster>
    </Portal>
    {props.children}
  </>
)

const icon = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
}
