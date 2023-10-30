import { ErrorIcon, SuccessIcon } from './icons'
import { toast as toastStyles } from 'styled-system/recipes'
import {
  Toast,
  ToastDescription,
  ToastGroup,
  ToastPlacements,
  ToastProvider,
  ToastTitle,
  Portal,
} from '@ark-ui/react'

export type AppToastProviderProps = {
  children: React.ReactNode
}

export const AppToastProvider = (props: AppToastProviderProps) => (
  <ToastProvider>
    <Portal>
      <ToastPlacements>
        {(placements) =>
          placements.map((placement) => (
            <ToastGroup
              key={placement}
              placement={placement}
              className={toastStyles()}
            >
              {(toasts) =>
                toasts.map((toast) => {
                  return (
                    <Toast key={toast.id} toast={toast}>
                      <div
                        data-part='icon'
                        data-type={toast.state.context.type}
                      >
                        {icon[toast.state.context.type as 'success' | 'error']}
                      </div>
                      <div data-part='content'>
                        <ToastTitle />
                        <ToastDescription />
                      </div>
                    </Toast>
                  )
                })
              }
            </ToastGroup>
          ))
        }
      </ToastPlacements>
    </Portal>
    {props.children}
  </ToastProvider>
)

const icon = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
}
