import { outdent } from 'outdent'

export function generateVueLayoutGrid() {
  return {
    dts: outdent`
    import type { FunctionalComponent } from 'vue'
    
    export type LayoutGridProps = {
      count?: number
      gutter?: string
      maxWidth?: string
      margin?: string
      outline?: boolean
    }

    export declare const LayoutGrid: FunctionalComponent<LayoutGridProps>
    `,
    js: outdent`
    import { h, computed } from 'vue'

    export const LayoutGrid = defineComponent({
        name: 'LayoutGrid',
        props: {
            count: {
            type: Number,
            default: 12,
            },
            margin: String,
            gutter: {
            type: String,
            default: '24px',
            },
            maxWidth: String,
            outline: Boolean,
        },
        setup(props) {
            const hasMaxWidthRef = computed(() => props.maxWidth != null)
            const variantRef = computed(() => (props.outline ? 'outline' : 'default'))
            return () => {
            const { count, margin, gutter, maxWidth } = props
            const hasMaxWidth = hasMaxWidthRef.value
            const variant = variantRef.value
        
            return h(
                'div',
                {
                class: 'panda-layout-grid',
                style: {
                    '--gutter': gutter,
                    '--count': count,
                    '--max-width': hasMaxWidth ? maxWidth : 'initial',
                    '--margin-x': hasMaxWidth ? 'auto' : undefined,
                    '--padding-x': !hasMaxWidth ? margin : undefined,
                },
                },
                Array.from({ length: count }, (_, i) => {
                return h('span', {
                    'data-variant': variant,
                    key: i,
                    class: 'panda-layout-grid__item',
                })
                }),
            )
            }
        },
      })      
    
    `,
  }
}
