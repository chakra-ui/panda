import { useRouter } from 'next/router'
import type { Heading } from 'nextra'
import type { FC, ReactElement, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import { ExpandIcon } from 'nextra/icons'
import type { Item, PageItem } from 'nextra/normalize-pages'
import { css, cx } from '@/styled-system/css'
import { useConfig, useMenu } from '@/nextra/contexts'
import { renderComponent } from '@/nextra/lib'
import { TreeView, Collapse, IconButton } from '@/nextra'
import { LocaleSwitch } from '../locale-switch'
import { SidebarBackdrop } from './sidebar-backdrop'
import { SidebarContainer } from './sidebar-container'
import { SidebarPlaceholder } from './sidebar-placeholder'
import { SidebarHeader } from './sidebar-header'
import { SidebarBody } from './sidebar-body'
import { SidebarFooter } from './sidebar-footer'

/* -----------------------------------------------------------------------------
 * ThemeSwitch Container
 * -----------------------------------------------------------------------------*/

interface IThemeSwitchContainer {
  showSidebar: boolean
  hasI18n: boolean
  children: ReactNode
}

const ThemeSwitchContainer: FC<IThemeSwitchContainer> = ({
  children,
  showSidebar,
  hasI18n
}) => (
  <div
    className={
      showSidebar && !hasI18n
        ? css({ flex: 1, display: 'flex', flexDirection: 'column' })
        : undefined
    }
  >
    {children}
  </div>
)

/* -----------------------------------------------------------------------------
 * Body classes
 * -----------------------------------------------------------------------------*/

const hiddenClass = css({
  overflow: 'hidden',
  md: { overflow: 'auto' }
})

/* -----------------------------------------------------------------------------
 * Sidebar
 * -----------------------------------------------------------------------------*/

interface SideBarProps {
  docsDirectories: PageItem[]
  flatDirectories: Item[]
  fullDirectories: Item[]
  asPopover?: boolean
  headings: Heading[]
  includePlaceholder: boolean
}

export function Sidebar({
  docsDirectories,
  flatDirectories,
  fullDirectories,
  asPopover = false,
  headings,
  includePlaceholder
}: SideBarProps): ReactElement {
  const config = useConfig()
  const { menu: isMobileMenuOpen, setMenu: setIsMobileMenuOpen } = useMenu()
  const router = useRouter()
  const [showSidebar, setSidebar] = useState(true)
  const [showToggleAnimation, setToggleAnimation] = useState(false)

  const anchors = useMemo(() => headings.filter(v => v.depth === 2), [headings])
  const sidebarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add(...hiddenClass.split(' '))
    } else {
      document.body.classList.remove(...hiddenClass.split(' '))
    }
    return () => {
      document.body.classList.remove(...hiddenClass.split(' '))
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const activeElements = sidebarRef.current?.querySelectorAll('li.active')

    if (activeElements?.length && (window.innerWidth > 767 || isMobileMenuOpen)) {
      // there is two menus in the DOM, first one rendered is desktop and second one is mobile
      // so we need to get active element from the right menu
      const activeElement = isMobileMenuOpen ? activeElements[1] : activeElements[0];

      const scroll = () => {
        scrollIntoView(activeElement, {
          block: 'center',
          inline: 'center',
          scrollMode: 'always',
          boundary: containerRef.current
        })
      }

      if (isMobileMenuOpen) {
        // needs for mobile since menu has transition transform
        setTimeout(scroll, 300)
      } else {
        scroll()
      }
    }
  }, [isMobileMenuOpen])

  // Always close mobile nav when route was changed (e.g. logo click)
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [router.asPath, setIsMobileMenuOpen])

  const hasI18n = config.i18n.length > 0
  const hasThemeSwitch = config.darkMode
  const hasFooter = hasThemeSwitch || hasI18n

  return (
    <>
      {includePlaceholder && asPopover ? <SidebarPlaceholder /> : null}
      <SidebarBackdrop isMobileMenuOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(false)} />
      <SidebarContainer
        ref={containerRef}
        showSidebar={showSidebar}
        isPopover={asPopover}
        isMobileMenuOpen={isMobileMenuOpen}
      >
        <SidebarHeader>
          {renderComponent(config.search.component, {
            directories: flatDirectories
          })}
        </SidebarHeader>

        <SidebarBody ref={sidebarRef} showSidebar={showSidebar}>
          {/**
           * Desktop Menu
           *
           * Without asPopover check <Collapse />'s inner.clientWidth on `layout: "raw"` will be 0
           * and element will not have width on initial loading.
           */}
          {(!asPopover || !showSidebar) && (
            <Collapse isOpen={showSidebar} horizontal>
              <TreeView
                className={css({ smDown: { display: 'none' } })}
                // The sidebar menu, shows only the docs directories.
                directories={docsDirectories}
                // When the viewport size is larger than `md`, hide the anchors in
                // the sidebar when `floatTOC` is enabled.
                anchors={config.toc.float ? [] : anchors}
                onlyCurrentDocs
              />
            </Collapse>
          )}

          {/* Mobile Menu */}
          <TreeView
            className={css({ md: { display: 'none' } })}
            // The mobile dropdown menu, shows all the directories.
            directories={fullDirectories}
            // Always show the anchor links on mobile (`md`).
            anchors={anchors}
          />
        </SidebarBody>

        {hasFooter && (
          <SidebarFooter
            showSidebar={showSidebar}
            hasI18n={hasI18n}
            showToggleAnimation={showToggleAnimation}
          >
            {hasI18n && (
              <LocaleSwitch
                options={config.i18n}
                lite={!showSidebar}
                className={cx(
                  showSidebar ? css({ flex: 1 }) : css({ mdDown: { flex: 1 } })
                )}
              />
            )}
            {hasThemeSwitch && (
              <ThemeSwitchContainer showSidebar={showSidebar} hasI18n={hasI18n}>
                {renderComponent(config.themeSwitch.component, {
                  lite: !showSidebar || hasI18n
                })}
              </ThemeSwitchContainer>
            )}
            {config.sidebar.toggleButton && (
              <IconButton
                aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                smDown={{ display: 'none' }}
                size="xs"
                variant="ghost"
                onClick={() => {
                  setSidebar(!showSidebar)
                  setToggleAnimation(true)
                }}
              >
                <ExpandIcon isOpen={showSidebar} />
              </IconButton>
            )}
          </SidebarFooter>
        )}
      </SidebarContainer>
    </>
  )
}
