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

const classes = toastStyles()

export const AppToastProvider = (props: AppToastProviderProps) => (
  <>
    <Portal>
      <Toaster toaster={toaster} className={classes.group}>
        {function render(toast) {
          return (
            <Toast.Root className={classes.root}>
              <div className={classes.icon} data-type={toast.type}>
                {icon[toast.type as 'success' | 'error']}
              </div>
              <div className={classes.content}>
                <Toast.Title className={classes.title}>{toast.title}</Toast.Title>
                <Toast.Description className={classes.description}>{toast.description}</Toast.Description>
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
