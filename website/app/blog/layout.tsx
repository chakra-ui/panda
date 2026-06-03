import { Navbar } from '@/components/navbar'
import { FooterSection } from '@/www/footer.section'

export default function BlogLayout(props: React.PropsWithChildren) {
  const { children } = props
  return (
    <div>
      <Navbar />
      <main>{children}</main>
      <FooterSection />
    </div>
  )
}
