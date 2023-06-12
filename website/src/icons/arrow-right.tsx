export function ArrowRightIcon({
  pathClassName,
  ...props
}: React.ComponentProps<'svg'> & { pathClassName?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5l7 7-7 7"
        className={pathClassName}
      />
    </svg>
  )
}
