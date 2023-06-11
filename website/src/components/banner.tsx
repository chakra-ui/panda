import { bannerRecipe } from '@/styled-system/recipes'
import { XIcon } from 'nextra/icons'
import { useConfig } from '../contexts'
import { renderComponent } from '../lib'

export function Banner() {
  const { banner } = useConfig()
  if (!banner.text) {
    return null
  }
  const hideBannerScript = `try{if(localStorage.getItem(${JSON.stringify(
    banner.key
  )})==='0'){document.body.classList.add('nextra-banner-hidden')}}catch(e){}`

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: hideBannerScript }} />
      <div data-scope="banner" data-part="root" className={bannerRecipe({})}>
        <div data-scope="banner" data-part="content">
          {renderComponent(banner.text)}
        </div>
        {banner.dismissible && (
          <button
            data-scope="banner"
            data-part="close-button"
            type="button"
            aria-label="Dismiss banner"
            onClick={() => {
              try {
                localStorage.setItem(banner.key, '0')
              } catch {
                /* ignore */
              }
              document.body.classList.add('nextra-banner-hidden')
            }}
          >
            <XIcon data-scope="banner" data-part="close" />
          </button>
        )}
      </div>
    </>
  )
}
